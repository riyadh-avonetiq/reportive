/**
 * Reportive by Avonetiq — GA4 Daily Sync  v1.0
 * =============================================
 * Fetch data harian dari Google Analytics 4 Data API
 * dan simpan ke Supabase tabel "ga4_daily" setiap hari.
 *
 * ── SETUP (lakukan sekali) ─────────────────────────────────────
 * 1. Buka script.google.com → New project → paste file ini
 * 2. Isi CONFIG di bawah (GA4_PROPERTY_ID, SUPABASE_*)
 * 3. Di Apps Script editor: Extensions → Services → cari
 *    "Google Analytics Data API" → Add (ini wajib!)
 * 4. Jalankan testSync() pertama kali → authorize permissions
 * 5. Jalankan setupDailyTrigger() untuk auto-run setiap hari
 *
 * ── CARA DAPAT GA4 PROPERTY ID ───────────────────────────────
 * Analytics.google.com → Admin (roda gigi) → Property Settings
 * → "Property ID" (angka, contoh: 123456789)
 *
 * ── PERMISSION YANG DIPERLUKAN ────────────────────────────────
 * Akun Google yang menjalankan script ini harus punya akses
 * "Viewer" atau lebih tinggi ke properti GA4.
 * Tidak perlu Service Account — Apps Script pakai OAuth otomatis.
 *
 * ── CARA DAPAT SUPABASE SERVICE KEY ──────────────────────────
 * Supabase Dashboard → Settings → API → service_role key
 */

// ════════════════════════════════════════════════════════════════
//  CONFIG — isi sesuai project Anda
// ════════════════════════════════════════════════════════════════
const GA4_CONFIG = {
  // GA4 Property ID (hanya angkanya, tanpa "properties/")
  GA4_PROPERTY_ID: 'ISI_PROPERTY_ID_DISINI',  // contoh: '123456789'

  // Supabase
  SUPABASE_URL: 'https://qmzgincouzpbyfxfddxt.supabase.co',
  SUPABASE_SERVICE_KEY: 'ISI_SERVICE_ROLE_KEY_DISINI',

  // Berapa hari ke belakang yang di-backfill pertama kali
  // Gunakan 90 untuk backfill 3 bulan. Setelah itu ganti ke 1.
  DAYS_TO_SYNC: 1,   // 1 = kemarin saja (mode harian normal)

  // Channel yang ingin di-breakdown. Kosongkan array [] untuk skip breakdown.
  // 'all' selalu dimasukkan (total semua channel).
  CHANNEL_BREAKDOWN: true,

  // Kirim notifikasi email jika sync gagal
  NOTIFY_EMAIL: '',  // kosongkan jika tidak perlu

  // Apakah ada tracking revenue / e-commerce?
  INCLUDE_REVENUE: false,
};

// ════════════════════════════════════════════════════════════════
//  MAIN FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Entry point utama — dipanggil oleh trigger harian
 */
