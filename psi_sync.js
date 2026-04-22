/**
 * Reportive by Avonetiq — PageSpeed Insights Sync  v1.0
 * ======================================================
 * Fetch Core Web Vitals dari Google PageSpeed Insights API
 * dan simpan ke Supabase tabel "pagespeed" setiap hari.
 *
 * ── SETUP (lakukan sekali) ─────────────────────────────────────
 * 1. Buka script.google.com → New project → paste file ini
 * 2. Isi CONFIG di bawah (PSI_API_KEY, SUPABASE_*, URLS_TO_TEST)
 * 3. Jalankan testSync() manual pertama kali untuk test + authorize
 * 4. Jalankan setupDailyTrigger() untuk auto-run setiap hari jam 6 pagi
 *
 * ── CARA DAPAT PSI API KEY ────────────────────────────────────
 * 1. Buka console.cloud.google.com
 * 2. APIs & Services → Library → cari "PageSpeed Insights API" → Enable
 * 3. APIs & Services → Credentials → Create Credentials → API Key
 * 4. (Opsional) Restrict key ke "PageSpeed Insights API" saja
 *
 * ── CARA DAPAT SUPABASE SERVICE KEY ──────────────────────────
 * Supabase Dashboard → Settings → API → service_role key
 * JANGAN gunakan anon key untuk write operations.
 */

// ════════════════════════════════════════════════════════════════
//  CONFIG — isi sesuai project Anda
// ════════════════════════════════════════════════════════════════
const PSI_CONFIG = {
  // Google Cloud API Key dengan PageSpeed Insights API enabled
  PSI_API_KEY: 'AIzaSyBhBZC5HdzefmMhTA7gNJ1T2Ra13Q3fCkA',

  // Supabase — project khusus PSI
  SUPABASE_URL: 'https://dpthobkylyuajaleykyf.supabase.co',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdGhvYmt5bHl1YWphbGV5a3lmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjgzOTEwNiwiZXhwIjoyMDkyNDE1MTA2fQ.e3eoggi1HnlPn74oWu4r2N_dzkHWdlq5TRniG1NRGSo',

  // URL yang ingin di-test (tambah/kurangi sesuai kebutuhan)
  URLS_TO_TEST: [
    'https://avonetiq.com',
    'https://avonetiq.com/services',
    'https://avonetiq.com/blog',
  ],

  // Strategy: ['mobile', 'desktop'] atau ['mobile'] saja
  STRATEGIES: ['mobile', 'desktop'],

  // Kirim notifikasi email jika sync gagal
  NOTIFY_EMAIL: '',  // kosongkan jika tidak perlu

  // Delay antar request (ms) — hindari rate limit
  REQUEST_DELAY_MS: 1500,
};

// ════════════════════════════════════════════════════════════════
//  MAIN FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Entry point utama — dipanggil oleh trigger harian
 */
function syncPageSpeed() {
  const startTime = Date.now();
  const today     = _todayDate();
  const results   = { success: 0, skipped: 0, error: 0, rows: [] };

  Logger.log('=== PSI Sync Start: ' + today + ' ===');

  for (const url of PSI_CONFIG.URLS_TO_TEST) {
    for (const strategy of PSI_CONFIG.STRATEGIES) {

      // Cek apakah hari ini sudah pernah di-sync
      if (_alreadySynced(url, strategy, today)) {
        Logger.log('[SKIP] ' + url + ' (' + strategy + ') sudah ada untuk ' + today);
        results.skipped++;
        continue;
      }

      try {
        const row = _fetchPSI(url, strategy, today);
        _upsertToSupabase(row);
        results.rows.push(row);
        results.success++;
        Logger.log('[OK] ' + url + ' ' + strategy + ' — score: ' + row.performance_score
          + ', LCP: ' + row.lcp + 'ms, CLS: ' + row.cls + ', TBT: ' + row.tbt + 'ms');

        // Delay antar request
        if (PSI_CONFIG.REQUEST_DELAY_MS > 0) Utilities.sleep(PSI_CONFIG.REQUEST_DELAY_MS);

      } catch (e) {
        results.error++;
        Logger.log('[ERROR] ' + url + ' ' + strategy + ': ' + e.message);
      }
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  Logger.log('=== PSI Sync Done: ' + results.success + ' sukses, '
    + results.skipped + ' skip, ' + results.error + ' error — ' + elapsed + 's ===');

  if (results.error > 0 && PSI_CONFIG.NOTIFY_EMAIL) {
    _sendErrorEmail(results.error + ' URL gagal disync. Cek Apps Script logs.');
  }

  return results;
}

/**
 * Test manual — jalankan ini pertama kali untuk verifikasi
 */
function testSync() {
  Logger.log('=== TEST: Fetch 1 URL saja ===');
  const url      = PSI_CONFIG.URLS_TO_TEST[0];
  const strategy = 'mobile';
  const today    = _todayDate();

  const row = _fetchPSI(url, strategy, today);
  Logger.log('Data yang akan dikirim ke Supabase:');
  Logger.log(JSON.stringify(row, null, 2));

  // Kirim langsung ke Supabase (standalone script tidak support SpreadsheetApp.getUi)
  _upsertToSupabase(row);
  Logger.log('Berhasil dikirim ke Supabase!');
}

/**
 * Setup trigger harian (jalankan sekali saja)
 */
function setupDailyTrigger() {
  // Hapus trigger lama jika ada
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'syncPageSpeed')
    .forEach(t => ScriptApp.deleteTrigger(t));

  // Buat trigger baru — jam 06:00 setiap hari
  ScriptApp.newTrigger('syncPageSpeed')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();

  Logger.log('Trigger dibuat: syncPageSpeed() jalan setiap hari jam 06:00');
}

/**
 * Hapus semua trigger PSI (untuk reset)
 */
function removeTriggers() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'syncPageSpeed')
    .forEach(t => { ScriptApp.deleteTrigger(t); Logger.log('Trigger dihapus: ' + t.getUniqueId()); });
}

