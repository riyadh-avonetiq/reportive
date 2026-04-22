/**
 * Reportive by Avonetiq — Supabase Data Layer v3
 * Query dari satu tabel: ads_data
 */

const SUPA_URL = 'https://qmzgincouzpbyfxfddxt.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtemdpbmNvdXpwYnlmeGZkZHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTg3NTAsImV4cCI6MjA5MTYzNDc1MH0.cm0NcefIhlvim2dWSJOcTpVyajiYrqsX2uy-35PqMuY';

const _supa = window.supabase.createClient(SUPA_URL, SUPA_KEY);

/* ── Format helpers ─────────────────────────────────────────── */
const _rupiah = v => {
  if (v >= 1_000_000_000) return 'Rp ' + (v / 1_000_000_000).toFixed(1).replace('.', ',') + ' M';
  if (v >= 1_000_000)     return 'Rp ' + (v / 1_000_000).toFixed(1).replace('.', ',') + ' Jt';
  if (v >= 1_000)         return 'Rp ' + (v / 1_000).toFixed(1).replace('.', ',') + ' Rb';
  return 'Rp ' + Math.round(v).toLocaleString('id-ID');
};
const _num  = v => Math.round(v).toLocaleString('id-ID');
const _pct  = v => (v || 0).toFixed(2) + '%';
const _roas = v => (v || 0).toFixed(2) + 'x';
const _spark = (arr, n = 12) => {
  if (!arr || arr.length === 0) return Array(n).fill(0);
  if (arr.length <= n) return arr;
  const step = (arr.length - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => arr[Math.round(i * step)]);
};
const _chg = (cur, prev) => {
  if (prev == null || prev === 0) return { change: '—', dir: 'up' };
  const d = ((cur - prev) / Math.abs(prev)) * 100;
  return { change: (d >= 0 ? '▲ ' : '▼ ') + Math.abs(d).toFixed(1) + '%', dir: d >= 0 ? 'up' : 'down' };
};

/* ── Fetch & aggregate dari ads_data ────────────────────────── */
async function fetchSupabaseData() {
  try {
    const { data: rows, error } = await _supa
      .from('ads_data')
      .select('day, account_name, campaign_name, campaign_type, ad_group, keyword, match_type, spend, impressions, ctr, clicks, avg_cpc, conv_rate, conversions, cost_per_conversion')
      .order('day', { ascending: true });

    if (error || !rows || rows.length === 0) {
      console.log('[Reportive] Supabase kosong — pakai demo data');
      return null;
    }

    return buildPeriodData(rows);
  } catch (e) {
    console.warn('[Reportive] Fetch error:', e.message);
    return null;
  }
}

