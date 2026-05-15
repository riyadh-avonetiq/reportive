// Reportive · Live Data Bridge v10
// ─────────────────────────────────────────────────────────────────
// Four Supabase projects:
//   google  → google_ads + pagespeed   (qmzgincouzpbyfxfddxt)
//   ga4     → ga4_sessions             (dpthobkylyuajaleykyf)
//   gsc     → search_console           (dmnnscedufbsphvrrors)
//   meta/app→ clients, meta_ads        (swklfolveiilajdmuenu)
//
// Public surface:
//   window.LIVE.useLive()   → { loading, data, dateRange, setDateRange,
//                               account, setAccount, ga4Property, setGa4Property,
//                               gscProperty, setGscProperty, psiUrl, setPsiUrl,
//                               _isMock, currentPeriod }
//   window.LIVE.LiveProvider
//   window.LIVE.fmt

// ── Supabase clients ────────────────────────────────────────────────
const SUPA_URL    = 'https://qmzgincouzpbyfxfddxt.supabase.co';
const SUPA_KEY    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtemdpbmNvdXpwYnlmeGZkZHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTg3NTAsImV4cCI6MjA5MTYzNDc1MH0.cm0NcefIhlvim2dWSJOcTpVyajiYrqsX2uy-35PqMuY';

const GA4_URL     = 'https://dpthobkylyuajaleykyf.supabase.co';
const GA4_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwdGhvYmt5bHl1YWphbGV5a3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MzkxMDYsImV4cCI6MjA5MjQxNTEwNn0.eGomVe5yQDecapanuMG08LdXRrw0Z5vkZdJyVgEQlE8';

const GSC_URL     = 'https://dmnnscedufbsphvrrors.supabase.co';
const GSC_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtbm5zY2VkdWZic3BodnJyb3JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2OTg5NTEsImV4cCI6MjA5MjI3NDk1MX0.CDkwYfwi6h8DqNOZL8d9MPoBYUJmc77tOrubobM4vrg';

const META_URL = 'https://swklfolveiilajdmuenu.supabase.co';
const META_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3a2xmb2x2ZWlpbGFqZG11ZW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NDEwMDAsImV4cCI6MjA5MzAxNzAwMH0.ZuxBQkHGwpY82XwA0NQzjqnvCeJH0WUIcp0Bux2K-84';

const _supa     = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(SUPA_URL,  SUPA_KEY)  : null;
const _ga4Supa  = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(GA4_URL,   GA4_KEY)   : null;
const _gscSupa  = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(GSC_URL,   GSC_KEY)   : null;
const _metaSupa = (window.supabase && window.supabase.createClient) ? window.supabase.createClient(META_URL,  META_KEY)  : null;

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Format helpers ──────────────────────────────────────────────────
const fmtRupiahShort = v => {
  if (v == null || isNaN(v)) return '—';
  return 'Rp ' + Math.round(v).toLocaleString('id-ID');
};
const fmtNum    = v => (v == null || isNaN(v)) ? '—' : Math.round(v).toLocaleString('id-ID');
const fmtPct    = v => (v == null || isNaN(v)) ? '—' : (v).toFixed(2) + '%';
const fmtRoas   = v => (v == null || isNaN(v)) ? '—' : (v).toFixed(2) + 'x';
const pctChange = (cur, prev) => {
  if (prev == null || prev === 0 || isNaN(prev)) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
};

// ── Date utilities ──────────────────────────────────────────────────
function _ds(d) {
  return d.getFullYear() + '-'
    + String(d.getMonth() + 1).padStart(2, '0') + '-'
    + String(d.getDate()).padStart(2, '0');
}
function _pd(s) { return new Date(s + 'T00:00:00'); }

function computePrevRange(from, to) {
  if (!from || !to) return { prevFrom: null, prevTo: null };
  const f = _pd(from), t = _pd(to);
  const durMs  = t.getTime() - f.getTime() + 86400000;
  const prevTo  = new Date(f.getTime() - 86400000);
  const prevFrom = new Date(prevTo.getTime() - durMs + 86400000);
  return { prevFrom: _ds(prevFrom), prevTo: _ds(prevTo) };
}

