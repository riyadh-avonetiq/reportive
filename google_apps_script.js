/**
 * Reportive by Avonetiq — Google Apps Script v3
 * Sync satu sheet "ADS_DATA" ke Supabase tabel "ads_data"
 *
 * ── SETUP ──────────────────────────────────────────────────────
 * 1. Buka Google Sheets → Extensions → Apps Script
 * 2. Hapus semua kode yang ada, paste script ini → Save
 * 3. Jalankan setupTrigger() sekali → izinkan permission
 * 4. Test manual: jalankan testSync()
 *
 * ── NAMA SHEET ─────────────────────────────────────────────────
 * Buat report dari Google Ads Add-on dengan nama sheet: ADS_DATA
 *
 * Kolom yang harus ada (urutan bebas, nama harus mirip):
 *   Day | Campaign ID | Campaign name | Campaign type |
 *   Ad group | Keyword | Match type | Cost/Spend |
 *   Impr. | CTR | Clicks | Avg. CPC |
 *   Conv. rate | Conversions | Cost / conv.
 */

// ── CONFIG ────────────────────────────────────────────────────
const SUPABASE_URL         = 'https://qmzgincouzpbyfxfddxt.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtemdpbmNvdXpwYnlmeGZkZHh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjA1ODc1MCwiZXhwIjoyMDkxNjM0NzUwfQ.jNZHwuIgYafn8s2GKkmapeinYD7khedjICd3oIo1TKs';
const SHEET_NAME           = 'ADS_DATA';

// ── MAIN ──────────────────────────────────────────────────────
function syncAll() {
  try {
    Logger.log('=== Sync Start: ' + new Date() + ' ===');
    const count = syncAdsData();
    Logger.log('=== Sync Complete: ' + count + ' baris ===');
  } catch (e) {
    Logger.log('ERROR: ' + e.toString());
    sendErrorEmail(e.toString());
  }
}

function syncAdsData() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + SHEET_NAME + '" tidak ditemukan. Pastikan nama sheet sudah benar.');

  const raw = sheet.getDataRange().getValues();

  // Cari baris header (baris yang mengandung "day" atau "date" atau "campaign")
  let hi = -1;
  for (let i = 0; i < Math.min(raw.length, 10); i++) {
    const r = raw[i].map(v => String(v).toLowerCase().trim());
    if (r.some(v => v === 'day' || v === 'date' || v.includes('campaign'))) { hi = i; break; }
  }
  if (hi === -1) throw new Error('Baris header tidak ditemukan di sheet ' + SHEET_NAME);

  const headers = raw[hi].map(v => String(v).toLowerCase().trim());

  // Temukan index tiap kolom (fleksibel terhadap variasi nama)
  const c = name => {
    const idx = headers.findIndex(h => h === name || h.includes(name));
    return idx;
  };

  const iDay     = c('day') !== -1 ? c('day') : c('date');
  const iCampId  = c('campaign id');
  const iCampNm  = c('campaign name') !== -1 ? c('campaign name') : c('campaign');
  const iCampTyp = c('campaign type');
  const iAdGrp   = c('ad group');
  const iKw      = c('keyword');
  const iMatch   = c('match type');
  const iSpend   = c('cost') !== -1 ? c('cost') : c('spend');
  const iImpr    = c('impr');
  const iCtr     = c('ctr');
  const iClick   = c('clicks');
  const iCpc     = c('avg. cpc') !== -1 ? c('avg. cpc') : c('avg cpc');
  const iCvr     = c('conv. rate') !== -1 ? c('conv. rate') : c('conv rate');
  const iConv    = c('conversions');
  const iCpa     = c('cost / conv') !== -1 ? c('cost / conv') : c('cost per conv');

  Logger.log('Header mapping: day=' + iDay + ' campId=' + iCampId + ' spend=' + iSpend + ' impr=' + iImpr);

  const rows = [];
  for (let i = hi + 1; i < raw.length; i++) {
    const row = raw[i];
    if (!row[iDay]) continue;                      // skip baris kosong

    const dateStr = toDate(row[iDay]);
    if (!dateStr) continue;

    const clicks = toInt(row[iClick]);
    const conv   = toFloat(row[iConv]);
    const spend  = toFloat(row[iSpend]);
    const impr   = toInt(row[iImpr]);

    rows.push({
      day:                 dateStr,
      campaign_id:         iCampId  >= 0 ? str(row[iCampId])  : 'unknown',
      campaign_name:       iCampNm  >= 0 ? str(row[iCampNm])  : '',
      campaign_type:       iCampTyp >= 0 ? str(row[iCampTyp]) : '',
      ad_group:            iAdGrp   >= 0 ? str(row[iAdGrp])   : '',
      keyword:             iKw      >= 0 ? str(row[iKw])       : '',
      match_type:          iMatch   >= 0 ? str(row[iMatch]).toUpperCase() : '',
      spend:               spend,
      impressions:         impr,
      ctr:                 iCtr >= 0 ? toFloat(row[iCtr]) : (impr > 0 ? r4(clicks / impr * 100) : 0),
      clicks:              clicks,
      avg_cpc:             iCpc >= 0 ? toFloat(row[iCpc]) : (clicks > 0 ? r2(spend / clicks) : 0),
      conv_rate:           iCvr >= 0 ? toFloat(row[iCvr]) : (clicks > 0 ? r4(conv / clicks * 100) : 0),
      conversions:         conv,
      cost_per_conversion: iCpa >= 0 ? toFloat(row[iCpa]) : (conv > 0 ? r2(spend / conv) : 0),
    });
  }

  if (rows.length === 0) {
    Logger.log('Tidak ada data yang bisa di-sync. Periksa nama kolom di sheet.');
    return 0;
  }

  // Upsert ke Supabase dalam batch 500
  upsert('ads_data', rows, 'day,campaign_id,ad_group,keyword,match_type');
  return rows.length;
}