/* ── Aggregate rows → PERIOD_DATA ────────────────────────────── */
function buildPeriodData(rows) {
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Group by month
  const byMonth = {};
  rows.forEach(r => {
    const month = r.day.substring(0, 7); // 'yyyy-MM'
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(r);
  });

  // For each month, also group daily totals and campaign summaries
  const result = {};
  const months = Object.keys(byMonth).sort().reverse();

  months.forEach((month, idx) => {
    const monthRows = byMonth[month];
    const prevMonth = months[idx + 1];
    const prevRows  = prevMonth ? byMonth[prevMonth] : null;

    // ── Daily aggregates ──
    const dailyMap = {};
    monthRows.forEach(r => {
      if (!dailyMap[r.day]) dailyMap[r.day] = { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
      dailyMap[r.day].spend       += r.spend;
      dailyMap[r.day].impressions += r.impressions;
      dailyMap[r.day].clicks      += r.clicks;
      dailyMap[r.day].conversions += r.conversions;
    });
    const daily = Object.entries(dailyMap).sort(([a],[b]) => a.localeCompare(b)).map(([,v]) => v);

    // ── Month totals ──
    const tot = agg(monthRows);
    const pre = prevRows ? agg(prevRows) : null;

    // ── Campaign breakdown (top 6 by spend) ──
    const campMap = {};
    monthRows.forEach(r => {
      const k = r.campaign_id || r.campaign_name || 'unknown';
      if (!campMap[k]) campMap[k] = {
        name: r.campaign_name || k, type: r.campaign_type || '',
        spend: 0, impressions: 0, clicks: 0, conversions: 0,
      };
      campMap[k].spend       += r.spend;
      campMap[k].impressions += r.impressions;
      campMap[k].clicks      += r.clicks;
      campMap[k].conversions += r.conversions;
    });
    const camps = Object.values(campMap)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 6)
      .map(c => {
        const ctr = c.impressions > 0 ? c.clicks / c.impressions * 100 : 0;
        const cpc = c.clicks > 0 ? c.spend / c.clicks : 0;
        const cvr = c.clicks > 0 ? c.conversions / c.clicks * 100 : 0;
        const cpa = c.conversions > 0 ? c.spend / c.conversions : 0;
        return [
          _num(c.impressions),
          _num(c.clicks),
          _pct(ctr),
          _rupiah(c.spend),
          _rupiah(cpc),
          _pct(cvr),
          _num(c.conversions),
          _rupiah(cpa),
        ];
      });

    // ── Trend sparklines ──
    const tSpend = daily.map(d => d.spend);
    const tClick = daily.map(d => d.clicks);
    const tImpr  = daily.map(d => d.impressions);
    const tConv  = daily.map(d => d.conversions);
    const tCtr   = daily.map(d => d.impressions > 0 ? d.clicks / d.impressions * 100 : 0);
    const tCvr   = daily.map(d => d.clicks > 0 ? d.conversions / d.clicks * 100 : 0);

    // ── Period key & label ──
    const [year, monthNum] = month.split('-').map(Number);
    const mName    = monthNames[monthNum - 1];
    const daysInM  = new Date(year, monthNum, 0).getDate();
    const periodKey = `${mName.toLowerCase()}-${year}`;
    const label     = `1 ${mName} – ${daysInM} ${mName} ${year}`;

    result[periodKey] = {
      label,
      comparison: prevMonth
        ? `vs ${monthNames[parseInt(prevMonth.split('-')[1]) - 1]} ${prevMonth.split('-')[0]}`
        : '',
      bannerDate:    label,
      _fromSupabase: true,

      metrics: {
        // Overview
        'ov-spend':    { raw: tot.spend,       display: _rupiah(tot.spend),      ..._chg(tot.spend, pre?.spend),       spark: _spark(tSpend) },
        'ov-traffic':  { raw: tot.clicks,      display: _num(tot.clicks),        ..._chg(tot.clicks, pre?.clicks),     spark: _spark(tClick) },
        'ov-sessions': { raw: tot.impressions, display: _num(tot.impressions),   ..._chg(tot.impressions, pre?.impressions), spark: _spark(tImpr) },
        'ov-conv':     { raw: tot.conversions, display: _num(tot.conversions),   ..._chg(tot.conversions, pre?.conversions), spark: _spark(tConv) },
        // Ads
        'ads-spend':   { raw: tot.spend,       display: _rupiah(tot.spend),      ..._chg(tot.spend, pre?.spend),       spark: _spark(tSpend) },
        'ads-clicks':  { raw: tot.clicks,      display: _num(tot.clicks),        ..._chg(tot.clicks, pre?.clicks),     spark: _spark(tClick) },
        'ads-ctr':     { raw: tot.ctr,         display: _pct(tot.ctr),           ..._chg(tot.ctr, pre?.ctr),           spark: _spark(tCtr)   },
        'ads-roas':    { raw: tot.roas,        display: _roas(tot.roas),         ..._chg(tot.roas, pre?.roas),         spark: _spark(tCvr)   },
        // SEO — belum ada sumber data
        'seo-sess':    { raw: 0, display: '—', change: '—', dir: 'up', spark: [0,0,0,0] },
        'seo-impr':    { raw: 0, display: '—', change: '—', dir: 'up', spark: [0,0,0,0] },
        'seo-pos':     { raw: 0, display: '—', change: '—', dir: 'up', spark: [0,0,0,0] },
        'seo-ctr':     { raw: 0, display: '—', change: '—', dir: 'up', spark: [0,0,0,0] },
        // Website — belum ada sumber data
        'web-sess':    { raw: 0, display: '—', change: '—', dir: 'up', spark: [0,0,0,0] },
        'web-users':   { raw: 0, display: '—', change: '—', dir: 'up', spark: [0,0,0,0] },
        'web-bounce':  { raw: 0, display: '—', change: '—', dir: 'up', spark: [0,0,0,0] },
        'web-dur':     { raw: 0, display: '—', change: '—', dir: 'up', spark: [0,0,0,0] },
      },

      charts: {
        'overview-trend': { sessions: tImpr, spend: tSpend },
        'ads-trend': {
          spend:   tSpend.map(v => v / 1_000_000),
          revenue: daily.map(d => (d.conversions * (tot.spend > 0 ? tot.conv_value / tot.conversions : 0)) / 1_000_000),
        },
        'seo-trend':    { sessions: [0], impressions: [0] },
        'ads-platform': { google: _spark(tSpend.map(v => v / 1_000_000)), meta: [] },
      },

      extras: {
        channelDonut:    [100, 0, 0, 0, 0],
        channelCenter:   { value: _num(tot.clicks), label: 'Clicks' },
        channelBars:     [100, 0, 0, 0, 0],
        webDevice:       [60, 34, 6],
        webDeviceCenter: { value: '60%', label: 'Mobile' },
        seoRanking:      [0, 0, 0, 0, 0],
        channelSummary: [
          { value: _rupiah(tot.spend), change: _chg(tot.spend, pre?.spend).change + ' · CTR ' + _pct(tot.ctr), dir: _chg(tot.spend, pre?.spend).dir },
          { value: '—', change: '—', dir: 'up' },
          { value: '—', change: '—', dir: 'up' },
          { value: '—', change: '—', dir: 'up' },
        ],
        adsTable: camps.length > 0 ? camps : [['—','—','—','—','—','—','—','—']],
        seoTable: [['—','—','—','—','green','—']],
      },
    };
  });

  return Object.keys(result).length > 0 ? result : null;
}