// ════════════════════════════════════════════════════════════════
//  INTERNAL HELPERS
// ════════════════════════════════════════════════════════════════

/**
 * Fetch data dari PageSpeed Insights API
 * Docs: https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed
 */
function _fetchPSI(url, strategy, day) {
  const endpoint = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'
    + '?url='      + encodeURIComponent(url)
    + '&key='      + PSI_CONFIG.PSI_API_KEY
    + '&strategy=' + strategy
    + '&category=performance&category=accessibility&category=seo&category=best-practices';

  const res = UrlFetchApp.fetch(endpoint, { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    throw new Error('PSI API error ' + res.getResponseCode() + ': ' + res.getContentText().substring(0, 200));
  }

  const data = JSON.parse(res.getContentText());
  const lhr  = data.lighthouseResult;
  const cats  = lhr?.categories  || {};
  const auds  = lhr?.audits      || {};
  const crux  = data.loadingExperience?.metrics || {};

  // Helper: ambil numeric value dari audit
  const num = (key) => {
    const v = auds[key]?.numericValue;
    return v != null ? Math.round(v * 100) / 100 : null;
  };

  // CWV status dari CrUX (real user data)
  const cruxLcp   = crux['LARGEST_CONTENTFUL_PAINT_MS'];
  const cruxCls   = crux['CUMULATIVE_LAYOUT_SHIFT_SCORE'];
  const cruxInp   = crux['INTERACTION_TO_NEXT_PAINT'];

  const _cwvStatus = (cat) => {
    if (!cat) return null;
    const pct = cat.distributions || [];
    // category: FAST/AVERAGE/SLOW → good/needs-improvement/poor
    const cat_str = cat.category;
    if (cat_str === 'FAST')    return 'good';
    if (cat_str === 'AVERAGE') return 'needs-improvement';
    if (cat_str === 'SLOW')    return 'poor';
    return null;
  };

  return {
    url,
    strategy,
    day,

    // Lighthouse scores (0-100)
    performance_score:    Math.round((cats.performance?.score   || 0) * 100),
    accessibility_score:  Math.round((cats.accessibility?.score || 0) * 100),
    seo_score:            Math.round((cats.seo?.score           || 0) * 100),
    best_practices_score: Math.round((cats['best-practices']?.score || 0) * 100),

    // Lab data (Lighthouse)
    lcp: num('largest-contentful-paint'),
    fcp: num('first-contentful-paint'),
    cls: num('cumulative-layout-shift'),
    tbt: num('total-blocking-time'),
    si:  num('speed-index'),
    tti: num('interactive'),
    inp: num('interaction-to-next-paint'),

    // CrUX field data (real users)
    crux_lcp_ms: cruxLcp ? cruxLcp.percentile : null,
    crux_cls:    cruxCls ? cruxCls.percentile / 100 : null,
    crux_inp_ms: cruxInp ? cruxInp.percentile : null,

    // CWV status
    lcp_status: _cwvStatus(cruxLcp),
    cls_status: _cwvStatus(cruxCls),
    inp_status: _cwvStatus(cruxInp),
  };
}

/**
 * Upsert satu baris ke Supabase (ON CONFLICT → update)
 */
function _upsertToSupabase(row) {
  const res = UrlFetchApp.fetch(PSI_CONFIG.SUPABASE_URL + '/rest/v1/pagespeed', {
    method:           'POST',
    muteHttpExceptions: true,
    headers: {
      'apikey':        PSI_CONFIG.SUPABASE_SERVICE_KEY,
      'Authorization': 'Bearer ' + PSI_CONFIG.SUPABASE_SERVICE_KEY,
      'Content-Type':  'application/json',
      'Prefer':        'resolution=merge-duplicates',  // ON CONFLICT DO UPDATE
    },
    payload: JSON.stringify(row),
  });

  const code = res.getResponseCode();
  if (code !== 200 && code !== 201) {
    throw new Error('Supabase upsert gagal (' + code + '): ' + res.getContentText().substring(0, 300));
  }
}

/**
 * Cek apakah (url, strategy, day) sudah ada di Supabase
 */
function _alreadySynced(url, strategy, day) {
  const qs = new URLSearchParams({
    select: 'id',
    url:      'eq.' + url,
    strategy: 'eq.' + strategy,
    day:      'eq.' + day,
    limit:    '1',
  });

  const res = UrlFetchApp.fetch(PSI_CONFIG.SUPABASE_URL + '/rest/v1/pagespeed?' + qs, {
    muteHttpExceptions: true,
    headers: {
      'apikey':        PSI_CONFIG.SUPABASE_SERVICE_KEY,
      'Authorization': 'Bearer ' + PSI_CONFIG.SUPABASE_SERVICE_KEY,
    },
  });

  const data = JSON.parse(res.getContentText());
  return Array.isArray(data) && data.length > 0;
}

/**
 * Tanggal hari ini dalam format YYYY-MM-DD (WIB / Jakarta)
 */
function _todayDate() {
  const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
  return Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
}

function _sendErrorEmail(message) {
  if (!PSI_CONFIG.NOTIFY_EMAIL) return;
  MailApp.sendEmail(PSI_CONFIG.NOTIFY_EMAIL,
    '[Reportive] PSI Sync Error — ' + _todayDate(), message);
}