// ── HELPERS ───────────────────────────────────────────────────
function str(v)    { return String(v == null ? '' : v).trim(); }
function toInt(v)  { return parseInt(String(v || 0).replace(/[^\d]/g, '')) || 0; }
function toFloat(v) {
  let s = String(v || '0');
  // Hapus simbol mata uang, strip %
  s = s.replace(/[Rp$€£\s]/g, '').replace('%', '').trim();
  // Jika ada koma sebagai desimal (misal "3,45") dan tidak ada titik
  if (s.includes(',') && !s.includes('.')) s = s.replace(',', '.');
  else s = s.replace(/,/g, '');   // hilangkan koma sebagai ribuan
  return parseFloat(s) || 0;
}
function toDate(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0, 10);
  return null;
}
function r2(v) { return Math.round(v * 100) / 100; }
function r4(v) { return Math.round(v * 10000) / 10000; }

function upsert(table, rows, onConflict) {
  const url = SUPABASE_URL + '/rest/v1/' + table + '?on_conflict=' + encodeURIComponent(onConflict);
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const resp = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'apikey':        SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Prefer':        'resolution=merge-duplicates,return=minimal',
      },
      payload: JSON.stringify(rows.slice(i, i + BATCH)),
      muteHttpExceptions: true,
    });
    const code = resp.getResponseCode();
    if (code < 200 || code >= 300) {
      throw new Error('Supabase error HTTP ' + code + ': ' + resp.getContentText().substring(0, 400));
    }
  }
}

function sendErrorEmail(msg) {
  try {
    MailApp.sendEmail({
      to: 'riyadh@avonetiq.id',
      subject: '[Reportive] Sync Error — ' + new Date().toDateString(),
      body: msg,
    });
  } catch(e) {}
}

// ── TRIGGER: auto-sync jam 06:00 WIB setiap hari ─────────────
function setupTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'syncAll')
    .forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger('syncAll')
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .inTimezone('Asia/Jakarta')
    .create();

  Logger.log('✅ Trigger dibuat — sync otomatis jam 06:00 WIB setiap hari');
}

// ── TEST ──────────────────────────────────────────────────────
function testSync() {
  syncAll();
}
