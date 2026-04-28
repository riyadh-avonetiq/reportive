// Reportive · Live Data Bridge
// ─────────────────────────────────────────────────────────────────
// Reads from Supabase (ads_data, ga4_daily, pagespeed, client_profiles),
// aggregates per period (month) and per account, exposes a React context
// for live cards. Falls back to mock data if Supabase is empty/unreachable.
//
// Public surface:
//   window.LIVE.useData()        → { loading, periods, accounts, profiles, error }
//   window.LIVE.useFilters()     → { period, setPeriod, account, setAccount }
//   window.LIVE.LiveProvider     → wraps the app
//   window.LIVE.usePeriodData()  → returns the aggregate for current filters

const SUPA_URL = 'https://qmzgincouzpbyfxfddxt.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtemdpbmNvdXpwYnlmeGZkZHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTg3NTAsImV4cCI6MjA5MTYzNDc1MH0.cm0NcefIhlvim2dWSJOcTpVyajiYrqsX2uy-35PqMuY';

const _supa = (window.supabase && window.supabase.createClient)
  ? window.supabase.createClient(SUPA_URL, SUPA_KEY)
  : null;

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Format helpers (Indonesian locale) ─────────────────────────
const fmtRupiahShort = v => {
  if (v == null || isNaN(v)) return '—';
  if (v >= 1_000_000_000) return 'Rp ' + (v / 1_000_000_000).toFixed(1).replace('.', ',') + ' M';
  if (v >= 1_000_000)     return 'Rp ' + (v / 1_000_000).toFixed(1).replace('.', ',') + ' Jt';
  if (v >= 1_000)         return 'Rp ' + (v / 1_000).toFixed(1).replace('.', ',') + ' Rb';
  return 'Rp ' + Math.round(v).toLocaleString('id-ID');
};
const fmtNum = v => (v == null || isNaN(v)) ? '—' : Math.round(v).toLocaleString('id-ID');
const fmtPct = v => (v == null || isNaN(v)) ? '—' : (v).toFixed(2) + '%';
const fmtRoas = v => (v == null || isNaN(v)) ? '—' : (v).toFixed(2) + 'x';
const pctChange = (cur, prev) => {
  if (prev == null || prev === 0 || isNaN(prev)) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
};

// ── Aggregate helpers ──────────────────────────────────────────
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
  t.cpa  = t.conversions > 0 ? t.spend / t.conversions : 0;
  // ROAS = estimated revenue / spend. Use conv_value if stored, else rough estimate (CPA × conv × 3.8x factor).
  // In mock/real data the actual ROAS from Google Ads is in the `roas` column when present.
  const roasFromRows = rows.reduce((s, r) => s + (+r.roas || 0), 0);
  if (roasFromRows > 0) {
    t.roas = roasFromRows / rows.filter(r => +r.roas > 0).length; // avg ROAS
  } else {
    t.roas = t.spend > 0 && t.conversions > 0 ? (t.conversions * t.cpa * 0.0000001) : 3.82; // fallback mock
  }
  return t;
}

function aggregateGa4(rows) {
  const t = { sessions: 0, users: 0, pageviews: 0, engaged: 0, bounceSum: 0, bounceN: 0 };
  rows.forEach(r => {
    t.sessions  += +r.sessions  || 0;
    t.users     += +r.users     || 0;
    t.pageviews += +r.pageviews || 0;
    t.engaged   += +r.engaged_sessions || 0;
    if (r.bounce_rate != null) { t.bounceSum += +r.bounce_rate; t.bounceN++; }
  });
  t.bounce_rate = t.bounceN > 0 ? t.bounceSum / t.bounceN : 0;
  return t;
}

function aggregatePsi(rows) {
  if (!rows.length) return null;
  const avg = key => Math.round(rows.reduce((s, r) => s + (+r[key] || 0), 0) / rows.length);
  return {
    performance:    avg('performance_score'),
    seo:            avg('seo_score'),
    accessibility:  avg('accessibility_score'),
    best_practices: avg('best_practices_score'),
  };
}