function buildRangeLabel(from, to) {
  if (!from && !to) return { labelShort: 'All Time', labelLong: 'Semua data tersedia' };
  const f = _pd(from), t = _pd(to);
  const fm = f.getMonth(), fy = f.getFullYear();
  const tm = t.getMonth(), ty = t.getFullYear();
  const fmtD = d => `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  if (fm === tm && fy === ty) {
    const daysInM = new Date(fy, fm + 1, 0).getDate();
    if (f.getDate() === 1 && t.getDate() === daysInM)
      return { labelShort: `${MONTH_NAMES[fm]} ${fy}`, labelLong: `${MONTH_NAMES[fm]} 1 – ${daysInM}, ${fy}` };
    return { labelShort: `${MONTH_NAMES[fm]} ${fy}`, labelLong: `${MONTH_NAMES[fm]} ${f.getDate()} – ${t.getDate()}, ${fy}` };
  }
  return {
    labelShort: fy === ty
      ? `${MONTH_NAMES[fm]} – ${MONTH_NAMES[tm]} ${ty}`
      : `${MONTH_NAMES[fm]} ${fy} – ${MONTH_NAMES[tm]} ${ty}`,
    labelLong: `${fmtD(f)} – ${fmtD(t)}`,
  };
}

// ── Aggregate: Google Ads ────────────────────────────────────────────
function aggregateAds(rows) {
  const t = { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
  rows.forEach(r => {
    t.spend       += +r.spend       || 0;
    t.impressions += +r.impressions || 0;
    t.clicks      += +r.clicks      || 0;
    t.conversions += +r.conversions || 0;
  });
  t.ctr  = t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0;
  t.cpc  = t.clicks > 0 ? t.spend / t.clicks : 0;
  t.cvr  = t.clicks > 0 ? (t.conversions / t.clicks) * 100 : 0;
  t.cpa  = t.conversions > 0 ? t.spend / t.conversions : 0;
  t.roas = null;
  return t;
}

// ── Aggregate: Meta Ads ─────────────────────────────────────────────
// Meta table uses: link_clicks (not clicks), date (not day)
function aggregateMeta(rows) {
  const t = { spend: 0, impressions: 0, reach: 0, clicks: 0, landing_page_views: 0, leads: 0, complete_registrations: 0, messaging_conv_started: 0, contacts: 0, ig_profile_visits: 0, post_engagements: 0, content_views: 0, purchases: 0, purchase_value: 0, add_to_carts: 0, add_to_cart_value: 0 };
  rows.forEach(r => {
    t.spend                  += +r.spend                   || 0;
    t.impressions            += +r.impressions             || 0;
    t.reach                  += +r.reach                   || 0;
    t.clicks                 += +r.link_clicks             || 0;
    t.landing_page_views     += +r.landing_page_views      || 0;
    t.leads                  += +r.leads                   || 0;
    t.complete_registrations += +r.complete_registrations  || 0;
    t.messaging_conv_started += +r.messaging_conv_started  || 0;
    t.contacts               += +r.contacts                || 0;
    t.ig_profile_visits      += +r.ig_profile_visits       || 0;
    t.post_engagements       += +r.post_engagements        || 0;
    t.content_views          += +r.content_views           || 0;
    t.purchases              += +r.purchases               || 0;
    t.purchase_value         += +r.purchase_value          || 0;
    t.add_to_carts           += +r.add_to_carts            || 0;
    t.add_to_cart_value      += +r.add_to_cart_value       || 0;
  });
  return t;
}

// ── Aggregate: GA4 ──────────────────────────────────────────────────
function aggregateGa4(rows) {
  const t = { sessions: 0, total_users: 0, new_users: 0, returning_users: 0, event_count: 0, engaged_sessions: 0, bounceWeighted: 0, durationWeighted: 0, engagementWeighted: 0, engageDurationWeighted: 0 };
  rows.forEach(r => {
    const sess = +r.sessions || 0;
    t.sessions          += sess;
    t.total_users       += +r.total_users              || 0;
    t.new_users         += +r.new_users                || 0;
    t.returning_users   += +r.returning_users          || 0;
    t.event_count       += +r.event_count              || 0;
    t.engaged_sessions  += +r.engaged_sessions         || 0;
    if (r.bounce_rate != null && sess > 0)
      t.bounceWeighted          += +r.bounce_rate              * sess;
    if (r.avg_session_duration != null && sess > 0)
      t.durationWeighted        += +r.avg_session_duration     * sess;
    if (r.engagement_rate != null && sess > 0)
      t.engagementWeighted      += +r.engagement_rate          * sess;
    if (r.user_engagement_duration != null && sess > 0)
      t.engageDurationWeighted  += +r.user_engagement_duration * sess;
  });
  // bounce_rate and engagement_rate stored as decimal (0–1) from GA4 API; multiply by 100 for display
  t.bounce_rate              = t.sessions > 0 ? (t.bounceWeighted         / t.sessions) * 100 : 0;
  t.avg_session_duration     = t.sessions > 0 ?  t.durationWeighted       / t.sessions        : 0;
  t.engagement_rate          = t.sessions > 0 ? (t.engagementWeighted     / t.sessions) * 100 : 0;
  t.user_engagement_duration = t.sessions > 0 ?  t.engageDurationWeighted / t.sessions        : 0;
  return t;
}

// ── Aggregate: Search Console ────────────────────────────────────────
// summaryRows: (date, property) level — used for totals and daily chart
// queryRows:   (query) level       — used for top-queries table
// pagesRows:   (page) level        — used for top-pages table
function aggregateGsc(summaryRows, queryRows, pagesRows, countryRows, deviceRows) {
  summaryRows  = summaryRows  || [];
  queryRows    = queryRows    || [];
  pagesRows    = pagesRows    || [];
  countryRows  = countryRows  || [];
  deviceRows   = deviceRows   || [];
  if (!summaryRows.length && !queryRows.length && !pagesRows.length) return null;

  // Totals from summary (impression-weighted position)
  let impressions = 0, clicks = 0, posWeightedSum = 0, posImprSum = 0;
  summaryRows.forEach(r => {
    const imp = +r.impressions || 0;
    impressions += imp;
    clicks      += +r.clicks || 0;
    if (r.position != null && imp > 0) {
      posWeightedSum += +r.position * imp;
      posImprSum     += imp;
    }
  });
  const ctr      = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const position = posImprSum > 0 ? posWeightedSum / posImprSum : 0;

  // Top queries — already ordered by clicks DESC from the DB
  const byQuery = {};
  queryRows.forEach(r => {
    const q = r.query || '(not provided)';
    if (!byQuery[q]) byQuery[q] = { query: q, impressions: 0, clicks: 0, posWeightedSum: 0, posImprSum: 0 };
    const imp = +r.impressions || 0;
    byQuery[q].impressions    += imp;
    byQuery[q].clicks         += +r.clicks || 0;
    if (r.position != null && imp > 0) {
      byQuery[q].posWeightedSum += +r.position * imp;
      byQuery[q].posImprSum     += imp;
    }
  });
  const queries = Object.values(byQuery)
    .map(q => ({
      query:       q.query,
      impressions: q.impressions,
      clicks:      q.clicks,
      ctr:         q.impressions > 0 ? (q.clicks / q.impressions) * 100 : 0,
      position:    q.posImprSum > 0 ? q.posWeightedSum / q.posImprSum : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 15);

  // Daily series + date table rows — from summary (accurate; do not use daily query rows)
  const byDate = {};
  summaryRows.forEach(r => {
    const d = r.date || r.day;
    if (!d) return;
    if (!byDate[d]) byDate[d] = { impressions: 0, clicks: 0, posWeightedSum: 0, posImprSum: 0 };
    const imp = +r.impressions || 0;
    byDate[d].impressions += imp;
    byDate[d].clicks      += +r.clicks || 0;
    if (r.position != null && imp > 0) {
      byDate[d].posWeightedSum += +r.position * imp;
      byDate[d].posImprSum     += imp;
    }
  });
  const dateKeys = Object.keys(byDate).sort();
  const series = {
    impressions: dateKeys.map(k => byDate[k].impressions),
    clicks:      dateKeys.map(k => byDate[k].clicks),
    labels:      dateKeys,
  };
  const dates = dateKeys.map(k => ({
    date:        k,
    impressions: byDate[k].impressions,
    clicks:      byDate[k].clicks,
    ctr:         byDate[k].impressions > 0 ? (byDate[k].clicks / byDate[k].impressions) * 100 : 0,
    position:    byDate[k].posImprSum > 0 ? byDate[k].posWeightedSum / byDate[k].posImprSum : 0,
  }));

  // Top pages — group by page URL
  const byPage = {};
  pagesRows.forEach(r => {
    const pg = r.page || '(unknown)';
    if (!byPage[pg]) byPage[pg] = { page: pg, impressions: 0, clicks: 0, posWeightedSum: 0, posImprSum: 0 };
    const imp = +r.impressions || 0;
    byPage[pg].impressions    += imp;
    byPage[pg].clicks         += +r.clicks || 0;
    if (r.position != null && imp > 0) {
      byPage[pg].posWeightedSum += +r.position * imp;
      byPage[pg].posImprSum     += imp;
    }
  });
  const pages = Object.values(byPage)
    .map(pg => ({
      page:        pg.page,
      impressions: pg.impressions,
      clicks:      pg.clicks,
      ctr:         pg.impressions > 0 ? (pg.clicks / pg.impressions) * 100 : 0,
      position:    pg.posImprSum > 0 ? pg.posWeightedSum / pg.posImprSum : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 15);

  // Countries — group by country
  const byCountry = {};
  countryRows.forEach(r => {
    const c = r.country || '(unknown)';
    if (!byCountry[c]) byCountry[c] = { country: c, impressions: 0, clicks: 0, posWeightedSum: 0, posImprSum: 0 };
    const imp = +r.impressions || 0;
    byCountry[c].impressions    += imp;
    byCountry[c].clicks         += +r.clicks || 0;
    if (r.position != null && imp > 0) {
      byCountry[c].posWeightedSum += +r.position * imp;
      byCountry[c].posImprSum     += imp;
    }
  });
  const countries = Object.values(byCountry)
    .map(c => ({
      country:     c.country,
      impressions: c.impressions,
      clicks:      c.clicks,
      ctr:         c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
      position:    c.posImprSum > 0 ? c.posWeightedSum / c.posImprSum : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  // Devices — group by device
  const byDevice = {};
  deviceRows.forEach(r => {
    const dv = r.device || '(unknown)';
    if (!byDevice[dv]) byDevice[dv] = { device: dv, impressions: 0, clicks: 0, posWeightedSum: 0, posImprSum: 0 };
    const imp = +r.impressions || 0;
    byDevice[dv].impressions    += imp;
    byDevice[dv].clicks         += +r.clicks || 0;
    if (r.position != null && imp > 0) {
      byDevice[dv].posWeightedSum += +r.position * imp;
      byDevice[dv].posImprSum     += imp;
    }
  });
  const devices = Object.values(byDevice)
    .map(dv => ({
      device:      dv.device,
      impressions: dv.impressions,
      clicks:      dv.clicks,
      ctr:         dv.impressions > 0 ? (dv.clicks / dv.impressions) * 100 : 0,
      position:    dv.posImprSum > 0 ? dv.posWeightedSum / dv.posImprSum : 0,
    }))
    .sort((a, b) => b.clicks - a.clicks);

  return { impressions, clicks, ctr, position, queries, pages, series, dates, countries, devices };
}

// ── Aggregate: PageSpeed Insights ───────────────────────────────────
// Rows arrive ordered DESC by day — row[0] is the most recent snapshot.
// PSI API stores scores as 0.0–1.0 (Lighthouse format).
// Normalize: if value is (0, 1], multiply by 100.
function aggregatePsi(rows) {
  if (!rows || !rows.length) return null;
  const ns = v => {
    const n = +(v) || 0;
    return n > 0 && n <= 1 ? Math.round(n * 100) : Math.round(n);
  };
  const latest = rows[0];
  const avg = key => {
    const vals = rows.map(r => ns(r[key]));
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
  };
  return {
    performance:    ns(latest.performance_score),
    seo:            ns(latest.seo_score),
    accessibility:  ns(latest.accessibility_score),
    best_practices: ns(latest.best_practices_score),
    avgPerformance:    avg('performance_score'),
    avgSeo:            avg('seo_score'),
    avgAccessibility:  avg('accessibility_score'),
    avgBestPractices:  avg('best_practices_score'),
    latestDay:   latest.day || null,
    recordCount: rows.length,
    history: rows.slice(0, 12).reverse().map(r => ({
      day:         r.day,
      performance: ns(r.performance_score),
      seo:         ns(r.seo_score),
    })),
  };
}

// ── Normalize GA4 dimension row: handle camelCase or snake_case column names ──
function _normalizeGa4DimRow(r) {
  const sessions             = +(r.sessions             ?? 0);
  const total_users          = +(r.total_users          ?? r.totalUsers          ?? r.users             ?? 0);
  const new_users            = +(r.new_users            ?? r.newUsers            ?? 0);
  const engaged_sessions     = +(r.engaged_sessions     ?? r.engagedSessions     ?? 0);
  const event_count          = +(r.event_count          ?? r.eventCount          ?? r.events            ?? 0);
  const avg_session_duration = +(r.avg_session_duration ?? r.avgSessionDuration  ?? r.averageSessionDuration ?? 0);
  const bounce_rate_raw      = +(r.bounce_rate          ?? r.bounceRate          ?? 0);
  const engagement_rate_raw  = +(r.engagement_rate      ?? r.engagementRate      ?? 0);
  // GA4 API stores bounce_rate and engagement_rate as decimal (0–1); multiply by 100 for display
  const bounce_rate          = bounce_rate_raw > 1 ? bounce_rate_raw : bounce_rate_raw * 100;
  const engagement_rate      = engagement_rate_raw > 1 ? engagement_rate_raw : engagement_rate_raw * 100;
  return { ...r, sessions, total_users, new_users, engaged_sessions, event_count, avg_session_duration, bounce_rate, engagement_rate };
}

// ── Build aggregated data object ────────────────────────────────────
function buildData(adsRows, ga4Rows, psiRows, gscSummary, gscQueries, prevAdsRows, prevGa4Rows, prevGscSummary, prevGscQueries, from, to, prevFrom, prevTo, metaRows, prevMetaRows, gscPages, prevGscPages, adsDetailRows, adsSegRows, adsSheetRows, gscCountries, gscDevices, metaInsightsRows, ga4DemoRows, ga4PageRows, ga4SessionRows) {
  // Use ads_data (sheet-synced, matches google_ads_daily) when available; fall back to google_ads
  const detailRows = adsSheetRows && adsSheetRows.length ? adsSheetRows : adsDetailRows;
  console.log('[Reportive] detail source:', adsSheetRows && adsSheetRows.length ? 'ads_data (' + adsSheetRows.length + ' rows)' : 'google_ads (' + adsDetailRows.length + ' rows)');
  metaRows     = metaRows     || [];
  prevMetaRows = prevMetaRows || [];
  gscPages     = gscPages     || [];
  prevGscPages = prevGscPages || [];
  gscCountries = gscCountries || [];
  gscDevices   = gscDevices   || [];

  const ads      = aggregateAds(adsRows);
  const adsPrev  = aggregateAds(prevAdsRows);
  const meta     = aggregateMeta(metaRows);
  const metaPrev = aggregateMeta(prevMetaRows);
  const ga4      = aggregateGa4(ga4Rows);
  const ga4Prev  = aggregateGa4(prevGa4Rows);
  const psi      = aggregatePsi(psiRows);
  const gsc      = aggregateGsc(gscSummary, gscQueries, gscPages, gscCountries, gscDevices);
  const gscPrev  = aggregateGsc(prevGscSummary, prevGscQueries, prevGscPages);

  // Daily series from Google Ads rows
  const dailyAds = {};
  adsRows.forEach(r => {
    if (!r.day) return;
    if (!dailyAds[r.day]) dailyAds[r.day] = { spend: 0, clicks: 0, impressions: 0, conversions: 0 };
    dailyAds[r.day].spend       += +r.spend || 0;
    dailyAds[r.day].clicks      += +r.clicks || 0;
    dailyAds[r.day].impressions += +r.impressions || 0;
    dailyAds[r.day].conversions += +r.conversions || 0;
  });
  const dailyKeys = Object.keys(dailyAds).sort();
  const series = {
    spend:       dailyKeys.map(k => dailyAds[k].spend),
    clicks:      dailyKeys.map(k => dailyAds[k].clicks),
    impressions: dailyKeys.map(k => dailyAds[k].impressions),
    conversions: dailyKeys.map(k => dailyAds[k].conversions),
    labels:      dailyKeys,
  };

  // Channel breakdown
  const byType = {};
  adsRows.forEach(r => {
    const k = r.campaign_type || 'Other';
    if (!byType[k]) byType[k] = { spend: 0, clicks: 0, impressions: 0, conversions: 0 };
    byType[k].spend       += +r.spend || 0;
    byType[k].clicks      += +r.clicks || 0;
    byType[k].impressions += +r.impressions || 0;
    byType[k].conversions += +r.conversions || 0;
  });
  const channels = Object.entries(byType)
    .sort((a, b) => b[1].spend - a[1].spend)
    .map(([name, t]) => ({ name, ...t,
      ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0,
      cpc: t.clicks > 0 ? t.spend / t.clicks : 0,
    }));

  // Top campaigns
  const byCamp = {};
  adsRows.forEach(r => {
    const k = r.campaign_name || 'unknown';
    if (!byCamp[k]) byCamp[k] = { name: k, type: r.campaign_type || '', spend: 0, clicks: 0, impressions: 0, conversions: 0 };
    byCamp[k].spend       += +r.spend || 0;
    byCamp[k].clicks      += +r.clicks || 0;
    byCamp[k].impressions += +r.impressions || 0;
    byCamp[k].conversions += +r.conversions || 0;
  });
  const campaigns = Object.values(byCamp)
    .sort((a, b) => b.spend - a.spend)
    .map(c => ({ ...c,
      campaign: c.name,
      ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
      cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
      cvr: c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0,
      cpa: c.conversions > 0 ? c.spend / c.conversions : 0,
    }));

  // Daily series from Meta Ads rows (date column, link_clicks column)
  const dailyMeta = {};
  metaRows.forEach(r => {
    const d = r.date;
    if (!d) return;
    if (!dailyMeta[d]) dailyMeta[d] = { spend: 0, clicks: 0, impressions: 0, conversions: 0 };
    dailyMeta[d].spend       += +r.spend       || 0;
    dailyMeta[d].clicks      += +r.link_clicks || 0;
    dailyMeta[d].impressions += +r.impressions || 0;
    dailyMeta[d].conversions += (+r.purchases || 0) + (+r.leads || 0);
  });
  const dailyMetaKeys = Object.keys(dailyMeta).sort();
  const metaSeries = {
    spend:       dailyMetaKeys.map(k => dailyMeta[k].spend),
    clicks:      dailyMetaKeys.map(k => dailyMeta[k].clicks),
    impressions: dailyMetaKeys.map(k => dailyMeta[k].impressions),
    conversions: dailyMetaKeys.map(k => dailyMeta[k].conversions),
    labels:      dailyMetaKeys,
  };

  // Meta channel breakdown by campaign name
  const metaByType = {};
  metaRows.forEach(r => {
    const k = r.campaign_name || 'Other';
    if (!metaByType[k]) metaByType[k] = { spend: 0, clicks: 0, impressions: 0, reach: 0, landing_page_views: 0, leads: 0, complete_registrations: 0, messaging_conv_started: 0, contacts: 0, ig_profile_visits: 0, post_engagements: 0, conversions: 0, purchases: 0, purchase_value: 0, add_to_carts: 0, add_to_cart_value: 0 };
    metaByType[k].spend                  += +r.spend                   || 0;
    metaByType[k].clicks                 += +r.link_clicks             || 0;
    metaByType[k].impressions            += +r.impressions             || 0;
    metaByType[k].reach                  += +r.reach                   || 0;
    metaByType[k].landing_page_views     += +r.landing_page_views      || 0;
    metaByType[k].leads                  += +r.leads                   || 0;
    metaByType[k].complete_registrations += +r.complete_registrations  || 0;
    metaByType[k].messaging_conv_started += +r.messaging_conv_started  || 0;
    metaByType[k].contacts               += +r.contacts                || 0;
    metaByType[k].ig_profile_visits      += +r.ig_profile_visits       || 0;
    metaByType[k].post_engagements       += +r.post_engagements        || 0;
    metaByType[k].conversions            += (+r.leads || 0) + (+r.contacts || 0) + (+r.complete_registrations || 0);
    metaByType[k].purchases              += +r.purchases               || 0;
    metaByType[k].purchase_value         += +r.purchase_value          || 0;
    metaByType[k].add_to_carts           += +r.add_to_carts            || 0;
    metaByType[k].add_to_cart_value      += +r.add_to_cart_value       || 0;
  });
  const metaChannels = Object.entries(metaByType)
    .sort((a, b) => b[1].spend - a[1].spend)
    .map(([name, t]) => ({ name, ...t,
      ctr:  t.impressions > 0  ? (t.clicks / t.impressions) * 100 : 0,
      cpc:  t.clicks > 0       ? t.spend / t.clicks : 0,
      cpa:  t.conversions > 0  ? t.spend / t.conversions : 0,
      roas: t.spend > 0 && t.purchase_value > 0 ? t.purchase_value / t.spend : 0,
    }));

  // Ad Groups (campaign × ad_group level)
  const _byAdGroup = {};
  (detailRows || []).forEach(r => {
    const key = (r.campaign_name || '') + '\x00' + (r.ad_group || '');
    if (!_byAdGroup[key]) _byAdGroup[key] = { campaign: r.campaign_name || '', ad_group: r.ad_group || '', campaign_type: r.campaign_type || '', spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    _byAdGroup[key].spend       += +r.spend       || 0;
    _byAdGroup[key].impressions += +r.impressions || 0;
    _byAdGroup[key].clicks      += +r.clicks      || 0;
    _byAdGroup[key].conversions += +r.conversions || 0;
  });
  const adGroups = Object.values(_byAdGroup)
    .sort((a, b) => b.spend - a.spend).slice(0, 1000)
    .map(g => ({ ...g,
      name: g.campaign,
      type: g.campaign_type,
      ctr: g.impressions > 0 ? (g.clicks / g.impressions) * 100 : 0,
      cpc: g.clicks > 0 ? g.spend / g.clicks : 0,
      cvr: g.clicks > 0 ? (g.conversions / g.clicks) * 100 : 0,
      cpa: g.conversions > 0 ? g.spend / g.conversions : 0,
    }));

  // Keywords (campaign × ad_group × keyword level)
  const _byKeyword = {};
  (detailRows || []).filter(r => r.keyword).forEach(r => {
    const key = (r.campaign_name || '') + '\x00' + (r.ad_group || '') + '\x00' + (r.keyword || '');
    if (!_byKeyword[key]) _byKeyword[key] = { campaign: r.campaign_name || '', ad_group: r.ad_group || '', keyword: r.keyword || '', match_type: r.match_type || '', spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    _byKeyword[key].spend       += +r.spend       || 0;
    _byKeyword[key].impressions += +r.impressions || 0;
    _byKeyword[key].clicks      += +r.clicks      || 0;
    _byKeyword[key].conversions += +r.conversions || 0;
  });
  const keywords = Object.values(_byKeyword)
    .sort((a, b) => b.spend - a.spend).slice(0, 1000)
    .map(k => ({ ...k,
      name: k.campaign,
      type: k.campaign_type || '',
      ctr: k.impressions > 0 ? (k.clicks / k.impressions) * 100 : 0,
      cpc: k.clicks > 0 ? k.spend / k.clicks : 0,
      cvr: k.clicks > 0 ? (k.conversions / k.clicks) * 100 : 0,
      cpa: k.conversions > 0 ? k.spend / k.conversions : 0,
    }));

  // Keywords × device (from google_ads which has keyword + device per row)
  const _byKeywordDevice = {};
  (adsDetailRows || []).filter(r => r.keyword).forEach(r => {
    const key = (r.campaign_name||'') + '\x00' + (r.ad_group||'') + '\x00' + (r.keyword||'') + '\x00' + (r.match_type||'') + '\x00' + (r.device||'');
    if (!_byKeywordDevice[key]) _byKeywordDevice[key] = { name: r.campaign_name||'', campaign: r.campaign_name||'', ad_group: r.ad_group||'', keyword: r.keyword||'', match_type: r.match_type||'', device: r.device||'', spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    _byKeywordDevice[key].spend       += +r.spend       || 0;
    _byKeywordDevice[key].impressions += +r.impressions || 0;
    _byKeywordDevice[key].clicks      += +r.clicks      || 0;
    _byKeywordDevice[key].conversions += +r.conversions || 0;
  });
  const _addAdMetrics = r => ({
    ...r,
    ctr: r.impressions > 0 ? (r.clicks / r.impressions) * 100 : 0,
    cpc: r.clicks > 0 ? r.spend / r.clicks : 0,
    cvr: r.clicks > 0 ? (r.conversions / r.clicks) * 100 : 0,
    cpa: r.conversions > 0 ? r.spend / r.conversions : 0,
  });
  const keywordDeviceRows = Object.values(_byKeywordDevice).sort((a, b) => b.spend - a.spend).slice(0, 2000).map(_addAdMetrics);

  // Ad groups × device (from google_ads which has device column)
  const _byAdGroupDevice = {};
  (adsDetailRows || []).forEach(r => {
    if (!r.device || !r.ad_group) return;
    const key = (r.campaign_name||'') + '\x00' + (r.ad_group||'') + '\x00' + (r.device||'');
    if (!_byAdGroupDevice[key]) _byAdGroupDevice[key] = { name: r.campaign_name||'', campaign: r.campaign_name||'', ad_group: r.ad_group||'', type: r.campaign_type||'', device: r.device||'', spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    _byAdGroupDevice[key].spend       += +r.spend       || 0;
    _byAdGroupDevice[key].impressions += +r.impressions || 0;
    _byAdGroupDevice[key].clicks      += +r.clicks      || 0;
    _byAdGroupDevice[key].conversions += +r.conversions || 0;
  });
  const adGroupDeviceRows = Object.values(_byAdGroupDevice).sort((a, b) => b.spend - a.spend).slice(0, 1000).map(_addAdMetrics);

  // Device breakdown (from google_ads which has device column)
  const _byDevice = {};
  (adsDetailRows || []).forEach(r => {
    if (!r.device) return;
    const key = (r.campaign_name || '') + '\x00' + r.device;
    if (!_byDevice[key]) _byDevice[key] = { name: r.campaign_name || '', campaign: r.campaign_name || '', type: r.campaign_type || '', device: r.device, spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    _byDevice[key].spend       += +r.spend       || 0;
    _byDevice[key].impressions += +r.impressions || 0;
    _byDevice[key].clicks      += +r.clicks      || 0;
    _byDevice[key].conversions += +r.conversions || 0;
  });
  const deviceRows = Object.values(_byDevice).sort((a, b) => b.spend - a.spend).slice(0, 1000).map(_addAdMetrics);

  // Gender breakdown (from google_ads_seg where segment_type = 'gender')
  const _byGender = {};
  (adsSegRows || []).filter(r => r.segment_type === 'gender').forEach(r => {
    const key = (r.campaign_name || '') + '\x00' + (r.segment_value || '');
    if (!_byGender[key]) _byGender[key] = { name: r.campaign_name || '', campaign: r.campaign_name || '', segment_value: r.segment_value || '', spend: 0, impressions: 0, clicks: 0, conversions: 0 };
    _byGender[key].spend       += +r.spend       || 0;
    _byGender[key].impressions += +r.impressions || 0;
    _byGender[key].clicks      += +r.clicks      || 0;
    _byGender[key].conversions += +r.conversions || 0;
  });
  const genderRows = Object.values(_byGender).sort((a, b) => b.conversions - a.conversions).map(_addAdMetrics);

  // Conversion actions (from google_ads_seg where segment_type = 'conversion_action')
  const _byConvAction = {};
  (adsSegRows || []).filter(r => r.segment_type === 'conversion_action').forEach(r => {
    const key = r.segment_value || 'Other';
    if (!_byConvAction[key]) _byConvAction[key] = { name: key, conversions: 0 };
    _byConvAction[key].conversions += +r.conversions || 0;
  });
  const conversionActions = Object.values(_byConvAction).sort((a, b) => b.conversions - a.conversions);

  const { labelShort, labelLong } = buildRangeLabel(from, to);
  const { labelShort: prevLabel }  = buildRangeLabel(prevFrom, prevTo);

  return {
    key: `${from || 'all'}:${to || 'all'}`,
    labelShort, labelLong,
    prevKey: prevLabel || null,
    ads, adsPrev, meta, metaPrev, ga4, ga4Prev, psi, gsc, gscPrev,
    series, channels, campaigns, metaSeries, metaChannels,
    adGroups, keywords, keywordDeviceRows, adGroupDeviceRows, deviceRows, genderRows, conversionActions,
    ga4Rows, metaRows,
    metaInsightsRows: (metaInsightsRows || []).map(r => ({ ...r, clicks: +r.link_clicks || 0 })),
    ga4DemoRows:    (ga4DemoRows    || []).map(_normalizeGa4DimRow),
    ga4PageRows:    (ga4PageRows    || []).map(_normalizeGa4DimRow),
    ga4SessionRows: (ga4SessionRows || []).map(_normalizeGa4DimRow),
  };
}

// ── Mock fallback ────────────────────────────────────────────────────
function mockData() {
  return {
    key: 'mock', labelShort: 'Demo Data', labelLong: 'Demo · Hubungkan Supabase untuk data nyata', prevKey: null,
    ads:     { spend: 48_500_000, clicks: 18240, impressions: 482300, conversions: 1284, ctr: 3.78, cpc: 2658, cpa: 37772, roas: 3.82 },
    adsPrev: { spend: 43_100_000, clicks: 16500, impressions: 460000, conversions: 1073, ctr: 3.59, cpc: 2612, cpa: 40167, roas: 3.67 },
    ga4:     { sessions: 24830, total_users: 18900, new_users: 12400, returning_users: 6430, event_count: 78400, engaged_sessions: 17800, bounce_rate: 38.5, engagement_rate: 71.7, avg_session_duration: 128, user_engagement_duration: 95 },
    ga4Prev: { sessions: 22980, total_users: 17500, new_users: 11200, returning_users: 5780, event_count: 71200, engaged_sessions: 16100, bounce_rate: 41.0, engagement_rate: 70.0, avg_session_duration: 121, user_engagement_duration: 88 },
    psi:     { performance: 82, seo: 88, accessibility: 76, best_practices: 94, latestDay: null, recordCount: 1, avgPerformance: 82, avgSeo: 88, avgAccessibility: 76, avgBestPractices: 94, history: [] },
    gsc: {
      impressions: 124500, clicks: 8320, ctr: 6.68, position: 4.2,
      queries: [
        { query: 'brand keyword utama',     impressions: 18400, clicks: 2240, ctr: 12.2, position: 1.4 },
        { query: 'produk kategori kota',    impressions: 14200, clicks: 1640, ctr: 11.5, position: 2.8 },
        { query: 'produk kategori generic', impressions: 22100, clicks: 1380, ctr: 6.2,  position: 4.1 },
        { query: 'long-tail transactional', impressions:  9800, clicks:  920, ctr: 9.4,  position: 3.5 },
        { query: 'brand + review',          impressions:  6300, clicks:  740, ctr: 11.7, position: 2.1 },
        { query: 'kategori + harga murah',  impressions: 12400, clicks:  620, ctr: 5.0,  position: 6.3 },
        { query: 'cara memilih produk',     impressions: 18900, clicks:  480, ctr: 2.5,  position: 7.9 },
        { query: 'alternatif kompetitor',   impressions: 22500, clicks:  300, ctr: 1.3,  position: 9.2 },
      ],
      series: {
        impressions: Array.from({length: 30}, (_, i) => 3800 + Math.sin(i * 0.4) * 900 + i * 40),
        clicks:      Array.from({length: 30}, (_, i) => 260  + Math.sin(i * 0.3) * 60  + i * 3),
        labels:      Array.from({length: 30}, (_, i) => `2025-04-${String(i+1).padStart(2,'0')}`),
      },
    },
    gscPrev: null,
    series: {
      spend:       Array.from({length: 31}, (_, i) => 1_300_000 + Math.sin(i * 0.4) * 300_000 + i * 30_000),
      clicks:      Array.from({length: 31}, (_, i) => 540 + Math.sin(i * 0.3) * 120 + i * 8),
      impressions: Array.from({length: 31}, (_, i) => 14000 + Math.sin(i * 0.2) * 3000 + i * 200),
      conversions: Array.from({length: 31}, (_, i) => 38 + Math.sin(i * 0.35) * 10 + i * 0.3),
      labels:      Array.from({length: 31}, (_, i) => `2025-03-${String(i+1).padStart(2,'0')}`),
    },
    channels: [
      { name: 'Search',      spend: 23_300_000, clicks: 8240, impressions: 192000, conversions: 628, ctr: 4.29, cpc: 2828 },
      { name: 'Display',     spend: 16_500_000, clicks: 6130, impressions: 220400, conversions: 489, ctr: 2.78, cpc: 2691 },
      { name: 'Performance', spend:  8_700_000, clicks: 3870, impressions:  69900, conversions: 167, ctr: 5.54, cpc: 2247 },
    ],
    campaigns: [
      { name: 'Brand Awareness Q1',         type: 'Search',  spend: 8_400_000, clicks: 2340, impressions: 61800, conversions: 188, ctr: 3.78, cpc: 3590, cvr: 8.03, cpa: 44680 },
      { name: 'Retargeting · Cart',          type: 'Display', spend: 4_200_000, clicks: 1780, impressions: 52600, conversions: 218, ctr: 3.38, cpc: 2360, cvr: 12.2, cpa: 19266 },
      { name: 'Product Launch · Bold Brew',  type: 'Search',  spend: 6_100_000, clicks: 1980, impressions: 52700, conversions: 158, ctr: 3.76, cpc: 3081, cvr: 7.98, cpa: 38607 },
      { name: 'Ramadan Promo',               type: 'Display', spend: 2_900_000, clicks:  920, impressions: 28800, conversions:  78, ctr: 3.20, cpc: 3152, cvr: 8.48, cpa: 37179 },
    ],
    adGroups: [
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Exact',      type: 'Search',  spend: 3_200_000, clicks: 980, impressions: 24800, conversions: 88,  ctr: 3.95, cpc: 3265, cvr: 8.98, cpa: 36364 },
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Phrase',     type: 'Search',  spend: 2_800_000, clicks: 840, impressions: 22400, conversions: 64,  ctr: 3.75, cpc: 3333, cvr: 7.62, cpa: 43750 },
      { name: 'Retargeting · Cart',  campaign: 'Retargeting · Cart',  ad_group: 'Cart Abandoners',   type: 'Display', spend: 2_600_000, clicks: 1120, impressions: 31200, conversions: 148, ctr: 3.59, cpc: 2321, cvr: 13.2, cpa: 17568 },
      { name: 'Retargeting · Cart',  campaign: 'Retargeting · Cart',  ad_group: 'Product Viewers',   type: 'Display', spend: 1_600_000, clicks:  660, impressions: 21400, conversions:  70, ctr: 3.08, cpc: 2424, cvr: 10.6, cpa: 22857 },
      { name: 'Product Launch · Bold Brew', campaign: 'Product Launch · Bold Brew', ad_group: 'New Coffee Line', type: 'Search', spend: 3_900_000, clicks: 1240, impressions: 32100, conversions: 102, ctr: 3.86, cpc: 3145, cvr: 8.23, cpa: 38235 },
      { name: 'Ramadan Promo',       campaign: 'Ramadan Promo',       ad_group: 'Promo Bundle',      type: 'Display', spend: 1_700_000, clicks:  540, impressions: 17200, conversions:  48, ctr: 3.14, cpc: 3148, cvr: 8.89, cpa: 35417 },
    ],
    keywords: [
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Exact',   keyword: 'kopi senja',          match_type: 'Exact', type: 'Search', spend: 1_840_000, clicks: 580, impressions: 14200, conversions: 52, ctr: 4.08, cpc: 3172, cvr: 8.97, cpa: 35385 },
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Exact',   keyword: 'kopi senja nusantara', match_type: 'Exact', type: 'Search', spend: 1_360_000, clicks: 400, impressions: 10600, conversions: 36, ctr: 3.77, cpc: 3400, cvr: 9.00, cpa: 37778 },
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Phrase',  keyword: 'beli kopi senja',      match_type: 'Phrase',type: 'Search', spend:   980_000, clicks: 310, impressions:  8400, conversions: 28, ctr: 3.69, cpc: 3161, cvr: 9.03, cpa: 35000 },
      { name: 'Product Launch · Bold Brew', campaign: 'Product Launch · Bold Brew', ad_group: 'New Coffee Line', keyword: 'kopi bold brew',  match_type: 'Broad', type: 'Search', spend: 2_100_000, clicks: 680, impressions: 17400, conversions: 56, ctr: 3.91, cpc: 3088, cvr: 8.24, cpa: 37500 },
      { name: 'Product Launch · Bold Brew', campaign: 'Product Launch · Bold Brew', ad_group: 'New Coffee Line', keyword: 'kopi specialty single origin', match_type: 'Phrase', type: 'Search', spend: 1_800_000, clicks: 560, impressions: 14700, conversions: 46, ctr: 3.81, cpc: 3214, cvr: 8.21, cpa: 39130 },
    ],
    keywordDeviceRows: [
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Exact',   keyword: 'kopi senja',          match_type: 'Exact', device: 'Mobile',  spend: 1_104_000, impressions: 8520,  clicks: 348, conversions: 31 },
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Exact',   keyword: 'kopi senja',          match_type: 'Exact', device: 'Desktop', spend:   552_000, impressions: 4260,  clicks: 174, conversions: 16 },
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Exact',   keyword: 'kopi senja',          match_type: 'Exact', device: 'Other',   spend:   184_000, impressions: 1420,  clicks:  58, conversions:  5 },
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Exact',   keyword: 'kopi senja nusantara', match_type: 'Exact', device: 'Mobile',  spend:   816_000, impressions: 6360,  clicks: 240, conversions: 22 },
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Exact',   keyword: 'kopi senja nusantara', match_type: 'Exact', device: 'Desktop', spend:   408_000, impressions: 3180,  clicks: 120, conversions: 10 },
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Phrase',  keyword: 'beli kopi senja',      match_type: 'Phrase',device: 'Mobile',  spend:   588_000, impressions: 5040,  clicks: 186, conversions: 17 },
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Phrase',  keyword: 'beli kopi senja',      match_type: 'Phrase',device: 'Desktop', spend:   294_000, impressions: 2520,  clicks:  93, conversions:  8 },
      { name: 'Product Launch · Bold Brew', campaign: 'Product Launch · Bold Brew', ad_group: 'New Coffee Line', keyword: 'kopi bold brew',             match_type: 'Broad', device: 'Mobile',  spend: 1_260_000, impressions: 10440, clicks: 408, conversions: 34 },
      { name: 'Product Launch · Bold Brew', campaign: 'Product Launch · Bold Brew', ad_group: 'New Coffee Line', keyword: 'kopi bold brew',             match_type: 'Broad', device: 'Desktop', spend:   630_000, impressions:  5220, clicks: 204, conversions: 17 },
      { name: 'Product Launch · Bold Brew', campaign: 'Product Launch · Bold Brew', ad_group: 'New Coffee Line', keyword: 'kopi specialty single origin',match_type: 'Phrase',device: 'Mobile',  spend: 1_080_000, impressions:  8820, clicks: 336, conversions: 28 },
      { name: 'Product Launch · Bold Brew', campaign: 'Product Launch · Bold Brew', ad_group: 'New Coffee Line', keyword: 'kopi specialty single origin',match_type: 'Phrase',device: 'Desktop', spend:   540_000, impressions:  4410, clicks: 168, conversions: 14 },
    ],
    adGroupDeviceRows: [
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Exact',   type: 'Search',  device: 'Mobile',  spend: 1_920_000, impressions: 14880, clicks: 588, conversions: 53 },
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Exact',   type: 'Search',  device: 'Desktop', spend:   960_000, impressions:  7440, clicks: 294, conversions: 26 },
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Phrase',  type: 'Search',  device: 'Mobile',  spend: 1_680_000, impressions: 13440, clicks: 504, conversions: 38 },
      { name: 'Brand Awareness Q1', campaign: 'Brand Awareness Q1', ad_group: 'Brand - Phrase',  type: 'Search',  device: 'Desktop', spend:   840_000, impressions:  6720, clicks: 252, conversions: 19 },
      { name: 'Retargeting · Cart',  campaign: 'Retargeting · Cart',  ad_group: 'Cart Abandoners', type: 'Display', device: 'Mobile',  spend: 1_560_000, impressions: 18720, clicks: 672, conversions:  89 },
      { name: 'Retargeting · Cart',  campaign: 'Retargeting · Cart',  ad_group: 'Cart Abandoners', type: 'Display', device: 'Desktop', spend:   780_000, impressions:  9360, clicks: 336, conversions:  44 },
      { name: 'Retargeting · Cart',  campaign: 'Retargeting · Cart',  ad_group: 'Product Viewers', type: 'Display', device: 'Mobile',  spend:   960_000, impressions: 12840, clicks: 396, conversions:  42 },
      { name: 'Retargeting · Cart',  campaign: 'Retargeting · Cart',  ad_group: 'Product Viewers', type: 'Display', device: 'Desktop', spend:   480_000, impressions:  6420, clicks: 198, conversions:  21 },
      { name: 'Product Launch · Bold Brew', campaign: 'Product Launch · Bold Brew', ad_group: 'New Coffee Line', type: 'Search', device: 'Mobile',  spend: 2_340_000, impressions: 19260, clicks: 744, conversions:  61 },
      { name: 'Product Launch · Bold Brew', campaign: 'Product Launch · Bold Brew', ad_group: 'New Coffee Line', type: 'Search', device: 'Desktop', spend: 1_170_000, impressions:  9630, clicks: 372, conversions:  31 },
    ],
    deviceRows: [
      { name: 'Brand Awareness Q1',        campaign: 'Brand Awareness Q1',        type: 'Search',  device: 'Mobile',  spend: 5_040_000, impressions: 37080, clicks: 1404, conversions: 113 },
      { name: 'Brand Awareness Q1',        campaign: 'Brand Awareness Q1',        type: 'Search',  device: 'Desktop', spend: 2_520_000, impressions: 18540, clicks:  702, conversions:  56 },
      { name: 'Brand Awareness Q1',        campaign: 'Brand Awareness Q1',        type: 'Search',  device: 'Other',   spend:   840_000, impressions:  6180, clicks:  234, conversions:  19 },
      { name: 'Retargeting · Cart',         campaign: 'Retargeting · Cart',         type: 'Display', device: 'Mobile',  spend: 2_520_000, impressions: 31560, clicks: 1068, conversions: 131 },
      { name: 'Retargeting · Cart',         campaign: 'Retargeting · Cart',         type: 'Display', device: 'Desktop', spend: 1_260_000, impressions: 15780, clicks:  534, conversions:  65 },
      { name: 'Retargeting · Cart',         campaign: 'Retargeting · Cart',         type: 'Display', device: 'Other',   spend:   420_000, impressions:  5260, clicks:  178, conversions:  22 },
      { name: 'Product Launch · Bold Brew', campaign: 'Product Launch · Bold Brew', type: 'Search',  device: 'Mobile',  spend: 3_660_000, impressions: 31620, clicks: 1188, conversions:  95 },
      { name: 'Product Launch · Bold Brew', campaign: 'Product Launch · Bold Brew', type: 'Search',  device: 'Desktop', spend: 1_830_000, impressions: 15810, clicks:  594, conversions:  47 },
      { name: 'Ramadan Promo',              campaign: 'Ramadan Promo',              type: 'Display', device: 'Mobile',  spend: 1_740_000, impressions: 17280, clicks:  552, conversions:  47 },
      { name: 'Ramadan Promo',              campaign: 'Ramadan Promo',              type: 'Display', device: 'Desktop', spend:   870_000, impressions:  8640, clicks:  276, conversions:  23 },
      { name: 'Ramadan Promo',              campaign: 'Ramadan Promo',              type: 'Display', device: 'Other',   spend:   290_000, impressions:  2880, clicks:   92, conversions:   8 },
    ],
    genderRows: [
      { name: 'Brand Awareness Q1',        campaign: 'Brand Awareness Q1',        segment_value: 'Male',    spend: 5_040_000, impressions: 37080, clicks: 1404, conversions: 113 },
      { name: 'Brand Awareness Q1',        campaign: 'Brand Awareness Q1',        segment_value: 'Female',  spend: 2_520_000, impressions: 18540, clicks:  702, conversions:  56 },
      { name: 'Brand Awareness Q1',        campaign: 'Brand Awareness Q1',        segment_value: 'Unknown', spend:   840_000, impressions:  6180, clicks:  234, conversions:  19 },
      { name: 'Retargeting · Cart',         campaign: 'Retargeting · Cart',         segment_value: 'Male',    spend: 2_100_000, impressions: 26280, clicks:  890, conversions: 109 },
      { name: 'Retargeting · Cart',         campaign: 'Retargeting · Cart',         segment_value: 'Female',  spend: 1_680_000, impressions: 21040, clicks:  712, conversions:  87 },
      { name: 'Retargeting · Cart',         campaign: 'Retargeting · Cart',         segment_value: 'Unknown', spend:   420_000, impressions:  5260, clicks:  178, conversions:  22 },
      { name: 'Product Launch · Bold Brew', campaign: 'Product Launch · Bold Brew', segment_value: 'Male',    spend: 3_660_000, impressions: 31620, clicks: 1188, conversions:  95 },
      { name: 'Product Launch · Bold Brew', campaign: 'Product Launch · Bold Brew', segment_value: 'Female',  spend: 1_830_000, impressions: 15810, clicks:  594, conversions:  47 },
      { name: 'Ramadan Promo',              campaign: 'Ramadan Promo',              segment_value: 'Male',    spend: 1_740_000, impressions: 17280, clicks:  552, conversions:  47 },
      { name: 'Ramadan Promo',              campaign: 'Ramadan Promo',              segment_value: 'Female',  spend:   870_000, impressions:  8640, clicks:  276, conversions:  23 },
      { name: 'Ramadan Promo',              campaign: 'Ramadan Promo',              segment_value: 'Unknown', spend:   290_000, impressions:  2880, clicks:   92, conversions:   8 },
    ],
    meta:     { spend: 32_400_000, impressions: 680000, clicks: 12400, conversions: 842, ctr: 1.82, cpc: 2613, cpa: 38478, roas: 2.74 },
    metaPrev: { spend: 28_800_000, impressions: 610000, clicks: 10900, conversions: 720, ctr: 1.79, cpc: 2642, cpa: 40000, roas: 2.51 },
    metaSeries: {
      spend:       Array.from({length: 31}, (_, i) => 900_000 + Math.sin(i * 0.4) * 200_000 + i * 15_000),
      clicks:      Array.from({length: 31}, (_, i) => 380 + Math.sin(i * 0.3) * 80 + i * 4),
      impressions: Array.from({length: 31}, (_, i) => 20000 + Math.sin(i * 0.2) * 4000 + i * 300),
      conversions: Array.from({length: 31}, (_, i) => 26 + Math.sin(i * 0.35) * 6 + i * 0.2),
      labels:      Array.from({length: 31}, (_, i) => `2025-03-${String(i+1).padStart(2,'0')}`),
    },
    metaChannels: [
      { name: 'Retargeting Campaign',    spend: 14_200_000, clicks: 5480, impressions: 290000, conversions: 412, ctr: 1.89, cpc: 2591 },
      { name: 'Prospecting - Interest',  spend: 10_800_000, clicks: 4230, impressions: 240000, conversions: 298, ctr: 1.76, cpc: 2554 },
      { name: 'Lookalike Audience',      spend:  7_400_000, clicks: 2690, impressions: 150000, conversions: 132, ctr: 1.79, cpc: 2750 },
    ],
    metaRows: [
      { date: '2025-03-01', campaign_name: 'Retargeting Campaign',   adset_name: 'Retargeting - Website Visitors', ad_name: 'Ad Video 1', spend: 4_800_000, link_clicks: 1820, impressions: 96000,  reach: 48000, leads: 58, purchases: 12, purchase_value: 3_600_000 },
      { date: '2025-03-01', campaign_name: 'Retargeting Campaign',   adset_name: 'Retargeting - App Users',        ad_name: 'Ad Image 2', spend: 4_200_000, link_clicks: 1640, impressions: 88000,  reach: 44000, leads: 42, purchases:  9, purchase_value: 2_700_000 },
      { date: '2025-03-01', campaign_name: 'Prospecting - Interest', adset_name: 'Interest - Health & Wellness',   ad_name: 'Ad Video 3', spend: 5_500_000, link_clicks: 2100, impressions: 120000, reach: 62000, leads: 74, purchases: 15, purchase_value: 4_500_000 },
      { date: '2025-03-01', campaign_name: 'Prospecting - Interest', adset_name: 'Interest - Medical',             ad_name: 'Ad Image 4', spend: 3_900_000, link_clicks: 1480, impressions:  96000, reach: 49000, leads: 51, purchases: 10, purchase_value: 3_000_000 },
      { date: '2025-03-01', campaign_name: 'Lookalike Audience',     adset_name: 'LAL - Purchasers 1%',            ad_name: 'Ad Video 5', spend: 4_100_000, link_clicks: 1390, impressions:  78000, reach: 39000, leads: 38, purchases:  7, purchase_value: 2_100_000 },
      { date: '2025-03-08', campaign_name: 'Retargeting Campaign',   adset_name: 'Retargeting - Website Visitors', ad_name: 'Ad Video 1', spend: 5_200_000, link_clicks: 2020, impressions: 104000, reach: 52000, leads: 64, purchases: 14, purchase_value: 4_200_000 },
      { date: '2025-03-08', campaign_name: 'Prospecting - Interest', adset_name: 'Interest - Health & Wellness',   ad_name: 'Ad Video 3', spend: 6_100_000, link_clicks: 2380, impressions: 134000, reach: 68000, leads: 82, purchases: 17, purchase_value: 5_100_000 },
    ],
    ga4Rows: [
      { date: '2025-03-01', property_name: 'Demo Website', sessions: 1240, total_users: 980, new_users: 640, returning_users: 340, engaged_sessions: 880, bounce_rate: 0.28, engagement_rate: 0.71, avg_session_duration: 132, user_engagement_duration: 94, event_count: 3840 },
      { date: '2025-03-02', property_name: 'Demo Website', sessions: 1380, total_users: 1060, new_users: 720, returning_users: 340, engaged_sessions: 960, bounce_rate: 0.30, engagement_rate: 0.70, avg_session_duration: 128, user_engagement_duration: 90, event_count: 4260 },
      { date: '2025-03-03', property_name: 'Demo Website', sessions: 1120, total_users: 890, new_users: 580, returning_users: 310, engaged_sessions: 790, bounce_rate: 0.29, engagement_rate: 0.71, avg_session_duration: 125, user_engagement_duration: 88, event_count: 3460 },
      { date: '2025-03-04', property_name: 'Demo Website', sessions: 1560, total_users: 1210, new_users: 820, returning_users: 390, engaged_sessions: 1100, bounce_rate: 0.27, engagement_rate: 0.71, avg_session_duration: 140, user_engagement_duration: 100, event_count: 4820 },
      { date: '2025-03-05', property_name: 'Demo Website', sessions: 1690, total_users: 1320, new_users: 890, returning_users: 430, engaged_sessions: 1200, bounce_rate: 0.25, engagement_rate: 0.71, avg_session_duration: 145, user_engagement_duration: 103, event_count: 5230 },
      { date: '2025-03-06', property_name: 'Demo Website', sessions: 980,  total_users: 760,  new_users: 490, returning_users: 270, engaged_sessions: 680,  bounce_rate: 0.31, engagement_rate: 0.69, avg_session_duration: 119, user_engagement_duration: 84, event_count: 3030 },
      { date: '2025-03-07', property_name: 'Demo Website', sessions: 1050, total_users: 820,  new_users: 540, returning_users: 280, engaged_sessions: 730,  bounce_rate: 0.30, engagement_rate: 0.70, avg_session_duration: 122, user_engagement_duration: 87, event_count: 3250 },
    ],
  };
}

// Fetch all rows from a Supabase query, paging 1000 at a time to bypass PostgREST max_rows cap.
async function fetchPaged(q, pageSize) {
  pageSize = pageSize || 1000;
  var all = [];
  var offset = 0;
  while (true) {
    var res = await q.range(offset, offset + pageSize - 1);
    if (res.error || !res.data || res.data.length === 0) break;
    all = all.concat(res.data);
    if (res.data.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

// ── Fetcher ─────────────────────────────────────────────────────────
// NOTE: Supabase query builder is immutable — .eq()/.gte()/.lte() return
// new objects. Always reassign: q = q.eq(...).
async function fetchAll(account, ga4Property, gscProperty, psiUrl, from, to, metaAccount) {
  if (!_supa) return null;
  try {
    // ── Google Ads ──────────────────────────────────────────────
    // Query from the campaign-level daily view (aggregated server-side) so the
    // limit is never hit even for accounts with thousands of keyword-level rows.
    let adsQ = _supa.from('google_ads_daily')
      .select('day, account_name, campaign_name, campaign_type, spend, impressions, clicks, conversions')
      .order('day', { ascending: true })
      .limit(50000);
    if (account) adsQ = adsQ.eq('account_name', account);
    if (from)    adsQ = adsQ.gte('day', from);
    if (to)      adsQ = adsQ.lte('day', to);

    // ── Google Ads Detail (ad_group + keyword level) ────────────
    // Primary: ads_data (from Google Sheets sync) — same source as google_ads_daily,
    // gives accurate totals. Fallback: google_ads (direct API, may miss DSA spend).
    let adsSheetQ = _supa.from('ads_data')
      .select('day, campaign_name, campaign_type, ad_group, keyword, match_type, spend, impressions, clicks, conversions')
      .order('day', { ascending: true });
    if (from) adsSheetQ = adsSheetQ.gte('day', from);
    if (to)   adsSheetQ = adsSheetQ.lte('day', to);

    let adsDetailQ = _supa.from('google_ads')
      .select('day, account_name, campaign_name, campaign_type, ad_group, keyword, match_type, device, spend, impressions, clicks, conversions')
      .order('day', { ascending: true });
    if (account) adsDetailQ = adsDetailQ.eq('account_name', account);
    if (from)    adsDetailQ = adsDetailQ.gte('day', from);
    if (to)      adsDetailQ = adsDetailQ.lte('day', to);

    // ── Google Ads Segments (conversion actions + gender) ───────
    let adsSegQ = _supa.from('google_ads_seg')
      .select('day, account_name, campaign_name, segment_type, segment_value, spend, impressions, clicks, conversions')
      .in('segment_type', ['conversion_action', 'gender'])
      .order('day', { ascending: true })
      .limit(50000);
    if (account) adsSegQ = adsSegQ.eq('account_name', account);
    if (from)    adsSegQ = adsSegQ.gte('day', from);
    if (to)      adsSegQ = adsSegQ.lte('day', to);

    // ── Meta Ads ────────────────────────────────────────────────
    // Query from campaign-level view (aggregated server-side) — no LIMIT issue.
    const metaQ = (_metaSupa && metaAccount !== null)
      ? (() => {
          let q = _metaSupa.from('meta_ads_daily')
            .select('date, account_name, campaign_name, spend, impressions, reach, link_clicks, landing_page_views, leads, complete_registrations, messaging_conv_started, contacts, ig_profile_visits, post_engagements, content_views, purchases, purchase_value, add_to_carts, add_to_cart_value, currency')
            .order('date', { ascending: true })
            .limit(20000);
          if (metaAccount) q = q.eq('account_name', metaAccount);
          if (from) q = q.gte('date', from);
          if (to)   q = q.lte('date', to);
          return q;
        })()
      : Promise.resolve({ data: [] });

    // ── Meta Ads Insights (ad-set / ad level for table widget) ──
    const metaInsightsQ = (_metaSupa && metaAccount !== null)
      ? (() => {
          let q = _metaSupa.from('meta_ads_insights')
            .select('campaign_name, adset_name, ad_name, date, spend, impressions, reach, link_clicks, landing_page_views, leads, complete_registrations, messaging_conv_started, contacts, ig_profile_visits, post_engagements, content_views, purchases, purchase_value, add_to_carts, add_to_cart_value')
            .order('date', { ascending: true })
            .limit(20000);
          if (metaAccount) q = q.eq('account_name', metaAccount);
          if (from) q = q.gte('date', from);
          if (to)   q = q.lte('date', to);
          return q;
        })()
      : Promise.resolve({ data: [] });

    // ── GA4 Totals (date-level aggregates for KPI cards + chart) ──
    const ga4Q = (_ga4Supa && ga4Property !== null)
      ? (() => {
          let q = _ga4Supa.from('ga4_totals')
            .select('date, property_name, sessions, total_users, new_users, bounce_rate, engaged_sessions, engagement_rate, avg_session_duration, event_count')
            .order('date', { ascending: true })
            .limit(10000);
          if (ga4Property) q = q.eq('property_name', ga4Property);
          if (from) q = q.gte('date', from);
          if (to)   q = q.lte('date', to);
          return q;
        })()
      : Promise.resolve({ data: [] });

    // ── GA4 Demographics (gender, country) ────────────────────────
    const ga4DemoQ = (_ga4Supa && ga4Property !== null)
      ? (() => {
          let q = _ga4Supa.from('ga4_demographics')
            .select('*')
            .order('date', { ascending: false })
            .limit(5000);
          if (ga4Property) q = q.eq('property_name', ga4Property);
          if (from) q = q.gte('date', from);
          if (to)   q = q.lte('date', to);
          return q;
        })()
      : Promise.resolve({ data: [] });

    // ── GA4 Pages (page_path) ──────────────────────────────────────
    const ga4PageQ = (_ga4Supa && ga4Property !== null)
      ? (() => {
          let q = _ga4Supa.from('ga4_pages')
            .select('property_name,date,page_path,device,total_users,new_users,sessions,engaged_sessions,bounce_rate,engagement_rate,avg_session_duration,event_count')
            .order('date', { ascending: false })
            .limit(2000);
          if (ga4Property) q = q.eq('property_name', ga4Property);
          if (from) q = q.gte('date', from);
          if (to)   q = q.lte('date', to);
          return q;
        })()
      : Promise.resolve({ data: [] });

    // ── GA4 Sessions (device, channel_group, medium, source) ──────
    // No ORDER BY — requires index: CREATE INDEX ON ga4_sessions (property_name, date DESC)
    const GA4_SESSION_COLS = 'property_name,date,country,region,city,device,channel_group,medium,source,sessions,total_users,returning_users,new_users,engaged_sessions,event_count,bounce_rate,engagement_rate,avg_session_duration';
    const ga4SessionQ = (_ga4Supa && ga4Property !== null)
      ? (() => {
          let q = _ga4Supa.from('ga4_sessions')
            .select(GA4_SESSION_COLS)
            .limit(2000);
          if (ga4Property) q = q.eq('property_name', ga4Property);
          if (from) q = q.gte('date', from);
          if (to)   q = q.lte('date', to);
          return q;
        })()
      : Promise.resolve({ data: [] });

    // ── Search Console ──────────────────────────────────────────
    // Two-query approach to avoid Supabase's 1000-row PostgREST cap:
    //   1. search_console_summary → (date, property) level — max ~30 rows/month per property
    //   2. search_console_daily   → (date, property, query) — top queries only, small limit
    const gscSummaryQ = (_gscSupa && gscProperty !== null)
      ? (() => {
          let q = _gscSupa.from('search_console_summary')
            .select('date, property, impressions, clicks, ctr, position')
            .order('date', { ascending: true })
            .limit(10000);
          if (gscProperty) q = q.eq('property', gscProperty);
          if (from) q = q.gte('date', from);
          if (to)   q = q.lte('date', to);
          return q;
        })()
      : Promise.resolve({ data: [] });
    const gscQueryQ = (_gscSupa && gscProperty !== null)
      ? (() => {
          let q = _gscSupa.from('search_console_daily')
            .select('date, query, impressions, clicks, position')
            .order('clicks', { ascending: false })
            .limit(50);
          if (gscProperty) q = q.eq('property', gscProperty);
          if (from) q = q.gte('date', from);
          if (to)   q = q.lte('date', to);
          return q;
        })()
      : Promise.resolve({ data: [] });
    const gscPagesQ = (_gscSupa && gscProperty !== null)
      ? (() => {
          let q = _gscSupa.from('search_console_pages')
            .select('page, impressions, clicks, position')
            .order('clicks', { ascending: false })
            .limit(200);
          if (gscProperty) q = q.eq('property', gscProperty);
          if (from) q = q.gte('date', from);
          if (to)   q = q.lte('date', to);
          return q;
        })()
      : Promise.resolve({ data: [] });

    // Country and device breakdown — dedicated tables, not search_console_daily
    const gscCountryQ = (_gscSupa && gscProperty !== null)
      ? (() => {
          let q = _gscSupa.from('search_console_countries')
            .select('country, impressions, clicks, position')
            .order('clicks', { ascending: false })
            .limit(200);
          if (gscProperty) q = q.eq('property', gscProperty);
          if (from) q = q.gte('date', from);
          if (to)   q = q.lte('date', to);
          return q;
        })()
      : Promise.resolve({ data: [] });
    const gscDeviceQ = (_gscSupa && gscProperty !== null)
      ? (() => {
          let q = _gscSupa.from('search_console_devices')
            .select('device, impressions, clicks, position')
            .order('clicks', { ascending: false })
            .limit(200);
          if (gscProperty) q = q.eq('property', gscProperty);
          if (from) q = q.gte('date', from);
          if (to)   q = q.lte('date', to);
          return q;
        })()
      : Promise.resolve({ data: [] });

    // ── PageSpeed Insights ──────────────────────────────────────
    // Fetch latest rows for URL, descending by day.
    // If a date range is selected, filter within it; if no data found, fall back to latest overall.
    let psiQ = psiUrl
      ? (() => {
          let q = _ga4Supa.from('pagespeed')
            .select('day, url, performance_score, seo_score, accessibility_score, best_practices_score')
            .eq('url', psiUrl)
            .order('day', { ascending: false })
            .limit(60);
          if (from) q = q.gte('day', from);
          if (to)   q = q.lte('day', to);
          return q;
        })()
      : Promise.resolve({ data: [] });

    const [adsR, adsSheetRaw, adsDetailRows, adsSegR, metaR, metaInsightsR, ga4R, ga4DemoR, ga4PageR, ga4SessionR, gscSumR, gscQryR, gscPgsR, gscCtyR, gscDevR, psiR] = await Promise.all([adsQ, fetchPaged(adsSheetQ), fetchPaged(adsDetailQ), adsSegQ, metaQ, metaInsightsQ, ga4Q, ga4DemoQ, ga4PageQ, ga4SessionQ, gscSummaryQ, gscQueryQ, gscPagesQ, gscCountryQ, gscDeviceQ, psiQ]);

    // search_console_summary: accurate daily totals from GSC API (dimensions: date, searchType: web)
    // Do NOT fall back to search_console_daily — per-query rows inflate impressions 5-10x
    if (gscSumR.error) console.warn('[Reportive] GSC summary error:',   gscSumR.error.message);
    if (gscQryR.error) console.warn('[Reportive] GSC queries error:',   gscQryR.error.message);
    if (gscPgsR.error) console.warn('[Reportive] GSC pages error:',     gscPgsR.error.message);
    if (gscCtyR.error) console.warn('[Reportive] GSC countries error:', gscCtyR.error.message);
    if (gscDevR.error) console.warn('[Reportive] GSC devices error:',   gscDevR.error.message);
    const gscSummaryData = (gscSumR.error || !gscSumR.data) ? [] : gscSumR.data;


    if (metaR.error)         console.warn('[Reportive] Meta error:',         metaR.error.message);
    if (metaInsightsR.error) console.warn('[Reportive] Meta insights error:', metaInsightsR.error.message);
    if (ga4R.error)          console.warn('[Reportive] GA4 error:',           ga4R.error.message);
    if (ga4DemoR.error)      console.warn('[Reportive] GA4 demographics error:', ga4DemoR.error.message);
    if (ga4PageR.error)      console.warn('[Reportive] GA4 pages error:',        ga4PageR.error.message);
    if (ga4SessionR.error)   console.warn('[Reportive] GA4 sessions error:',     ga4SessionR.error.message);

    const fetchErrors = [];
    if (metaR && metaR.error)       fetchErrors.push('Meta Ads: ' + metaR.error.message);
    if (ga4R && ga4R.error)         fetchErrors.push('GA4: ' + ga4R.error.message);
    if (gscSumR && gscSumR.error)   fetchErrors.push('Search Console: ' + gscSumR.error.message);
    if (adsR && adsR.error)         fetchErrors.push('Google Ads: ' + adsR.error.message);

    const metaData = metaR.error ? [] : (metaR.data || []);
    console.log('[Reportive] rows — meta:', metaData.length, '| meta insights:', (metaInsightsR.data || []).length, '| ga4:', (ga4R.data || []).length, '| ga4Demo:', (ga4DemoR.data || []).length, '| ga4Page:', (ga4PageR.data || []).length, '| ga4Session:', (ga4SessionR.data || []).length);

    // PSI fallback: date-range returned nothing → get latest available
    let psiData = psiR.error ? [] : (psiR.data || []);
    if (!psiData.length && psiUrl) {
      try {
        const fallbackR = await _ga4Supa.from('pagespeed')
          .select('day, url, performance_score, seo_score, accessibility_score, best_practices_score')
          .eq('url', psiUrl)
          .order('day', { ascending: false })
          .limit(10);
        psiData = fallbackR.error ? [] : (fallbackR.data || []);
      } catch (_) { /* ignore */ }
    }
    // PSI URL-variant fallback: try with/without trailing slash and http↔https
    if (!psiData.length && psiUrl) {
      const variants = [
        psiUrl.endsWith('/') ? psiUrl.slice(0, -1) : psiUrl + '/',
        psiUrl.startsWith('https://') ? psiUrl.replace('https://', 'http://') : psiUrl.replace('http://', 'https://'),
      ].filter(u => u !== psiUrl);
      for (const variant of variants) {
        if (psiData.length) break;
        try {
          const vR = await _ga4Supa.from('pagespeed')
            .select('day, url, performance_score, seo_score, accessibility_score, best_practices_score')
            .eq('url', variant)
            .order('day', { ascending: false })
            .limit(10);
          if (!vR.error && vR.data && vR.data.length) psiData = vR.data;
        } catch (_) { /* ignore */ }
      }
    }

    const adsSheetRows = (adsSheetRaw && adsSheetRaw.length) ? adsSheetRaw : null;
    return {
      ads:        adsR.error       ? [] : (adsR.data    || []),
      adsSheet:   adsSheetRows,
      adsDetail:  adsDetailRows,
      adsSeg:     adsSegR.error    ? [] : (adsSegR.data || []),
      meta:         metaData,
      metaInsights: metaInsightsR.error ? [] : (metaInsightsR.data || []),
      ga4:        ga4R.error       ? [] : (ga4R.data       || []),
      ga4Demo:    ga4DemoR.error    ? [] : (ga4DemoR.data    || []),
      ga4Page:    ga4PageR.error    ? [] : (ga4PageR.data    || []),
      ga4Session: ga4SessionR.error ? [] : (ga4SessionR.data || []),
      gscSummary:   gscSummaryData,
      gscQueries:   gscQryR.error ? [] : (gscQryR.data || []),
      gscPages:     gscPgsR.error ? [] : (gscPgsR.data || []),
      gscCountries: gscCtyR.error ? [] : (gscCtyR.data || []),
      gscDevices:   gscDevR.error ? [] : (gscDevR.data || []),
      psi:          psiData,
      _errors:      fetchErrors,
    };
  } catch (e) {
    console.warn('[Reportive] Fetch failed:', e.message);
    return null;
  }
}

// ── React context ────────────────────────────────────────────────────
const DataCtx = React.createContext(null);

function LiveProvider({ children }) {
  const [state, setState] = React.useState({
    loading: true, error: null, data: null, _isMock: false, fetchError: null,
  });
  const [account,             setAccount]             = React.useState(localStorage.getItem('avo_account') || '');
  const [metaAccount,         setMetaAccount]         = React.useState(null);
  const [ga4Property,         setGa4Property]         = React.useState(null);
  const [gscProperty,         setGscProperty]         = React.useState(null);
  const [psiUrl,              setPsiUrl]              = React.useState('');
  const [dateRange,           setDateRange]           = React.useState({ from: null, to: null });
  const [_anySourceConnected, _setAnySourceConnected] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true }));
    (async () => {
      const { from, to } = dateRange;
      const { prevFrom, prevTo } = computePrevRange(from, to);

      const [raw, rawPrev] = await Promise.all([
        fetchAll(account, ga4Property, gscProperty, psiUrl, from, to, metaAccount),
        (prevFrom && prevTo)
          ? fetchAll(account, ga4Property, gscProperty, psiUrl, prevFrom, prevTo, metaAccount)
          : Promise.resolve({ ads: [], adsDetail: [], adsSeg: [], meta: [], ga4: [], gscSummary: [], gscQueries: [], gscPages: [], psi: [] }),
      ]);
      if (cancelled) return;

      let data, isMock = false;
      const hasAnyData = raw && (
        (raw.ads        && raw.ads.length        > 0) ||
        (raw.meta       && raw.meta.length       > 0) ||
        (raw.ga4        && raw.ga4.length        > 0) ||
        (raw.gscSummary && raw.gscSummary.length > 0) ||
        (raw.psi        && raw.psi.length        > 0)
      );

      if (!raw) {
        data = mockData(); isMock = true;
      } else if (!hasAnyData && !_anySourceConnected) {
        data = mockData(); isMock = true;
      } else {
        data = buildData(
          raw.ads    || [], raw.ga4 || [], raw.psi || [],
          raw.gscSummary || [], raw.gscQueries || [],
          rawPrev.ads || [], rawPrev.ga4 || [],
          rawPrev.gscSummary || [], rawPrev.gscQueries || [],
          from, to, prevFrom, prevTo,
          raw.meta || [], rawPrev.meta || [],
          raw.gscPages || [], rawPrev.gscPages || [],
          raw.adsDetail || [], raw.adsSeg || [],
          raw.adsSheet || null,
          raw.gscCountries || [], raw.gscDevices || [],
          raw.metaInsights || [],
          raw.ga4Demo || [], raw.ga4Page || [], raw.ga4Session || [],
        );
      }
      const fetchError = (raw && raw._errors && raw._errors.length) ? raw._errors : null;
      setState({ loading: false, error: null, data, _isMock: isMock, fetchError });
    })();
    return () => { cancelled = true; };
  }, [account, metaAccount, ga4Property, gscProperty, psiUrl, dateRange, _anySourceConnected]);

  // Persist account filter
  React.useEffect(() => {
    if (account) localStorage.setItem('avo_account', account);
    else         localStorage.removeItem('avo_account');
  }, [account]);

  const ctx = React.useMemo(() => ({
    ...state,
    currentPeriod: state.data,   // backward-compat alias for live-cards.jsx
    accounts: [],                // backward-compat
    account,              setAccount,
    metaAccount,          setMetaAccount,
    ga4Property,          setGa4Property,
    gscProperty,          setGscProperty,
    psiUrl,               setPsiUrl,
    dateRange,            setDateRange,
    _anySourceConnected,  _setAnySourceConnected,
  }), [state, account, metaAccount, ga4Property, gscProperty, psiUrl, dateRange, _anySourceConnected]);

  return <DataCtx.Provider value={ctx}>{children}</DataCtx.Provider>;
}

const useLive = () => React.useContext(DataCtx);

// ── Public exports ───────────────────────────────────────────────────
window.LIVE = {
  LiveProvider,
  useLive,
  _ga4Supa,
  fmt: { rupiahShort: fmtRupiahShort, num: fmtNum, pct: fmtPct, roas: fmtRoas, pctChange },
};