function syncGA4() {
  const startTime = Date.now();
  Logger.log('=== GA4 Sync Start: ' + new Date() + ' ===');

  const propertyId = 'properties/' + GA4_CONFIG.GA4_PROPERTY_ID;
  const dates      = _getDateRange(GA4_CONFIG.DAYS_TO_SYNC);
  let totalRows = 0, errors = 0;

  for (const { startDate, endDate } of dates) {
    try {
      Logger.log('[FETCH] ' + startDate + ' → ' + endDate);

      // 1. Fetch total semua channel (channel = 'all')
      const totalData = _runGA4Report(propertyId, startDate, endDate, false);
      _upsertBatch(totalData);
      totalRows += totalData.length;
      Logger.log('[OK] ' + startDate + ' total: ' + totalData.length + ' rows');

      // 2. Fetch breakdown per channel (opsional)
      if (GA4_CONFIG.CHANNEL_BREAKDOWN) {
        const channelData = _runGA4Report(propertyId, startDate, endDate, true);
        _upsertBatch(channelData);
        totalRows += channelData.length;
        Logger.log('[OK] ' + startDate + ' channel breakdown: ' + channelData.length + ' rows');
      }

    } catch (e) {
      errors++;
      Logger.log('[ERROR] ' + startDate + ': ' + e.message);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  Logger.log('=== GA4 Sync Done: ' + totalRows + ' rows, ' + errors + ' errors — ' + elapsed + 's ===');

  if (errors > 0 && GA4_CONFIG.NOTIFY_EMAIL) {
    _sendErrorEmail(errors + ' date range gagal disync. Cek Apps Script logs.');
  }
}

/**
 * Backfill histori — sync 90 hari ke belakang sekaligus
 * Jalankan sekali untuk isi data awal.
 */
function backfill90Days() {
  const orig = GA4_CONFIG.DAYS_TO_SYNC;
  GA4_CONFIG.DAYS_TO_SYNC = 90;
  Logger.log('=== BACKFILL 90 HARI — ini mungkin lambat, harap tunggu ===');
  syncGA4();
  GA4_CONFIG.DAYS_TO_SYNC = orig;
}

/**
 * Test manual — jalankan ini pertama kali
 */
function testSync() {
  Logger.log('=== TEST GA4 Sync — kemarin ===');
  const propertyId = 'properties/' + GA4_CONFIG.GA4_PROPERTY_ID;
  const yesterday  = _offsetDate(-1);

  const data = _runGA4Report(propertyId, yesterday, yesterday, false);
  Logger.log('Preview data (baris pertama):');
  Logger.log(JSON.stringify(data[0], null, 2));
  Logger.log('Total rows: ' + data.length);
  Logger.log('Kirim ke Supabase...');
  _upsertBatch(data);
  Logger.log('Selesai! Cek tabel ga4_daily di Supabase.');
}

/**
 * Setup trigger harian (jalankan sekali saja)
 */
function setupDailyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'syncGA4')
    .forEach(t => ScriptApp.deleteTrigger(t));

  // Jam 07:00 — setelah tengah malam data GA4 biasanya sudah final
  ScriptApp.newTrigger('syncGA4')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();

  Logger.log('Trigger dibuat: syncGA4() jalan setiap hari jam 07:00');
}

// ════════════════════════════════════════════════════════════════
//  INTERNAL HELPERS
// ════════════════════════════════════════════════════════════════

/**
 * Jalankan GA4 Data API report
 * Perlu: Services → Google Analytics Data API diaktifkan
 */