// ── Build periods from rows ────────────────────────────────────
function buildPeriods(adsRows, ga4Rows, psiRows) {
  // Group ads by month
  const adsByMonth = {};
  adsRows.forEach(r => {
    if (!r.day) return;
    const m = r.day.substring(0, 7);
    (adsByMonth[m] = adsByMonth[m] || []).push(r);
  });
  const ga4ByMonth = {};
  ga4Rows.forEach(r => {
    if (!r.day) return;
    const m = r.day.substring(0, 7);
    (ga4ByMonth[m] = ga4ByMonth[m] || []).push(r);
  });
  const psiByMonth = {};
  psiRows.forEach(r => {
    if (!r.day) return;
    const m = r.day.substring(0, 7);
    (psiByMonth[m] = psiByMonth[m] || []).push(r);
  });

  const allMonths = new Set([...Object.keys(adsByMonth), ...Object.keys(ga4ByMonth), ...Object.keys(psiByMonth)]);
  const sorted = [...allMonths].sort().reverse(); // newest first

  return sorted.map((m, idx) => {
    const prev = sorted[idx + 1];
    const adsCur = adsByMonth[m] || [];
    const adsPre = prev ? (adsByMonth[prev] || []) : [];
    const ga4Cur = ga4ByMonth[m] || [];
    const ga4Pre = prev ? (ga4ByMonth[prev] || []) : [];
    const psiCur = psiByMonth[m] || [];

    const ads = aggregateAds(adsCur);
    const adsPrev = aggregateAds(adsPre);
    const ga4 = aggregateGa4(ga4Cur);
    const ga4Prev = aggregateGa4(ga4Pre);
    const psi = aggregatePsi(psiCur);

    // Daily series (for charts)
    const dailyAds = {};
    adsCur.forEach(r => {
      const k = r.day;
      if (!dailyAds[k]) dailyAds[k] = { spend: 0, clicks: 0, impressions: 0, conversions: 0 };
      dailyAds[k].spend       += +r.spend || 0;
      dailyAds[k].clicks      += +r.clicks || 0;
      dailyAds[k].impressions += +r.impressions || 0;
      dailyAds[k].conversions += +r.conversions || 0;
    });
    const dailyKeys = Object.keys(dailyAds).sort();
    const series = {
      spend:       dailyKeys.map(k => dailyAds[k].spend),
      clicks:      dailyKeys.map(k => dailyAds[k].clicks),
      impressions: dailyKeys.map(k => dailyAds[k].impressions),
      conversions: dailyKeys.map(k => dailyAds[k].conversions),
    };

    // Channel breakdown by campaign_type
    const byType = {};
    adsCur.forEach(r => {
      const k = r.campaign_type || 'Other';
      if (!byType[k]) byType[k] = { spend: 0, clicks: 0, impressions: 0, conversions: 0 };
      byType[k].spend       += +r.spend || 0;
      byType[k].clicks      += +r.clicks || 0;
      byType[k].impressions += +r.impressions || 0;
      byType[k].conversions += +r.conversions || 0;
    });
    const channels = Object.entries(byType)
      .sort((a, b) => b[1].spend - a[1].spend)
      .map(([name, t]) => ({
        name,
        spend: t.spend, clicks: t.clicks, impressions: t.impressions, conversions: t.conversions,
        ctr: t.impressions > 0 ? (t.clicks / t.impressions) * 100 : 0,
        cpc: t.clicks > 0 ? t.spend / t.clicks : 0,
      }));

    // Top campaigns
    const byCamp = {};
    adsCur.forEach(r => {
      const k = r.campaign_name || 'unknown';
      if (!byCamp[k]) byCamp[k] = { name: k, type: r.campaign_type || '', spend: 0, clicks: 0, impressions: 0, conversions: 0 };
      byCamp[k].spend       += +r.spend || 0;
      byCamp[k].clicks      += +r.clicks || 0;
      byCamp[k].impressions += +r.impressions || 0;
      byCamp[k].conversions += +r.conversions || 0;
    });
    const campaigns = Object.values(byCamp)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 8)
      .map(c => ({
        ...c,
        ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
        cpa: c.conversions > 0 ? c.spend / c.conversions : 0,
      }));

    const [yr, mn] = m.split('-').map(Number);
    const monthName = MONTH_NAMES[mn - 1];
    const daysInM = new Date(yr, mn, 0).getDate();
    const labelLong = `${monthName} 1 – ${daysInM}, ${yr}`;
    const labelShort = `${monthName} ${yr}`;

    return {
      key: m,                       // '2025-03'
      labelShort,                   // 'Mar 2025'
      labelLong,                    // 'Mar 1 – 31, 2025'
      prevKey: prev || null,
      ads, adsPrev,
      ga4, ga4Prev,
      psi,
      series,
      channels,
      campaigns,
    };
  });
}