/* ── Aggregate helper ────────────────────────────────────────── */
function agg(rows) {
  const t = { spend: 0, impressions: 0, clicks: 0, conversions: 0, conv_value: 0 };
  rows.forEach(r => {
    t.spend       += r.spend;
    t.impressions += r.impressions;
    t.clicks      += r.clicks;
    t.conversions += r.conversions;
    // conv_value tidak ada di tabel — estimasi dari cost_per_conversion
    t.conv_value  += r.cost_per_conversion > 0 ? r.conversions * r.cost_per_conversion : 0;
  });
  t.ctr  = t.impressions > 0 ? t.clicks / t.impressions * 100 : 0;
  t.cvr  = t.clicks > 0 ? t.conversions / t.clicks * 100 : 0;
  t.cpc  = t.clicks > 0 ? t.spend / t.clicks : 0;
  t.cpa  = t.conversions > 0 ? t.spend / t.conversions : 0;
  t.roas = t.spend > 0 ? t.conv_value / t.spend : 0;
  return t;
}

/* ── Inject ke PERIOD_DATA & refresh UI ─────────────────────── */
async function initSupabaseData() {
  const liveData = await fetchSupabaseData();
  if (!liveData) return;

  Object.assign(PERIOD_DATA, liveData);

  const latestPeriod = Object.keys(liveData)[0];

  // Update dropdown
  const sel = document.getElementById('period-select');
  if (sel) {
    const existing = Array.from(sel.options).map(o => o.value);
    Object.entries(liveData).forEach(([key, pd]) => {
      if (!existing.includes(key)) {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = pd.label;
        sel.insertBefore(opt, sel.firstChild);
      }
    });
    sel.value = latestPeriod;
  }

  if (typeof applyPeriod === 'function') {
    currentPeriod = latestPeriod;
    applyPeriod(latestPeriod);
  }

  console.log('[Reportive] Live data loaded:', Object.keys(liveData).join(', '));
}

window.addEventListener('load', () => setTimeout(initSupabaseData, 300));