function _runGA4Report(propertyId, startDate, endDate, byChannel) {
  const dimensions = byChannel
    ? [{ name: 'date' }, { name: 'sessionDefaultChannelGrouping' }]
    : [{ name: 'date' }];

  const metrics = [
    { name: 'sessions' },
    { name: 'totalUsers' },
    { name: 'newUsers' },
    { name: 'screenPageViews' },
    { name: 'engagedSessions' },
    { name: 'engagementRate' },        // 0-1
    { name: 'bounceRate' },            // 0-1
    { name: 'averageSessionDuration' },// detik
    { name: 'screenPageViewsPerSession' },
    { name: 'conversions' },
    { name: 'sessionConversionRate' }, // 0-1
  ];

  if (GA4_CONFIG.INCLUDE_REVENUE) {
    metrics.push({ name: 'totalRevenue' });
  }

  const request = {
    dateRanges:         [{ startDate, endDate }],
    dimensions,
    metrics,
    keepEmptyRows:      false,
    metricAggregations: ['TOTAL'],
  };

  // Panggil GA4 Data API via built-in Apps Script service
  // Pastikan service "Google Analytics Data API" sudah diaktifkan!
  let response;
  try {
    response = AnalyticsData.Properties.runReport(request, propertyId);
  } catch (e) {
    if (e.message.includes('is not defined') || e.message.includes('AnalyticsData')) {
      throw new Error(
        'Service "Google Analytics Data API" belum diaktifkan.\n' +
        'Caranya: Extensions → Services → Google Analytics Data API → Add'
      );
    }
    throw e;
  }

  if (!response.rows || response.rows.length === 0) {
    Logger.log('[WARN] Tidak ada data untuk ' + startDate + ' - ' + endDate);
    return [];
  }

  return response.rows.map(row => {
    const dim = row.dimensionValues.map(d => d.value);
    const met = row.metricValues.map(m => parseFloat(m.value) || 0);

    const [
      sessions, users, newUsers, pageviews, engagedSessions,
      engagementRate, bounceRate, avgDuration, pagesPerSess,
      conversions, convRate, revenue
    ] = met;

    return {
      property_id:           GA4_CONFIG.GA4_PROPERTY_ID,
      day:                   _formatDate(dim[0]),  // YYYYMMDD → YYYY-MM-DD
      channel:               byChannel ? (dim[1] || 'Unassigned') : 'all',
      sessions:              Math.round(sessions),
      users:                 Math.round(users),
      new_users:             Math.round(newUsers),
      returning_users:       Math.round(users - newUsers),
      pageviews:             Math.round(pageviews),
      screen_pageviews:      Math.round(pageviews),
      engaged_sessions:      Math.round(engagedSessions),
      engagement_rate:       Math.round(engagementRate * 10000) / 100,  // → persen
      bounce_rate:           Math.round(bounceRate    * 10000) / 100,  // → persen
      avg_session_duration:  Math.round(avgDuration * 100) / 100,
      pages_per_session:     Math.round(pagesPerSess * 100) / 100,
      conversions:           Math.round(conversions),
      conversion_rate:       Math.round(convRate * 10000) / 100,       // → persen
      total_revenue:         GA4_CONFIG.INCLUDE_REVENUE ? (Math.round((revenue || 0) * 100) / 100) : 0,
    };
  });
}

/**
 * Upsert batch rows ke Supabase (maks 500 per request)
 */
function _upsertBatch(rows) {
  if (!rows || rows.length === 0) return;
  const BATCH_SIZE = 500;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const res   = UrlFetchApp.fetch(GA4_CONFIG.SUPABASE_URL + '/rest/v1/ga4_daily', {
      method:             'POST',
      muteHttpExceptions: true,
      headers: {
        'apikey':        GA4_CONFIG.SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + GA4_CONFIG.SUPABASE_SERVICE_KEY,
        'Content-Type':  'application/json',
        'Prefer':        'resolution=merge-duplicates',
      },
      payload: JSON.stringify(batch),
    });

    const code = res.getResponseCode();
    if (code !== 200 && code !== 201) {
      throw new Error('Supabase upsert gagal (' + code + '): ' + res.getContentText().substring(0, 300));
    }
  }
}

/**
 * Buat array date range { startDate, endDate } berdasarkan DAYS_TO_SYNC
 * Satu range per hari (untuk granularitas maksimal)
 */
function _getDateRange(daysBack) {
  const ranges = [];
  for (let d = daysBack; d >= 1; d--) {
    const date = _offsetDate(-d);
    ranges.push({ startDate: date, endDate: date });
  }
  return ranges;
}

/**
 * Offset hari dari hari ini (negatif = ke belakang)
 * Returns: 'YYYY-MM-DD'
 */
function _offsetDate(offset) {
  const d  = new Date();
  d.setDate(d.getDate() + offset);
  const tz = Session.getScriptTimeZone() || 'Asia/Jakarta';
  return Utilities.formatDate(d, tz, 'yyyy-MM-dd');
}

/**
 * Format date GA4 (YYYYMMDD) → SQL (YYYY-MM-DD)
 */
function _formatDate(d) {
  if (!d || d.length !== 8) return d;
  return d.substring(0, 4) + '-' + d.substring(4, 6) + '-' + d.substring(6, 8);
}

function _sendErrorEmail(message) {
  if (!GA4_CONFIG.NOTIFY_EMAIL) return;
  MailApp.sendEmail(GA4_CONFIG.NOTIFY_EMAIL,
    '[Reportive] GA4 Sync Error — ' + _offsetDate(0), message);
}