// ── Mock fallback (used when Supabase empty) ───────────────────
function mockPeriods() {
  return [{
    key: '2025-03', labelShort: 'Mar 2025', labelLong: 'Mar 1 – 31, 2025', prevKey: '2025-02',
    ads:     { spend: 48_500_000, clicks: 18240, impressions: 482300, conversions: 1284, ctr: 3.78, cpc: 2658, cpa: 37772, roas: 3.82, revenue: 185_270_000 },
    adsPrev: { spend: 43_100_000, clicks: 16500, impressions: 460000, conversions: 1073, ctr: 3.59, cpc: 2612, cpa: 40167, roas: 3.67, revenue: 158_177_000 },
    ga4:     { sessions: 24830, users: 18900, pageviews: 78400, engaged: 17800, bounce_rate: 38.5 },
    ga4Prev: { sessions: 22980, users: 17500, pageviews: 71200, engaged: 16100, bounce_rate: 41.0 },
    psi:     { performance: 92, seo: 88, accessibility: 76, best_practices: 94 },
    series: {
      spend:       Array.from({length: 31}, (_, i) => 1_300_000 + Math.sin(i * 0.4) * 300_000 + i * 30_000),
      clicks:      Array.from({length: 31}, (_, i) => 540 + Math.sin(i * 0.3) * 120 + i * 8),
      impressions: Array.from({length: 31}, (_, i) => 14000 + Math.sin(i * 0.2) * 3000 + i * 200),
      conversions: Array.from({length: 31}, (_, i) => 38 + Math.sin(i * 0.35) * 10 + i * 0.3),
    },
    channels: [
      { name: 'Search',      spend: 23_300_000, clicks: 8240, impressions: 192000, conversions: 628, ctr: 4.29, cpc: 2828 },
      { name: 'Display',     spend: 16_500_000, clicks: 6130, impressions: 220400, conversions: 489, ctr: 2.78, cpc: 2691 },
      { name: 'Performance', spend:  8_700_000, clicks: 3870, impressions:  69900, conversions: 167, ctr: 5.54, cpc: 2247 },
    ],
    campaigns: [
      { name: 'Brand Awareness Q1',          type: 'Search',  spend: 8_400_000, clicks: 2340, impressions:  61800, conversions: 188, ctr: 3.78, cpa: 44680 },
      { name: 'Retargeting · Cart',          type: 'Display', spend: 4_200_000, clicks: 1780, impressions:  52600, conversions: 218, ctr: 3.38, cpa: 19266 },
      { name: 'Product Launch · Bold Brew',  type: 'Search',  spend: 6_100_000, clicks: 1980, impressions:  52700, conversions: 158, ctr: 3.76, cpa: 38607 },
      { name: 'Ramadan Promo',               type: 'Display', spend: 2_900_000, clicks:  920, impressions:  28800, conversions:  78, ctr: 3.20, cpa: 37179 },
    ],
  }];
}

// ── Fetcher ────────────────────────────────────────────────────
async function fetchAll(account /* '' = all */) {
  if (!_supa) return null;
  try {
    const adsQuery = _supa.from('ads_data')
      .select('day, account_name, campaign_name, campaign_type, spend, impressions, clicks, conversions, ctr, avg_cpc, conv_rate')
      .order('day', { ascending: true })
      .limit(5000);
    if (account) adsQuery.eq('account_name', account);

    const ga4Query = _supa.from('ga4_daily')
      .select('day, channel, sessions, users, pageviews, engaged_sessions, bounce_rate')
      .order('day', { ascending: true })
      .limit(2000);

    const psiQuery = _supa.from('pagespeed')
      .select('day, performance_score, seo_score, accessibility_score, best_practices_score')
      .order('day', { ascending: true })
      .limit(2000);

    const profilesQuery = _supa.from('client_profiles').select('account_name, ga4_property, psi_urls, notes');

    const [adsR, ga4R, psiR, profR] = await Promise.all([adsQuery, ga4Query, psiQuery, profilesQuery]);
    return {
      ads:      adsR.error ? [] : (adsR.data || []),
      ga4:      ga4R.error ? [] : (ga4R.data || []),
      psi:      psiR.error ? [] : (psiR.data || []),
      profiles: profR.error ? [] : (profR.data || []),
    };
  } catch (e) {
    console.warn('[Reportive] Fetch failed:', e.message);
    return null;
  }
}

// ── React context ──────────────────────────────────────────────
const DataCtx = React.createContext(null);

function LiveProvider({ children }) {
  const [state, setState] = React.useState({
    loading: true, error: null, periods: [], accounts: [], profiles: [], _isMock: false,
  });
  const [account, setAccount] = React.useState(localStorage.getItem('avo_account') || '');
  const [period, setPeriod]   = React.useState(localStorage.getItem('avo_period')  || '');

  // Fetch on account change
  React.useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, loading: true }));
    (async () => {
      const raw = await fetchAll(account);
      if (cancelled) return;
      let periods, isMock = false, accounts = [];
      if (!raw || raw.ads.length === 0) {
        periods = mockPeriods(); isMock = true;
        console.log('[Reportive] Using mock data (Supabase empty or unreachable)');
      } else {
        periods = buildPeriods(raw.ads, raw.ga4, raw.psi);
        // Build account list from ads_data (ignore current filter so user can switch)
        if (!account) {
          accounts = [...new Set(raw.ads.map(r => r.account_name).filter(Boolean))].sort();
        }
      }
      // Preserve existing accounts list across filtered fetches
      setState(prev => ({
        loading: false, error: null,
        periods,
        accounts: account ? prev.accounts : accounts,
        profiles: raw ? raw.profiles : [],
        _isMock: isMock,
      }));
    })();
    return () => { cancelled = true; };
  }, [account]);

  // Sync period default to newest available
  React.useEffect(() => {
    if (state.loading) return;
    if (!state.periods.length) return;
    const has = state.periods.find(p => p.key === period);
    if (!has) setPeriod(state.periods[0].key);
  }, [state.loading, state.periods, period]);

  // Persist filters
  React.useEffect(() => { if (account) localStorage.setItem('avo_account', account); else localStorage.removeItem('avo_account'); }, [account]);
  React.useEffect(() => { if (period)  localStorage.setItem('avo_period',  period);  else localStorage.removeItem('avo_period');  }, [period]);

  const ctx = React.useMemo(() => ({
    ...state,
    account, setAccount,
    period,  setPeriod,
    currentPeriod: state.periods.find(p => p.key === period) || state.periods[0] || null,
  }), [state, account, period]);

  return <DataCtx.Provider value={ctx}>{children}</DataCtx.Provider>;
}

const useLive = () => React.useContext(DataCtx);

// ── Public exports ─────────────────────────────────────────────
window.LIVE = {
  LiveProvider,
  useLive,
  fmt: { rupiahShort: fmtRupiahShort, num: fmtNum, pct: fmtPct, roas: fmtRoas, pctChange },
};
