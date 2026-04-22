/* ============================================================
   AVONETIQ REPORTING — Main JS
   Navigation · Sparklines · PSI Rings · Date Range · Charts
   ============================================================ */

/* ── Brand Colors ─────────────────────────────────────────────── */
const COLORS = {
  navy:      '#0C182C',
  teal:      '#00E5D8',  // brighter cyan for sessions chart
  yellow:    '#F8B400',
  orange:    '#D5650F',
  darkGreen: '#02605C',
  green:     '#16A34A',
  red:       '#DC2626',
  gray:      '#E4E8F0',
  text:      '#6B7280',
};

/* ── Supabase Connection ────────────────────────────────────────── */
const SUPABASE = (() => {
  const _cfg = {
    url: localStorage.getItem('avo_supa_url') || '',
    key: localStorage.getItem('avo_supa_key') || '',
  };
  return {
    get url() { return _cfg.url; },
    get key() { return _cfg.key; },
    isReady() { return !!_cfg.url && !!_cfg.key; },
    configure(url, key) {
      _cfg.url = url.replace(/\/$/, '');
      _cfg.key = key;
      localStorage.setItem('avo_supa_url', _cfg.url);
      localStorage.setItem('avo_supa_key', _cfg.key);
    },
    async query(table, columns) {
      if (!this.isReady()) return null;
      try {
        const select = columns.join(',');
        const url    = `${_cfg.url}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=500`;
        const res    = await fetch(url, {
          headers: {
            'apikey':        _cfg.key,
            'Authorization': `Bearer ${_cfg.key}`,
            'Content-Type':  'application/json',
          }
        });
        if (!res.ok) { console.warn('[Supabase]', res.status, await res.text()); return null; }
        return res.json();
      } catch(e) { console.warn('[Supabase] fetch error:', e); return null; }
    }
  };
})();

/* ── Admin Gate ────────────────────────────────────────────────── */
const isAdmin = sessionStorage.getItem('avo_role') === 'admin';
document.addEventListener('DOMContentLoaded', () => {
  const btnEdit = document.getElementById('btn-edit-mode');
  if (btnEdit) btnEdit.style.display = isAdmin ? '' : 'none';
});

/* ── Currency Formatter ────────────────────────────────────────── */
const rupiah = v => 'Rp\u00A0' + Math.round(v).toLocaleString('id-ID');

/* ── Chart.js Defaults (dark theme) ────────────────────────────── */
Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
Chart.defaults.font.size   = 12;
Chart.defaults.color       = '#64748B';
Chart.defaults.borderColor = 'rgba(51,71,102,0.08)';
Chart.defaults.plugins.legend.display = false;
Chart.defaults.elements.point.radius = 0;
Chart.defaults.elements.point.hoverRadius = 5;
Chart.defaults.elements.point.hitRadius = 20;

/* ── Custom Tooltip Positioner ────────────────────────────────── */
Chart.Tooltip.positioners.avoidLine = function(elements, eventPosition) {
  const pos = Chart.Tooltip.positioners.nearest(elements, eventPosition);
  if (!pos) return false;
  pos.y = pos.y - 16;
  if (pos.y < 20) { pos.y = elements[0].element.y + 16; }
  return pos;
};

/* ── Donut Center Label Plugin ─────────────────────────────────── */
const centerLabelPlugin = {
  id: 'centerLabel',
  afterDraw(chart) {
    const opts = chart.config.options?.plugins?.centerLabel;
    if (!opts) return;
    const { ctx, chartArea } = chart;
    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top  + chartArea.bottom) / 2;
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 17px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText(opts.value, cx, cy - 9);
    ctx.font = `400 10.5px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText(opts.label, cx, cy + 9);
    ctx.restore();
  },
};
Chart.register(centerLabelPlugin);

/* ── Draw-from-Left Animation Plugin (clip disabled — uses Chart.js built-in animation) */
const drawFromLeftPlugin = { id: 'drawFromLeft' };
Chart.register(drawFromLeftPlugin);



/* ── Chart Event Annotation Plugin ────────────────────────────── */
const chartAnnotationsPlugin = {
  id: 'chartAnnotations',
  afterDatasetsDraw(chart) {
    const anns = chart.options.plugins?.chartAnnotations;
    if (!anns || !anns.length) return;
    const { ctx, chartArea, scales } = chart;
    if (!scales.x) return;
    anns.forEach(ann => {
      if (ann.idx >= (chart.data.labels?.length || 0)) return;
      const x = scales.x.getPixelForValue(ann.idx);
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([4,3]);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.5;
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "500 9px 'Plus Jakarta Sans', sans-serif";
      const tw = ctx.measureText(ann.label).width;
      const pw = tw + 10, ph = 14, px = x - pw/2, py = chartArea.top + 4, r = 3;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(px+r,py); ctx.lineTo(px+pw-r,py); ctx.quadraticCurveTo(px+pw,py,px+pw,py+r);
      ctx.lineTo(px+pw,py+ph-r); ctx.quadraticCurveTo(px+pw,py+ph,px+pw-r,py+ph);
      ctx.lineTo(px+r,py+ph); ctx.quadraticCurveTo(px,py+ph,px,py+ph-r);
      ctx.lineTo(px,py+r); ctx.quadraticCurveTo(px,py,px+r,py); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ann.label, x, py + ph/2);
      ctx.restore();
    });
  }
};
Chart.register(chartAnnotationsPlugin);

/* ── Left-to-right animation options ──────────────────────────── */
const ltrAnimation = {
  duration: 1200,
  easing: 'easeInOutQuart',
  onProgress(anim) {
    // Only drive the clip during the initial entrance animation.
    // Tooltip hover triggers chart.update() too — guard against replaying.
    if (anim.chart._initialAnimDone) return;
    anim.chart._drawProgress = anim.currentStep / anim.numSteps;
  },
  onComplete(anim)  {
    anim.chart._drawProgress = 1;
    anim.chart._initialAnimDone = true; // lock — prevents hover from re-triggering
  },
};

/* ── Custom Tooltip ────────────────────────────────────────────── */
function externalTooltipHandler(context) {
  const { chart, tooltip } = context;
  const wrap = chart.canvas.parentNode;
  let el = wrap.querySelector('.avo-tooltip');
  if (tooltip.opacity === 0) { if (el) el.style.opacity = '0'; return; }
  if (!el) {
    el = document.createElement('div');
    el.className = 'avo-tooltip';
    wrap.style.position = 'relative';
    wrap.appendChild(el);
  }
  const title = tooltip.title?.[0] ?? '';
  const rows = tooltip.dataPoints.map(dp => {
    const ds  = dp.dataset;
    const bg  = Array.isArray(ds.backgroundColor) ? ds.backgroundColor[dp.dataIndex] : ds.backgroundColor;
    const clr = ds.type === 'bar'
      ? (typeof bg === 'string' ? bg.slice(0, 7) : COLORS.text)
      : (typeof ds.borderColor === 'string' ? ds.borderColor : COLORS.text);
    return `<div class="avo-tip-row"><span class="avo-tip-swatch" style="background:${clr}"></span><span class="avo-tip-label">${ds.label}</span><span class="avo-tip-val">${dp.formattedValue}</span></div>`;
  }).join('');
  el.innerHTML = `<div class="avo-tip-title">${title}</div>${rows}`;
  el.style.opacity = '1';
  el.style.left = tooltip.caretX + 'px';
  el.style.top  = tooltip.caretY + 'px';
}

/* ── Helpers ───────────────────────────────────────────────────── */
function months(n = 6) { return ['Oct','Nov','Dec','Jan','Feb','Mar'].slice(-n); }
function days(n = 31)  { return Array.from({ length: n }, (_, i) => i + 1); }
function hexToRgb(hex) {
  return `rgb(${parseInt(hex.slice(1,3),16)}, ${parseInt(hex.slice(3,5),16)}, ${parseInt(hex.slice(5,7),16)})`;
}
function areaGradient(ctx, hex, alpha = 0.15) {
  const g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height || 220);
  const rgb = hexToRgb(hex).replace('rgb','rgba').replace(')','');
  g.addColorStop(0, `${rgb}, ${alpha})`);
  g.addColorStop(1, `${rgb}, 0)`);
  return g;
}
const heroLine = { tension: 0.4, fill: true, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 5 };
const suppLine = { tension: 0.4, fill: true, borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4 };
/* ── Part 5: Liquid Glass Tooltip ─────────────────────────────── */
function createLiquidTooltip(context) {
  let el = document.getElementById('liquid-tooltip');
  if (!el) {
    el = document.createElement('div');
    el.id = 'liquid-tooltip';
    document.body.appendChild(el);
  }

  Object.assign(el.style, {
    position: 'fixed',
    pointerEvents: 'none',
    background: 'rgba(255,255,255,0.60)',
    backdropFilter: 'blur(28px) saturate(150%)',
    webkitBackdropFilter: 'blur(28px) saturate(150%)',
    border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: '16px',
    padding: '12px 16px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '13px',
    color: '#0f172a',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.45)',
    transition: 'opacity 200ms cubic-bezier(0.22,1,0.36,1), transform 200ms cubic-bezier(0.22,1,0.36,1)',
    zIndex: '9999',
    maxWidth: '240px'
  });

  const tt = context.tooltip;
  if (tt.opacity === 0) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(4px) scale(0.98)';
    return;
  }

  let html = '';
  if (tt.title?.length) {
    html += `<div style="font-weight:700;font-size:11px;color:#475569;margin-bottom:8px">${tt.title[0]}</div>`;
  }
  tt.body?.forEach((item, i) => {
    const c = tt.labelColors?.[i];
    const bg = c?.borderColor || c?.backgroundColor || '#888';
    html += `<div style="display:flex;align-items:center;gap:8px;margin-top:4px">
      <span style="width:8px;height:8px;border-radius:50%;background:${bg};flex-shrink:0;box-shadow:0 0 6px ${bg}40"></span>
      <span style="color:#1e293b;font-weight:500">${item.lines[0]}</span>
    </div>`;
  });
  el.innerHTML = html;

  const r = context.chart.canvas.getBoundingClientRect();
  el.style.opacity = '1';
  el.style.transform = 'translateY(0) scale(1)';
  el.style.left = Math.min(r.left + tt.caretX, window.innerWidth - 260) + 'px';
  const topPos = r.top + tt.caretY - el.offsetHeight - 16;
  el.style.top = (topPos < 8 ? r.top + tt.caretY + 16 : topPos) + 'px';
}

const tooltipConfig = {
  enabled: false,
  external: createLiquidTooltip,
  callbacks: {
    title: (items) => items[0]?.label || '',
    label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y?.toLocaleString('id-ID') ?? ctx.formattedValue}`
  }
};

/* ── Part 4D: liquidReveal replaced by CSS clip-path animation ── */
// (rAF-based clip plugin removed — CSS handles entrance on canvas elements)
const liquidRevealPlugin = { id: 'liquidReveal' };
Chart.register(liquidRevealPlugin);

const sharedScales = {
  x: {
    grid: { display: false },
    border: { display: false },
    ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '500' }, color: '#ffffff', padding: 8 }
  },
  y: {
    grid: { color: 'rgba(255,255,255,0.04)', lineWidth: 1 },
    border: { display: false },
    ticks: { font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: '500' }, color: '#ffffff', padding: 12 }
  }
};

const sharedOpts = {
  responsive: true, maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  animation: { duration: 900, easing: 'easeOutQuart' },
  plugins: { legend: { display: false }, tooltip: tooltipConfig },
};

/* ── Chart Legend Renderer ─────────────────────────────────────── */
function renderLegend(id, datasets) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = datasets.map(ds => {
    const isBar = ds.type === 'bar';
    const color = isBar
      ? (typeof ds.backgroundColor === 'string' ? ds.backgroundColor.slice(0,7) : COLORS.text)
      : (typeof ds.borderColor === 'string' ? ds.borderColor : COLORS.text);
    const shape = isBar
      ? `<span class="legend-line" style="background:${color};border-radius:2px"></span>`
      : `<span class="legend-dot"  style="background:${color}"></span>`;
    return `<div class="legend-item">${shape}<span>${ds.label}</span></div>`;
  }).join('');
}

/* ── Sparkline Renderer ────────────────────────────────────────── */
function renderSparklines(container) {
  const root = container || document;
  root.querySelectorAll('.metric-sparkline[data-values]').forEach((el, idx) => {
    const values = el.dataset.values.split(',').map(Number);
    const prevRaw = el.dataset.prevValues;
    const prev    = prevRaw ? prevRaw.split(',').map(Number) : null;
    const color   = el.dataset.color  || '#00C2B8';
    const invert  = el.dataset.invert === 'true';
    const gid  = `spk${idx}_${Date.now()}`;
    const W = 100, H = 32;

    // Scale to combined range so ghost + current share same Y axis
    const allVals = prev ? [...values, ...prev] : values;
    const mn = Math.min(...allVals), mx = Math.max(...allVals), rng = mx - mn || 1;
    const toY = v => +(H - ((invert ? (mx-v) : (v-mn)) / rng) * (H-6) - 3).toFixed(2);

    const pts  = values.map((v,i) => `${+((i/(values.length-1))*W).toFixed(2)},${toY(v)}`);
    const area = `M${pts[0]} ${pts.slice(1).map(p=>'L'+p).join(' ')} L${W},${H} L0,${H}Z`;

    // Ghost polyline for previous period
    let ghostSvg = '';
    if (prev && prev.length > 1) {
      const gpts = prev.map((v,i) => `${+((i/(prev.length-1))*W).toFixed(2)},${toY(v)}`);
      ghostSvg = `<polyline points="${gpts.join(' ')}" fill="none" stroke="rgba(180,180,200,0.35)" stroke-width="1" stroke-dasharray="3 2" stroke-linecap="round" stroke-linejoin="round"/>`;
    }

    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
      <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient></defs>
      ${ghostSvg}
      <path d="${area}" fill="url(#${gid})"/>
      <polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  });
}

/* ── PSI Rings Renderer ────────────────────────────────────────── */
function renderPsiRings() {
  const container = document.getElementById('psi-rings');
  if (!container) return;
  const metrics = [
    { name: 'Performance',    score: 92 },
    { name: 'Accessibility',  score: 88 },
    { name: 'Best Practices', score: 74 },
    { name: 'SEO',            score: 91 },
  ];
  const psiColor = s => s >= 90 ? COLORS.green : s >= 50 ? COLORS.orange : COLORS.red;
  container.innerHTML = metrics.map(m => {
    const r = 28, cx = 34, cy = 34;
    const circ = 2 * Math.PI * r;
    const dash = ((m.score / 100) * circ).toFixed(2);
    const gap  = (circ - parseFloat(dash)).toFixed(2);
    const col  = psiColor(m.score);
    return `<div class="psi-item">
      <div class="psi-ring">
        <svg width="68" height="68" viewBox="0 0 68 68">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${COLORS.gray}" stroke-width="6"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="6"
            stroke-dasharray="${dash} ${gap}" stroke-linecap="round"/>
        </svg>
        <div class="psi-ring-label"><span class="psi-score" style="color:${col}">${m.score}</span></div>
      </div>
      <div class="psi-name">${m.name}</div>
    </div>`;
  }).join('');
}

/* ── Animate Metric Value — single shared RAF loop for all 16 metrics ── */
const _animQueue = new Map();   // el → { fromRaw, toRaw, formatter, duration, start }
let   _animRafId = 0;
const _easeOut   = t => 1 - Math.pow(1 - t, 3);

function _animStep(now) {
  let alive = false;
  _animQueue.forEach((a, el) => {
    const p = Math.min((now - a.start) / a.duration, 1);
    el.textContent = a.formatter(a.fromRaw + (a.toRaw - a.fromRaw) * _easeOut(p));
    if (p >= 1) _animQueue.delete(el); else alive = true;
  });
  _animRafId = alive ? requestAnimationFrame(_animStep) : 0;
}

function animateValue(el, fromRaw, toRaw, formatter, duration = 550) {
  _animQueue.set(el, { fromRaw, toRaw, formatter, duration, start: performance.now() });
  if (!_animRafId) _animRafId = requestAnimationFrame(_animStep);
}

/* ══════════════════════════════════════════════════════════════
   PERIOD DATA — dummy data for 5 periods
   ══════════════════════════════════════════════════════════════ */
const PERIOD_DATA = {
  'mar-2025': {
    label: '1 Mar – 31 Mar 2025',
    comparison: 'vs Feb 2025',
    bannerDate: '1 Mar – 31 Mar 2025',
    metrics: {
      // Overview
      'ov-spend':    { raw: 48500000,  display: 'Rp 48,5 Jt',  change: '▲ 12.4%', dir: 'up',   spark: [38,42,39,45,44,47,50,48,52,49,53,55] },
      'ov-traffic':  { raw: 24830,     display: '24.830',       change: '▲ 8.1%',  dir: 'up',   spark: [18,20,19,22,21,23,22,24,23,24,25,25] },
      'ov-sessions': { raw: 61240,     display: '61.240',       change: '▲ 5.3%',  dir: 'up',   spark: [52,55,54,57,56,58,57,60,59,61,62,61] },
      'ov-conv':     { raw: 1342,      display: '1.342',        change: '▲ 19.7%', dir: 'up',   spark: [800,880,920,1010,1050,1100,1120,1180,1220,1280,1310,1342] },
      // Ads
      'ads-spend':   { raw: 44000000,  display: 'Rp 44 Jt',    change: '▲ 12.4%', dir: 'up',   spark: [32,35,34,37,36,38,38,40,39,41,43,44] },
      'ads-clicks':  { raw: 38420,     display: '38.420',       change: '▲ 7.2%',  dir: 'up',   spark: [30,32,31,33,34,35,35,36,37,37,38,38] },
      'ads-ctr':     { raw: 4.32,      display: '4.32%',        change: '▲ 0.4pp', dir: 'up',   spark: [3.6,3.7,3.8,3.9,3.9,4.0,4.1,4.1,4.2,4.2,4.3,4.3] },
      'ads-roas':    { raw: 3.42,      display: '3.42x',        change: '▲ 0.3x',  dir: 'up',   spark: [2.8,2.9,3.0,3.0,3.1,3.1,3.2,3.2,3.3,3.3,3.4,3.4] },
      // SEO
      'seo-sess':    { raw: 24830,     display: '24.830',       change: '▲ 8.1%',  dir: 'up',   spark: [18400,19200,20100,21400,22200,22960,23400,24100,23800,24200,24600,24830] },
      'seo-impr':    { raw: 318400,    display: '318.400',      change: '▲ 11.3%', dir: 'up',   spark: [220,234,248,261,271,280,289,296,302,310,314,318] },
      'seo-pos':     { raw: 6.4,       display: '6.4',          change: '▲ 1.2 pts',dir:'up',   spark: [8.2,8.0,7.8,7.6,7.4,7.2,7.0,6.8,6.7,6.5,6.4,6.4], invert: true },
      'seo-ctr':     { raw: 7.80,      display: '7.80%',        change: '▲ 0.6pp', dir: 'up',   spark: [6.4,6.6,6.8,7.0,7.1,7.2,7.3,7.4,7.5,7.6,7.7,7.8] },
      // Website
      'web-sess':    { raw: 61240,     display: '61.240',       change: '▲ 5.3%',  dir: 'up',   spark: [52,55,54,57,56,58,57,60,59,61,62,61] },
      'web-users':   { raw: 44810,     display: '44.810',       change: '▲ 4.8%',  dir: 'up',   spark: [38,40,39,42,41,43,42,44,43,45,44,45] },
      'web-bounce':  { raw: 56.2,      display: '56.2%',        change: '▼ 3.1pp', dir: 'up',   spark: [62,61,60,59,59,58,58,57,57,57,56,56], invert: true },
      'web-dur':     { raw: 168,       display: '2m 48s',       change: '▲ 0m 12s',dir: 'up',   spark: [148,152,150,155,156,158,160,162,163,165,166,168] },
    },
    charts: {
      'overview-trend': {
        sessions: [38200,41800,44100,47300,52100,56400,58900,60200,61240,55800,57200,59400,60800,62100,63500,58900,57400,59800,61200,63400,64800,60200,61800,63200,64600,66100,65400,63800,62200,61400,62800],
        spend:    [1200000,1350000,1180000,1420000,1580000,1640000,1520000,1490000,1610000,1430000,1560000,1480000,1620000,1540000,1680000,1450000,1520000,1590000,1640000,1700000,1580000,1490000,1620000,1540000,1680000,1740000,1610000,1480000,1560000,1500000,1420000],
      },
      'ads-trend': {
        spend:   [1.2,1.35,1.18,1.42,1.58,1.64,1.52,1.49,1.61,1.43,1.56,1.48,1.62,1.54,1.68,1.45,1.52,1.59,1.64,1.70,1.58,1.49,1.62,1.54,1.68,1.74,1.61,1.48,1.56,1.50,1.42],
        revenue: [4.1,4.8,4.3,5.2,5.6,5.9,5.4,5.3,5.8,5.0,5.5,5.2,5.8,5.4,6.1,5.1,5.4,5.7,5.9,6.2,5.7,5.3,5.8,5.4,6.0,6.3,5.8,5.2,5.6,5.3,5.0],
      },
      'seo-trend': {
        sessions:    [18400,19800,21200,22400,22960,24830],
        impressions: [220000,248000,271000,289000,302000,318400],
      },
      'ads-platform': {
        google: [18.2,20.1,22.4,24.8,26.1,28.2],
        meta:   [10.4,11.2,12.8,13.6,14.2,15.8],
      },
    },
    extras: {
      channelDonut: [45,30,14,7,4],
      channelCenter: { value:'61.2K', label:'Sessions' },
      channelBars:   [45,30,14,7,4],
      webDevice: [62,32,6],
      webDeviceCenter: { value:'62%', label:'Mobile' },
      seoRanking: [12,38,54,82,104],
      channelSummary: [
        { value:'Rp 28,2 Jt', change:'▲ 14.2% ROAS 3.8x', dir:'up' },
        { value:'Rp 15,8 Jt', change:'▲ 9.4% ROAS 2.9x',  dir:'up' },
        { value:'Pos. 6.4',   sub:'24.830 sessions',        change:'▲ 1.2 pos improvement', dir:'up' },
        { value:'56.2% BR',   sub:'61.240 sessions',        change:'▼ 3.1% bounce rate', dir:'down' },
      ],
      adsTable: [
        ['482.300','18.240','3.78%','Rp 16,4 Jt','Rp 899',  '412','4.1x'],
        ['321.850','12.640','3.93%','Rp 11,8 Jt','Rp 934',  '318','3.2x'],
        ['142.100', '4.820','3.39%','Rp 8,2 Jt', 'Rp 1.701','194','2.4x'],
        ['215.600', '7.410','3.44%','Rp 7,6 Jt', 'Rp 1.026','182','2.7x'],
      ],
      seoTable: [
        ['digital marketing agency jakarta','2.1','62.400','9.360','15.0%','green','▲ 0.8'],
        ['jasa iklan google ads',           '3.4','48.200','5.300','11.0%','green','▲ 1.2'],
        ['social media marketing',          '5.8','31.200','2.810', '9.0%','teal', '= 0.1'],
        ['seo consultant indonesia',        '7.2','24.600','1.970', '8.0%','green','▲ 2.4'],
        ['pemasaran digital umkm',          '9.1','19.400','1.360', '7.0%','red',  '▼ 0.5'],
      ],
    },
  },

  'feb-2025': {
    label: '1 Feb – 28 Feb 2025',
    comparison: 'vs Jan 2025',
    bannerDate: '1 Feb – 28 Feb 2025',
    metrics: {
      'ov-spend':    { raw: 43100000,  display: 'Rp 43,1 Jt',  change: '▲ 8.2%',  dir: 'up',   spark: [32,35,33,37,36,38,37,39,38,40,41,42] },
      'ov-traffic':  { raw: 22980,     display: '22.980',       change: '▲ 5.4%',  dir: 'up',   spark: [16,17,18,19,20,20,21,21,22,22,23,23] },
      'ov-sessions': { raw: 58170,     display: '58.170',       change: '▲ 3.8%',  dir: 'up',   spark: [48,50,51,52,53,54,55,55,56,56,57,58] },
      'ov-conv':     { raw: 1121,      display: '1.121',        change: '▲ 11.2%', dir: 'up',   spark: [680,720,760,820,860,900,940,980,1020,1060,1090,1121] },
      'ads-spend':   { raw: 39100000,  display: 'Rp 39,1 Jt',  change: '▲ 8.2%',  dir: 'up',   spark: [28,30,29,31,30,32,32,33,34,34,35,36] },
      'ads-clicks':  { raw: 35840,     display: '35.840',       change: '▲ 4.6%',  dir: 'up',   spark: [28,29,29,30,30,31,32,33,33,34,34,35] },
      'ads-ctr':     { raw: 3.92,      display: '3.92%',        change: '▲ 0.3pp', dir: 'up',   spark: [3.4,3.5,3.6,3.6,3.7,3.7,3.8,3.8,3.9,3.9,3.9,3.9] },
      'ads-roas':    { raw: 3.12,      display: '3.12x',        change: '▲ 0.2x',  dir: 'up',   spark: [2.6,2.7,2.8,2.8,2.9,2.9,3.0,3.0,3.0,3.1,3.1,3.1] },
      'seo-sess':    { raw: 22960,     display: '22.960',       change: '▲ 5.4%',  dir: 'up',   spark: [16200,17100,17800,18500,19200,19800,20400,21000,21400,21800,22400,22960] },
      'seo-impr':    { raw: 285900,    display: '285.900',      change: '▲ 9.1%',  dir: 'up',   spark: [192,200,210,222,232,242,250,260,266,272,279,286] },
      'seo-pos':     { raw: 7.6,       display: '7.6',          change: '▲ 0.8 pts',dir:'up',   spark: [9.0,8.9,8.8,8.6,8.4,8.2,8.0,7.9,7.8,7.7,7.6,7.6], invert: true },
      'seo-ctr':     { raw: 7.20,      display: '7.20%',        change: '▲ 0.4pp', dir: 'up',   spark: [6.0,6.1,6.3,6.5,6.6,6.7,6.8,6.9,7.0,7.0,7.1,7.2] },
      'web-sess':    { raw: 58170,     display: '58.170',       change: '▲ 3.8%',  dir: 'up',   spark: [48,50,51,52,53,54,55,55,56,56,57,58] },
      'web-users':   { raw: 42760,     display: '42.760',       change: '▲ 3.2%',  dir: 'up',   spark: [36,37,38,39,40,40,41,41,42,42,42,43] },
      'web-bounce':  { raw: 59.3,      display: '59.3%',        change: '▼ 2.1pp', dir: 'up',   spark: [64,63,63,62,62,61,61,61,60,60,59,59], invert: true },
      'web-dur':     { raw: 156,       display: '2m 36s',       change: '▲ 0m 8s', dir: 'up',   spark: [136,140,142,145,147,149,150,152,152,154,155,156] },
    },
    charts: {
      'overview-trend': {
        sessions: [35800,37400,39100,41200,43800,46200,47600,49100,50400,48800,50100,51600,52900,54200,55600,52100,50900,52400,53800,55200,56400,52800,54100,55500,56900,58400,57600,56200,54800,53900,55100],
        spend:    [1060000,1180000,1050000,1240000,1380000,1440000,1320000,1290000,1410000,1260000,1360000,1290000,1420000,1350000,1470000,1260000,1330000,1380000,1430000,1480000,1380000,1300000,1420000,1340000,1470000,1520000,1410000,1290000,1360000,1300000],
        spend28: true,
      },
      'ads-trend': {
        spend:   [1.06,1.18,1.05,1.24,1.38,1.44,1.32,1.29,1.41,1.26,1.36,1.29,1.42,1.35,1.47,1.26,1.33,1.38,1.43,1.48,1.38,1.30,1.42,1.34,1.47,1.52,1.41,1.29],
        revenue: [3.6,4.1,3.8,4.5,4.9,5.1,4.7,4.6,5.0,4.4,4.8,4.5,5.0,4.7,5.3,4.4,4.7,4.9,5.1,5.3,4.9,4.6,5.0,4.7,5.2,5.5,5.0,4.6],
      },
      'seo-trend': {
        sessions:    [16200,17400,18600,19800,20600,22960],
        impressions: [192000,210000,232000,250000,266000,285900],
      },
      'ads-platform': {
        google: [16.0,17.8,19.8,21.8,23.2,25.0],
        meta:   [9.2,9.9,11.2,12.1,12.6,14.1],
      },
    },
    extras: {
      channelDonut: [43,31,14,8,4],
      channelCenter: { value:'58.2K', label:'Sessions' },
      channelBars:   [43,31,14,8,4],
      webDevice: [63,31,6],
      webDeviceCenter: { value:'63%', label:'Mobile' },
      seoRanking: [9,34,50,80,108],
      channelSummary: [
        { value:'Rp 25,1 Jt', change:'▲ 8.2% ROAS 3.5x', dir:'up' },
        { value:'Rp 14,0 Jt', change:'▲ 6.1% ROAS 2.7x',  dir:'up' },
        { value:'Pos. 7.6',   sub:'22.960 sessions',        change:'▲ 0.8 pos improvement', dir:'up' },
        { value:'59.3% BR',   sub:'58.170 sessions',        change:'▼ 2.1% bounce rate', dir:'down' },
      ],
      adsTable: [
        ['440.200','16.480','3.74%','Rp 14,8 Jt','Rp 898',  '376','3.8x'],
        ['294.100','11.420','3.88%','Rp 10,6 Jt','Rp 929',  '284','3.0x'],
        ['130.400', '4.280','3.28%','Rp 7,4 Jt', 'Rp 1.729','172','2.2x'],
        ['196.800', '6.740','3.42%','Rp 6,9 Jt', 'Rp 1.024','164','2.5x'],
      ],
      seoTable: [
        ['digital marketing agency jakarta','2.9','58.100','8.420','14.5%','green','▲ 0.6'],
        ['jasa iklan google ads',           '4.6','44.200','4.860','11.0%','teal', '= 0.2'],
        ['social media marketing',          '5.9','29.400','2.590', '8.8%','green','▲ 1.0'],
        ['seo consultant indonesia',        '9.6','22.800','1.780', '7.8%','green','▲ 1.8'],
        ['pemasaran digital umkm',          '9.6','17.800','1.230', '6.9%','teal', '= 0.1'],
      ],
    },
  },

  'jan-2025': {
    label: '1 Jan – 31 Jan 2025',
    comparison: 'vs Dec 2024',
    bannerDate: '1 Jan – 31 Jan 2025',
    metrics: {
      'ov-spend':    { raw: 39800000,  display: 'Rp 39,8 Jt',  change: '▲ 6.1%',  dir: 'up',   spark: [28,30,29,31,30,32,31,33,32,34,35,36] },
      'ov-traffic':  { raw: 21780,     display: '21.780',       change: '▲ 4.2%',  dir: 'up',   spark: [15,16,16,17,18,18,19,19,20,20,21,21] },
      'ov-sessions': { raw: 56040,     display: '56.040',       change: '▲ 2.6%',  dir: 'up',   spark: [46,47,48,49,50,51,52,52,53,54,54,55] },
      'ov-conv':     { raw: 1008,      display: '1.008',        change: '▲ 7.4%',  dir: 'up',   spark: [580,620,660,710,740,780,820,860,900,940,970,1008] },
      'ads-spend':   { raw: 36200000,  display: 'Rp 36,2 Jt',  change: '▲ 6.1%',  dir: 'up',   spark: [24,26,25,27,26,28,27,29,28,30,31,32] },
      'ads-clicks':  { raw: 34240,     display: '34.240',       change: '▲ 3.2%',  dir: 'up',   spark: [26,27,27,28,29,30,30,31,31,32,33,33] },
      'ads-ctr':     { raw: 3.62,      display: '3.62%',        change: '▲ 0.2pp', dir: 'up',   spark: [3.2,3.3,3.4,3.4,3.5,3.5,3.6,3.6,3.6,3.6,3.6,3.6] },
      'ads-roas':    { raw: 2.92,      display: '2.92x',        change: '▲ 0.1x',  dir: 'up',   spark: [2.4,2.5,2.6,2.7,2.7,2.8,2.8,2.8,2.9,2.9,2.9,2.9] },
      'seo-sess':    { raw: 21780,     display: '21.780',       change: '▲ 4.2%',  dir: 'up',   spark: [14800,15600,16200,16900,17600,18200,18800,19400,19900,20400,21100,21780] },
      'seo-impr':    { raw: 262000,    display: '262.000',      change: '▲ 7.2%',  dir: 'up',   spark: [176,184,194,204,213,222,231,240,246,252,257,262] },
      'seo-pos':     { raw: 8.4,       display: '8.4',          change: '▲ 0.6 pts',dir:'up',   spark: [9.6,9.5,9.4,9.2,9.0,8.8,8.7,8.6,8.5,8.5,8.4,8.4], invert: true },
      'seo-ctr':     { raw: 6.80,      display: '6.80%',        change: '▲ 0.3pp', dir: 'up',   spark: [5.6,5.8,6.0,6.1,6.2,6.3,6.4,6.5,6.6,6.7,6.7,6.8] },
      'web-sess':    { raw: 56040,     display: '56.040',       change: '▲ 2.6%',  dir: 'up',   spark: [46,47,48,49,50,51,52,52,53,54,54,55] },
      'web-users':   { raw: 41420,     display: '41.420',       change: '▲ 2.1%',  dir: 'up',   spark: [35,36,36,37,38,38,39,40,40,40,41,41] },
      'web-bounce':  { raw: 61.4,      display: '61.4%',        change: '▼ 1.4pp', dir: 'up',   spark: [65,65,64,64,63,63,63,62,62,62,61,61], invert: true },
      'web-dur':     { raw: 148,       display: '2m 28s',       change: '▲ 0m 6s', dir: 'up',   spark: [128,132,134,137,139,141,142,144,144,146,147,148] },
    },
    charts: {
      'overview-trend': {
        sessions: [32400,34100,36200,38400,40900,43600,45100,46800,48200,46600,47900,49200,50600,51900,53200,49900,48700,50100,51500,52900,54100,50600,51900,53200,54600,55900,55100,53800,52400,51500,52800],
        spend:    [960000,1080000,950000,1140000,1280000,1340000,1220000,1190000,1310000,1160000,1260000,1190000,1320000,1250000,1360000,1160000,1230000,1280000,1330000,1380000,1280000,1200000,1320000,1240000,1370000,1420000,1310000,1190000,1260000,1200000,1120000],
      },
      'ads-trend': {
        spend:   [0.96,1.08,0.95,1.14,1.28,1.34,1.22,1.19,1.31,1.16,1.26,1.19,1.32,1.25,1.36,1.16,1.23,1.28,1.33,1.38,1.28,1.20,1.32,1.24,1.37,1.42,1.31,1.19,1.26,1.20,1.12],
        revenue: [3.1,3.6,3.3,3.9,4.3,4.5,4.1,4.0,4.4,3.8,4.2,3.9,4.4,4.1,4.6,3.8,4.1,4.3,4.5,4.6,4.3,4.0,4.4,4.1,4.6,4.8,4.4,4.0,4.3,4.0,3.7],
      },
      'seo-trend': {
        sessions:    [14800,16200,17800,19200,20400,21780],
        impressions: [176000,194000,213000,231000,246000,262000],
      },
      'ads-platform': {
        google: [14.4,16.1,17.9,19.8,21.2,22.8],
        meta:   [8.4,9.1,10.2,11.1,11.6,13.4],
      },
    },
    extras: {
      channelDonut: [41,31,15,9,4],
      channelCenter: { value:'56.0K', label:'Sessions' },
      channelBars:   [41,31,15,9,4],
      webDevice: [64,30,6],
      webDeviceCenter: { value:'64%', label:'Mobile' },
      seoRanking: [7,30,46,79,112],
      channelSummary: [
        { value:'Rp 23,2 Jt', change:'▲ 6.1% ROAS 3.2x', dir:'up' },
        { value:'Rp 13,0 Jt', change:'▲ 4.8% ROAS 2.5x',  dir:'up' },
        { value:'Pos. 8.4',   sub:'21.780 sessions',        change:'▲ 0.6 pos improvement', dir:'up' },
        { value:'61.4% BR',   sub:'56.040 sessions',        change:'▼ 1.4% bounce rate', dir:'down' },
      ],
      adsTable: [
        ['404.600','14.880','3.68%','Rp 13,6 Jt','Rp 913',  '348','3.5x'],
        ['270.200','10.280','3.80%','Rp 9,8 Jt', 'Rp 953',  '256','2.8x'],
        ['119.400', '3.820','3.20%','Rp 6,8 Jt', 'Rp 1.781','154','2.0x'],
        ['182.100', '6.120','3.36%','Rp 6,2 Jt', 'Rp 1.013','148','2.3x'],
      ],
      seoTable: [
        ['digital marketing agency jakarta','3.5','54.200','7.590','14.0%','green','▲ 0.4'],
        ['jasa iklan google ads',           '5.8','40.600','4.260','10.5%','green','▲ 0.8'],
        ['social media marketing',          '6.9','27.800','2.390', '8.6%','green','▲ 0.8'],
        ['seo consultant indonesia',       '11.4','20.800','1.600', '7.7%','green','▲ 1.4'],
        ['pemasaran digital umkm',          '9.7','16.200','1.100', '6.8%','red',  '▼ 0.2'],
      ],
    },
  },

  'q1-2025': {
    label: 'Q1 2025 (Jan – Mar)',
    comparison: 'vs Q4 2024',
    bannerDate: 'Q1 2025 (Jan – Mar)',
    metrics: {
      'ov-spend':    { raw: 131400000, display: 'Rp 131,4 Jt', change: '▲ 18.2%', dir: 'up',   spark: [36,38,38,40,41,43,43,45,46,47,49,51] },
      'ov-traffic':  { raw: 69570,     display: '69.570',       change: '▲ 14.8%', dir: 'up',   spark: [48,50,52,54,55,56,57,58,60,61,62,63] },
      'ov-sessions': { raw: 175450,    display: '175.450',      change: '▲ 10.4%', dir: 'up',   spark: [136,140,143,148,152,155,157,160,163,165,168,170] },
      'ov-conv':     { raw: 3471,      display: '3.471',        change: '▲ 31.4%', dir: 'up',   spark: [2100,2300,2500,2700,2850,3000,3100,3200,3300,3380,3430,3471] },
      'ads-spend':   { raw: 119300000, display: 'Rp 119,3 Jt', change: '▲ 18.2%', dir: 'up',   spark: [82,87,88,92,94,98,98,102,104,108,110,115] },
      'ads-clicks':  { raw: 108500,    display: '108.500',      change: '▲ 12.8%', dir: 'up',   spark: [84,88,88,92,94,96,98,100,102,104,106,108] },
      'ads-ctr':     { raw: 3.95,      display: '3.95%',        change: '▲ 0.6pp', dir: 'up',   spark: [3.2,3.3,3.5,3.6,3.7,3.8,3.8,3.9,3.9,3.9,4.0,4.0] },
      'ads-roas':    { raw: 3.15,      display: '3.15x',        change: '▲ 0.5x',  dir: 'up',   spark: [2.5,2.6,2.7,2.8,2.9,3.0,3.0,3.1,3.1,3.1,3.1,3.2] },
      'seo-sess':    { raw: 69570,     display: '69.570',       change: '▲ 14.8%', dir: 'up',   spark: [49000,52000,55000,58000,61000,63000,64500,66000,67000,68000,69000,69570] },
      'seo-impr':    { raw: 866300,    display: '866.300',      change: '▲ 22.4%', dir: 'up',   spark: [588,620,656,692,720,749,770,796,814,832,848,860] },
      'seo-pos':     { raw: 7.46,      display: '7.46',         change: '▲ 2.2 pts',dir:'up',   spark: [9.6,9.4,9.1,8.8,8.4,8.1,7.8,7.5,7.2,7.0,7.2,7.5], invert: true },
      'seo-ctr':     { raw: 7.26,      display: '7.26%',        change: '▲ 1.4pp', dir: 'up',   spark: [5.6,5.9,6.1,6.4,6.6,6.8,7.0,7.1,7.2,7.3,7.2,7.3] },
      'web-sess':    { raw: 175450,    display: '175.450',      change: '▲ 10.4%', dir: 'up',   spark: [136,140,143,148,152,155,157,160,163,165,168,170] },
      'web-users':   { raw: 128990,    display: '128.990',      change: '▲ 9.8%',  dir: 'up',   spark: [106,109,111,113,116,118,120,122,124,126,128,129] },
      'web-bounce':  { raw: 59.0,      display: '59.0%',        change: '▼ 4.8pp', dir: 'up',   spark: [65,64,64,63,63,62,61,61,60,60,59,59], invert: true },
      'web-dur':     { raw: 157,       display: '2m 37s',       change: '▲ 0m 18s',dir:'up',    spark: [128,134,136,140,144,147,149,152,154,156,157,157] },
    },
    charts: {
      'overview-trend': {
        sessions: [32400,34100,36200,38400,40900,43600,45100,46800,48200,50400,52100,54400,56200,58100,59800,61200,62800,64200,65600,67100,68400,63800,65200,66600,67900,69200,70500,68800,67400,66200,67500],
        spend:    [960000,1080000,950000,1140000,1280000,1340000,1220000,1190000,1310000,1430000,1560000,1480000,1620000,1540000,1680000,1450000,1520000,1590000,1640000,1700000,1580000,1490000,1620000,1540000,1680000,1740000,1610000,1480000,1560000,1500000,1420000],
      },
      'ads-trend': {
        spend:   [0.96,1.08,0.95,1.14,1.28,1.34,1.22,1.19,1.31,1.43,1.56,1.48,1.62,1.54,1.68,1.45,1.52,1.59,1.64,1.70,1.58,1.49,1.62,1.54,1.68,1.74,1.61,1.48,1.56,1.50,1.42],
        revenue: [3.1,3.6,3.3,3.9,4.3,4.5,4.1,4.0,4.4,5.0,5.5,5.2,5.8,5.4,6.1,5.1,5.4,5.7,5.9,6.2,5.7,5.3,5.8,5.4,6.0,6.3,5.8,5.2,5.6,5.3,5.0],
      },
      'seo-trend': {
        sessions:    [14800,16200,18600,20400,22400,24830],
        impressions: [176000,210000,248000,280000,302000,318400],
      },
      'ads-platform': {
        google: [14.4,17.8,19.8,22.8,25.2,28.2],
        meta:   [8.4,9.9,11.2,12.6,13.8,15.8],
      },
    },
    extras: {
      channelDonut: [44,30,14,8,4],
      channelCenter: { value:'175K', label:'Sessions' },
      channelBars:   [44,30,14,8,4],
      webDevice: [63,31,6],
      webDeviceCenter: { value:'63%', label:'Mobile' },
      seoRanking: [18,56,84,122,156],
      channelSummary: [
        { value:'Rp 76,5 Jt', change:'▲ 18.2% ROAS 3.5x', dir:'up' },
        { value:'Rp 42,8 Jt', change:'▲ 12.4% ROAS 2.7x',  dir:'up' },
        { value:'Pos. 7.5',   sub:'69.570 sessions',         change:'▲ 2.2 pos improvement', dir:'up' },
        { value:'59.0% BR',   sub:'175.450 sessions',        change:'▼ 4.8% bounce rate', dir:'down' },
      ],
      adsTable: [
        ['1.248.200','48.200','3.86%','Rp 44,8 Jt','Rp 930', '1.104','3.8x'],
        ['834.600',  '34.600','4.15%','Rp 31,4 Jt','Rp 907',   '876','3.0x'],
        ['380.200',  '12.400','3.26%','Rp 22,6 Jt','Rp 1.823', '520','2.2x'],
        ['566.200',  '19.640','3.47%','Rp 20,4 Jt','Rp 1.039', '484','2.5x'],
      ],
      seoTable: [
        ['digital marketing agency jakarta','2.1','165.100','24.765','15.0%','green','▲ 1.4'],
        ['jasa iklan google ads',           '3.4','128.400','14.124','11.0%','green','▲ 2.4'],
        ['social media marketing',          '5.8', '82.800', '7.452', '9.0%','green','▲ 1.8'],
        ['seo consultant indonesia',        '7.2', '64.600', '5.168', '8.0%','green','▲ 3.8'],
        ['pemasaran digital umkm',          '9.1', '51.200', '3.584', '7.0%','green','▲ 0.6'],
      ],
    },
  },

  'q4-2024': {
    label: 'Q4 2024 (Oct – Dec)',
    comparison: 'vs Q3 2024',
    bannerDate: 'Q4 2024 (Oct – Dec)',
    metrics: {
      'ov-spend':    { raw: 111200000, display: 'Rp 111,2 Jt', change: '▲ 14.6%', dir: 'up',   spark: [28,30,31,33,34,36,36,38,39,40,42,43] },
      'ov-traffic':  { raw: 60620,     display: '60.620',       change: '▲ 10.2%', dir: 'up',   spark: [42,44,44,46,47,48,49,50,51,52,53,54] },
      'ov-sessions': { raw: 158920,    display: '158.920',      change: '▲ 7.8%',  dir: 'up',   spark: [122,125,127,130,133,136,138,140,143,145,147,149] },
      'ov-conv':     { raw: 2642,      display: '2.642',        change: '▲ 22.8%', dir: 'up',   spark: [1600,1740,1860,1980,2080,2160,2240,2320,2400,2480,2560,2642] },
      'ads-spend':   { raw: 100900000, display: 'Rp 100,9 Jt', change: '▲ 14.6%', dir: 'up',   spark: [68,72,73,76,78,82,82,85,87,90,92,96] },
      'ads-clicks':  { raw: 96100,     display: '96.100',       change: '▲ 9.4%',  dir: 'up',   spark: [74,77,77,80,82,84,86,88,89,91,93,95] },
      'ads-ctr':     { raw: 3.40,      display: '3.40%',        change: '▲ 0.4pp', dir: 'up',   spark: [2.8,2.9,3.0,3.1,3.1,3.2,3.3,3.3,3.4,3.4,3.4,3.4] },
      'ads-roas':    { raw: 2.68,      display: '2.68x',        change: '▲ 0.4x',  dir: 'up',   spark: [2.1,2.2,2.3,2.4,2.4,2.5,2.5,2.6,2.6,2.7,2.7,2.7] },
      'seo-sess':    { raw: 60620,     display: '60.620',       change: '▲ 10.2%', dir: 'up',   spark: [42200,44800,47400,50000,52800,54800,56200,57400,58400,59200,60000,60620] },
      'seo-impr':    { raw: 707800,    display: '707.800',      change: '▲ 16.2%', dir: 'up',   spark: [484,510,538,566,590,614,632,650,664,676,688,700] },
      'seo-pos':     { raw: 9.6,       display: '9.6',          change: '▲ 1.2 pts',dir:'up',   spark: [11.0,10.8,10.6,10.4,10.2,10.0,9.8,9.6,9.5,9.5,9.6,9.6], invert: true },
      'seo-ctr':     { raw: 5.82,      display: '5.82%',        change: '▲ 0.8pp', dir: 'up',   spark: [4.4,4.6,4.8,5.0,5.2,5.4,5.5,5.6,5.7,5.8,5.8,5.8] },
      'web-sess':    { raw: 158920,    display: '158.920',      change: '▲ 7.8%',  dir: 'up',   spark: [122,125,127,130,133,136,138,140,143,145,147,149] },
      'web-users':   { raw: 117480,    display: '117.480',      change: '▲ 7.2%',  dir: 'up',   spark: [96,98,99,101,103,105,107,109,111,113,115,116] },
      'web-bounce':  { raw: 63.8,      display: '63.8%',        change: '▼ 2.2pp', dir: 'up',   spark: [67,66,66,66,65,65,65,64,64,64,64,64], invert: true },
      'web-dur':     { raw: 139,       display: '2m 19s',       change: '▲ 0m 14s',dir:'up',    spark: [110,115,118,122,125,128,130,132,134,136,138,139] },
    },
    charts: {
      'overview-trend': {
        sessions: [28600,30100,32400,34800,37400,40200,41900,43800,45400,44200,45600,47000,48500,49800,51200,48000,46900,48400,49800,51200,52500,49100,50400,51800,53100,54400,53700,52200,50900,49900,51200],
        spend:    [840000,960000,850000,1020000,1160000,1220000,1110000,1080000,1200000,1320000,1440000,1370000,1510000,1430000,1570000,1350000,1420000,1480000,1530000,1590000,1480000,1390000,1510000,1430000,1570000,1630000,1510000,1390000,1460000,1400000,1320000],
      },
      'ads-trend': {
        spend:   [0.84,0.96,0.85,1.02,1.16,1.22,1.11,1.08,1.20,1.32,1.44,1.37,1.51,1.43,1.57,1.35,1.42,1.48,1.53,1.59,1.48,1.39,1.51,1.43,1.57,1.63,1.51,1.39,1.46,1.40,1.32],
        revenue: [2.6,3.1,2.8,3.4,3.8,4.0,3.6,3.5,3.9,4.4,4.8,4.5,5.1,4.7,5.4,4.4,4.7,4.9,5.1,5.4,4.9,4.6,5.1,4.7,5.3,5.5,5.1,4.6,4.9,4.6,4.3],
      },
      'seo-trend': {
        sessions:    [11800,13600,15600,17800,19400,21200],
        impressions: [152000,180000,210000,240000,262000,286000],
      },
      'ads-platform': {
        google: [12.2,14.4,16.2,18.6,20.4,22.2],
        meta:   [7.2,8.4,9.6,10.8,12.0,13.4],
      },
    },
    extras: {
      channelDonut: [43,29,15,9,4],
      channelCenter: { value:'159K', label:'Sessions' },
      channelBars:   [43,29,15,9,4],
      webDevice: [64,30,6],
      webDeviceCenter: { value:'64%', label:'Mobile' },
      seoRanking: [8,28,48,90,126],
      channelSummary: [
        { value:'Rp 64,8 Jt', change:'▲ 14.6% ROAS 3.0x', dir:'up' },
        { value:'Rp 36,1 Jt', change:'▲ 9.8% ROAS 2.4x',   dir:'up' },
        { value:'Pos. 9.6',   sub:'60.620 sessions',         change:'▲ 1.2 pos improvement', dir:'up' },
        { value:'63.8% BR',   sub:'158.920 sessions',        change:'▼ 2.2% bounce rate', dir:'down' },
      ],
      adsTable: [
        ['1.082.400','41.800','3.86%','Rp 38,6 Jt','Rp 924', '956','3.4x'],
        ['724.200',  '29.840','4.12%','Rp 27,2 Jt','Rp 912', '756','2.8x'],
        ['330.400',  '10.760','3.26%','Rp 19,8 Jt','Rp 1.840','444','2.0x'],
        ['492.400',  '17.080','3.47%','Rp 17,6 Jt','Rp 1.031','412','2.2x'],
      ],
      seoTable: [
        ['digital marketing agency jakarta', '3.3','144.800','20.272','14.0%','green','▲ 1.0'],
        ['jasa iklan google ads',            '5.2','112.600','11.260','10.0%','green','▲ 2.0'],
        ['social media marketing',           '7.4', '72.400', '6.157', '8.5%','green','▲ 1.4'],
        ['seo consultant indonesia',        '10.8', '56.200', '4.216', '7.5%','green','▲ 2.8'],
        ['pemasaran digital umkm',           '9.6', '44.200', '2.872', '6.5%','green','▲ 0.4'],
      ],
    },
  },
};

/* ── Chart Store ───────────────────────────────────────────────── */
const CHARTS = {};

/* ── Current Period ────────────────────────────────────────────── */
let currentPeriod = 'mar-2025';

/* ── Metric Card Map: element selectors ───────────────────────── */
// Map of metric key → [value-el selector, change-el selector, sparkline-el selector]
// Card metric overrides: { 'ads-spend': 'ads-impressions' }
// Persists to localStorage so card assignments survive page reload
const cardMetricOverrides = (() => {
  try { return JSON.parse(localStorage.getItem('avo_card_metrics_v1') || '{}'); } catch(e) { return {}; }
})();
function _saveCardMetricOverrides() {
  try { localStorage.setItem('avo_card_metrics_v1', JSON.stringify(cardMetricOverrides)); } catch(e) {}
}

function getEffectiveMetricKey(cardKey) {
  return cardMetricOverrides[cardKey] || cardKey;
}

// Map editor metric value → human label (used for card label update)
function getMetricLabel(metricValue) {
  for (const metrics of Object.values(EDITOR_SOURCE_METRICS || {})) {
    const found = metrics.find(m => m.value === metricValue);
    if (found) return found.label;
  }
  return metricValue;
}

const METRIC_MAP = {
  // Overview
  'ov-spend':    ['#page-overview .metric-card:nth-child(1) .metric-value', '#page-overview .metric-card:nth-child(1) .metric-change', '#page-overview .metric-card:nth-child(1) .metric-sparkline'],
  'ov-traffic':  ['#page-overview .metric-card:nth-child(2) .metric-value', '#page-overview .metric-card:nth-child(2) .metric-change', '#page-overview .metric-card:nth-child(2) .metric-sparkline'],
  'ov-sessions': ['#page-overview .metric-card:nth-child(3) .metric-value', '#page-overview .metric-card:nth-child(3) .metric-change', '#page-overview .metric-card:nth-child(3) .metric-sparkline'],
  'ov-conv':     ['#page-overview .metric-card:nth-child(4) .metric-value', '#page-overview .metric-card:nth-child(4) .metric-change', '#page-overview .metric-card:nth-child(4) .metric-sparkline'],
  // Ads
  'ads-spend':   ['#page-ads .metric-card:nth-child(1) .metric-value', '#page-ads .metric-card:nth-child(1) .metric-change', '#page-ads .metric-card:nth-child(1) .metric-sparkline'],
  'ads-clicks':  ['#page-ads .metric-card:nth-child(2) .metric-value', '#page-ads .metric-card:nth-child(2) .metric-change', '#page-ads .metric-card:nth-child(2) .metric-sparkline'],
  'ads-ctr':     ['#page-ads .metric-card:nth-child(3) .metric-value', '#page-ads .metric-card:nth-child(3) .metric-change', '#page-ads .metric-card:nth-child(3) .metric-sparkline'],
  'ads-roas':    ['#page-ads .metric-card:nth-child(4) .metric-value', '#page-ads .metric-card:nth-child(4) .metric-change', '#page-ads .metric-card:nth-child(4) .metric-sparkline'],
  // SEO
  'seo-sess':    ['#page-seo .metric-card:nth-child(1) .metric-value', '#page-seo .metric-card:nth-child(1) .metric-change', '#page-seo .metric-card:nth-child(1) .metric-sparkline'],
  'seo-impr':    ['#page-seo .metric-card:nth-child(2) .metric-value', '#page-seo .metric-card:nth-child(2) .metric-change', '#page-seo .metric-card:nth-child(2) .metric-sparkline'],
  'seo-pos':     ['#page-seo .metric-card:nth-child(3) .metric-value', '#page-seo .metric-card:nth-child(3) .metric-change', '#page-seo .metric-card:nth-child(3) .metric-sparkline'],
  'seo-ctr':     ['#page-seo .metric-card:nth-child(4) .metric-value', '#page-seo .metric-card:nth-child(4) .metric-change', '#page-seo .metric-card:nth-child(4) .metric-sparkline'],
  // Website
  'web-sess':    ['#page-web .metric-card:nth-child(1) .metric-value', '#page-web .metric-card:nth-child(1) .metric-change', '#page-web .metric-card:nth-child(1) .metric-sparkline'],
  'web-users':   ['#page-web .metric-card:nth-child(2) .metric-value', '#page-web .metric-card:nth-child(2) .metric-change', '#page-web .metric-card:nth-child(2) .metric-sparkline'],
  'web-bounce':  ['#page-web .metric-card:nth-child(3) .metric-value', '#page-web .metric-card:nth-child(3) .metric-change', '#page-web .metric-card:nth-child(3) .metric-sparkline'],
  'web-dur':     ['#page-web .metric-card:nth-child(4) .metric-value', '#page-web .metric-card:nth-child(4) .metric-change', '#page-web .metric-card:nth-child(4) .metric-sparkline'],
};

/* ── Editable Banner Title ─────────────────────────────────────────
   In edit mode, clicking the banner title lets admin rename the report
   title in-place. Saved per-page to localStorage avo_banner_titles_v1.
   ─────────────────────────────────────────────────────────────────── */
const _BANNER_TITLES_LS = 'avo_banner_titles_v1';
function _loadBannerTitles() {
  try { return JSON.parse(localStorage.getItem(_BANNER_TITLES_LS) || '{}'); } catch(e) { return {}; }
}
function _saveBannerTitle(pageId, text) {
  const store = _loadBannerTitles();
  store[pageId] = text;
  try { localStorage.setItem(_BANNER_TITLES_LS, JSON.stringify(store)); } catch(e) {}
}

function _restoreBannerTitles() {
  const store = _loadBannerTitles();
  Object.entries(store).forEach(([pageId, text]) => {
    const page = document.getElementById('page-' + pageId);
    if (!page) return;
    const el = page.querySelector('.banner-title');
    if (el) el.textContent = text;
  });
}

function _initEditableBannerTitles() {
  document.querySelectorAll('.page').forEach(page => {
    const pageId = page.id.replace('page-', '');
    const el = page.querySelector('.banner-title');
    if (!el) return;
    if (el.dataset.editWired) return;
    el.dataset.editWired = '1';
    // Make editable in edit mode on click
    page.querySelector('.banner-title').setAttribute('contenteditable', 'false');
    el.title = 'Klik untuk mengedit judul laporan';
    el.addEventListener('click', () => {
      if (!isEditMode) return;
      el.contentEditable = 'true';
      el.focus();
      // Select all text
      const range = document.createRange(); range.selectNodeContents(el);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
    });
    el.addEventListener('blur', () => {
      el.contentEditable = 'false';
      _saveBannerTitle(pageId, el.textContent.trim());
    });
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      if (e.key === 'Escape') { e.preventDefault(); el.textContent = _loadBannerTitles()[pageId] || el.textContent; el.blur(); }
    });
  });
  // Make them visually editable in edit mode
  document.querySelectorAll('.banner-title[data-edit-wired]').forEach(el => {
    el.setAttribute('contenteditable', 'false');
    el.title = 'Klik untuk mengedit judul laporan';
  });
}

// Restore saved titles on page load
document.addEventListener('DOMContentLoaded', _restoreBannerTitles);

/* ── Duplicate Card ────────────────────────────────────────────────
   Clones the currently edited metric card, gives it a unique key,
   registers it in METRIC_MAP, and persists if the original was dynamic.
   ─────────────────────────────────────────────────────────────────── */
function duplicateCard(sourceCard) {
  if (!sourceCard) return;
  const sourceKey  = sourceCard.dataset.metricKey;
  const pageEl     = sourceCard.closest('.page');
  const pageId     = pageEl?.id?.replace('page-', '');
  const grid       = sourceCard.closest('.grid');
  if (!grid || !pageId) return;

  const prefix     = _PAGE_PREFIX[pageId] || pageId;
  const newKey     = prefix + '-dyn-' + Date.now().toString(36);
  const accentClass = Array.from(sourceCard.classList).find(c => c.startsWith('accent-')) || 'accent-teal';

  // Deep clone visual appearance
  const cardEl = _buildDynCardEl(newKey, accentClass);
  // Copy label
  const srcLabel = sourceCard.querySelector('.metric-label')?.textContent || 'New Metric';
  const lblEl = cardEl.querySelector('.metric-label');
  if (lblEl) lblEl.textContent = srcLabel;

  cardEl.dataset.cid = newKey;
  grid.appendChild(cardEl);
  _registerDynCard(newKey);

  // Copy metric override from source
  const effectiveKey = getEffectiveMetricKey(sourceKey);
  if (effectiveKey !== newKey) {
    cardMetricOverrides[newKey] = effectiveKey;
    _saveCardMetricOverrides();
  }

  if (isEditMode) {
    _applyEditHandles(cardEl);
    if (grid.classList.contains('free-layout')) {
      // Place slightly offset from source
      const srcLeft = parseFloat(sourceCard.style.left) || 0;
      const srcTop  = parseFloat(sourceCard.style.top)  || 0;
      const srcW    = parseFloat(sourceCard.style.width) || sourceCard.offsetWidth;
      const srcH    = parseFloat(sourceCard.style.height) || sourceCard.offsetHeight;
      cardEl.style.left   = (srcLeft + 24) + 'px';
      cardEl.style.top    = (srcTop  + 24) + 'px';
      cardEl.style.width  = srcW + 'px';
      cardEl.style.height = srcH + 'px';
      const gridH = parseFloat(grid.style.minHeight) || grid.scrollHeight;
      if (srcTop + 24 + srcH > gridH) grid.style.minHeight = (srcTop + 24 + srcH + 32) + 'px';
      if (typeof window._initInteractCard === 'function') window._initInteractCard(cardEl, grid);
      setTimeout(() => { if (typeof resizeCardContent === 'function') resizeCardContent(cardEl); }, 60);
    }
  }

  // Persist to dyn store
  const store = _dynCardsStore();
  if (!store[pageId]) store[pageId] = [];
  store[pageId].push({ key: newKey, accentClass });
  _saveDynCards(store);

  // Persist the label via cardLabels so it survives reload (and applyPeriod)
  if (typeof cardLabels !== 'undefined') {
    if (!cardLabels[newKey]) cardLabels[newKey] = {};
    cardLabels[newKey].metricLabel = srcLabel;
    if (typeof _saveCardLabels === 'function') _saveCardLabels();
  }

  applyPeriod(currentPeriod);

  // applyPeriod may overwrite label with getMetricLabel() fallback — restore it
  const fixedLbl = cardEl.querySelector('.metric-label');
  if (fixedLbl) fixedLbl.textContent = srcLabel;

  _showLayoutToast('✓ Card diduplikat');
  closeEditor();
  setTimeout(() => openEditor(cardEl), 80);
}

/* ── Dynamic Card Manager ──────────────────────────────────────────
   Allows admins to add/remove metric cards at runtime. Cards persist
   across reloads via avo_dyn_cards_v1 in localStorage.
   ─────────────────────────────────────────────────────────────────── */
const DYN_CARDS_LS = 'avo_dyn_cards_v1';
const ACCENT_POOL  = ['accent-teal','accent-yellow','accent-navy','accent-green','accent-orange'];
const _PAGE_PREFIX = { overview:'ov', ads:'ads', seo:'seo', web:'web' };

function _dynCardsStore()     { try { return JSON.parse(localStorage.getItem(DYN_CARDS_LS)||'{}'); } catch(e) { return {}; } }
function _saveDynCards(store) { try { localStorage.setItem(DYN_CARDS_LS, JSON.stringify(store)); } catch(e) {} }

function _buildDynCardEl(key, accentClass) {
  const el = document.createElement('div');
  el.className  = `metric-card ${accentClass||'accent-teal'}`;
  el.dataset.metricKey = key;
  el.dataset.dynCard   = '1';
  el.innerHTML = `
    <div class="metric-top">
      <span class="metric-label" data-def="Configure this metric via the card editor.">New Metric</span>
      <div class="metric-icon teal">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
    </div>
    <div class="metric-value">—</div>
    <div class="metric-sparkline" data-color="#00C2B8" data-values="0,0,0,0,0,0,0,0,0,0,0,0"></div>
    <div class="metric-footer">
      <span class="metric-change up">—</span>
      <span class="metric-period">—</span>
    </div>`;
  return el;
}

function _registerDynCard(key) {
  METRIC_MAP[key] = [
    `[data-metric-key="${key}"] .metric-value`,
    `[data-metric-key="${key}"] .metric-change`,
    `[data-metric-key="${key}"] .metric-sparkline`,
  ];
  _invalidateMetricElements();
}
function _unregisterDynCard(key) {
  delete METRIC_MAP[key];
  _invalidateMetricElements();
}

function _applyEditHandles(el) {
  if (!el.querySelector('.drag-handle')) {
    const h = document.createElement('div');
    h.className = 'drag-handle'; h.title = 'Drag / click to edit';
    el.insertBefore(h, el.firstChild);
  }
  if (!el.querySelector('.card-edit-btn')) {
    const btn = document.createElement('button');
    btn.className = 'card-edit-btn'; btn.title = 'Edit card';
    btn.innerHTML = `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
    el.appendChild(btn);
  }
  if (el.classList.contains('metric-card') && !el.querySelector('.resize-handle')) {
    const rh = document.createElement('div');
    rh.className = 'resize-handle'; rh.title = 'Drag to resize';
    rh.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 8 L8 2 M5 8 L8 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    el.appendChild(rh);
  }
}

/* addCardToPage — creates + persists a new metric card on the given page */
function addCardToPage(pageId) {
  const pageEl = document.getElementById('page-' + pageId);
  if (!pageEl) return;
  const grid = pageEl.querySelector('.grid');
  if (!grid) return;

  const prefix      = _PAGE_PREFIX[pageId] || pageId;
  const key         = prefix + '-dyn-' + Date.now().toString(36);
  const accentClass = ACCENT_POOL[Math.floor(Math.random() * ACCENT_POOL.length)];
  const cardEl      = _buildDynCardEl(key, accentClass);

  // Auto CID for label tracking
  const usedCids = new Set([...document.querySelectorAll('[data-cid]')].map(c => c.dataset.cid));
  let cid = 'new-metric', i = 1;
  while (usedCids.has(cid)) cid = `new-metric-${i++}`;
  cardEl.dataset.cid = cid;

  grid.appendChild(cardEl);
  _registerDynCard(key);

  if (isEditMode) {
    _applyEditHandles(cardEl);
    // Position the new card inside the free layout grid
    if (grid.classList.contains('free-layout')) {
      const gridH  = parseFloat(grid.style.minHeight) || grid.scrollHeight;
      const cardW  = Math.round(grid.offsetWidth * 0.5);
      const cardH  = 160;
      cardEl.style.left   = '16px';
      cardEl.style.top    = gridH + 'px';
      cardEl.style.width  = cardW + 'px';
      cardEl.style.height = cardH + 'px';
      grid.style.minHeight = (gridH + cardH + 32) + 'px';
      if (typeof window._initInteractCard === 'function') window._initInteractCard(cardEl, grid);
      if (typeof resizeCardContent === 'function') setTimeout(() => resizeCardContent(cardEl), 60);
    }
  }

  // Populate from current period data
  applyPeriod(currentPeriod);

  // Persist
  const store = _dynCardsStore();
  if (!store[pageId]) store[pageId] = [];
  store[pageId].push({ key, accentClass });
  _saveDynCards(store);

  _showLayoutToast('✓ Card metrik ditambahkan — buka editor untuk pilih metrik');
  // Open editor so user can immediately configure the card
  setTimeout(() => openEditor(cardEl), 100);
}

/* removeCardFromPage — removes a dynamic card from DOM + storage */
function removeCardFromPage(cardEl) {
  const key    = cardEl.dataset.metricKey;
  const pageEl = cardEl.closest('.page');
  const pageId = pageEl?.id?.replace('page-', '');

  cardEl.remove();

  if (key) {
    _unregisterDynCard(key);
    delete cardMetricOverrides[key]; _saveCardMetricOverrides();
    delete cardSettings[key];       _saveCardSettings();
  }
  if (pageId && key) {
    const store = _dynCardsStore();
    if (store[pageId]) {
      store[pageId] = store[pageId].filter(c => c.key !== key);
      if (!store[pageId].length) delete store[pageId];
    }
    _saveDynCards(store);
  }
  closeEditor();
  _showLayoutToast('Card dihapus');
}

/* _loadDynCards — called on DOMContentLoaded to restore persisted cards */
function _loadDynCards() {
  const store = _dynCardsStore();
  let anyLoaded = false;
  Object.entries(store).forEach(([pageId, cards]) => {
    const pageEl = document.getElementById('page-' + pageId);
    if (!pageEl) return;
    const grid = pageEl.querySelector('.grid');
    if (!grid) return;
    cards.forEach(({ key, accentClass }) => {
      if (document.querySelector(`[data-metric-key="${key}"]`)) return;
      const cardEl = _buildDynCardEl(key, accentClass);
      cardEl.dataset.cid = key; // use key as CID for label persistence
      grid.appendChild(cardEl);
      _registerDynCard(key);
      anyLoaded = true;
    });
  });
  // Re-run applyPeriod so newly registered dynamic cards get populated
  if (anyLoaded && typeof currentPeriod !== 'undefined') {
    setTimeout(() => applyPeriod(currentPeriod), 50);
  }
}

/* ── Cached DOM refs for METRIC_MAP — built once, reused every period switch ── */
// Eliminates 48+ querySelector calls per applyPeriod() invocation
let _ME = null;  // { [key]: { val, chg, spk, card } }
function _ensureMetricElements() {
  if (_ME) return;
  _ME = {};
  Object.entries(METRIC_MAP).forEach(([key, [valSel, chgSel, spkSel]]) => {
    const val  = document.querySelector(valSel);
    const chg  = document.querySelector(chgSel);
    const spk  = document.querySelector(spkSel);
    _ME[key] = { val, chg, spk, card: val?.closest('.metric-card') || null };
  });
}
// Invalidate cache when card layout changes (e.g. after metric override)
function _invalidateMetricElements() { _ME = null; }

/* ── Apply Period ──────────────────────────────────────────────── */
function applyPeriod(periodKey) {
  const data = PERIOD_DATA[periodKey];
  if (!data) return;

  const prev = PERIOD_DATA[currentPeriod];
  currentPeriod = periodKey;

  // Update date labels
  const headerDateEl = document.getElementById('header-date-label');
  if (headerDateEl) headerDateEl.textContent = data.label;
  ['overview','ads','seo','web'].forEach(page => {
    const el = document.getElementById(`banner-date-${page}`);
    if (el) el.textContent = data.bannerDate;
  });

  // Animate metric values — uses cached DOM refs (no querySelector per call)
  _ensureMetricElements();
  const _spkPages = new Set(); // collect pages needing sparkline re-render (batch at end)

  Object.entries(METRIC_MAP).forEach(([key, [valSel, chgSel]]) => {
    const effectiveKey = getEffectiveMetricKey(key);
    const newM = data.metrics[effectiveKey];
    const oldM = prev?.metrics[effectiveKey];
    const refs = _ME[key];

    // Update card label if metric was overridden
    if (effectiveKey !== key && refs?.val) {
      const lblEl = refs.val.parentElement?.querySelector('.metric-label');
      if (lblEl) lblEl.textContent = getMetricLabel(effectiveKey);
    }
    if (!newM || !refs) return;

    const { val: valEl, chg: chgEl, spk: spkEl, card: cardEl } = refs;

    if (valEl && oldM) {
      const disp = newM.display;
      let formatter;
      if      (disp.includes('Rp')) formatter = v => 'Rp ' + (v / 1000000).toFixed(1).replace('.', ',') + ' Jt';
      else if (disp.includes('%'))  formatter = v => v.toFixed(2) + '%';
      else if (disp.includes('x'))  formatter = v => v.toFixed(2) + 'x';
      else if (disp.includes('m ')) formatter = v => { const m = Math.floor(v/60), s = Math.round(v%60); return `${m}m ${s}s`; };
      else if (!Number.isInteger(newM.raw) && /^\d+\.\d+$/.test(disp.trim())) { const dp = (disp.split('.')[1]||'').length; formatter = v => v.toFixed(dp); }
      else                          formatter = v => Math.round(v).toLocaleString('id-ID');
      animateValue(valEl, oldM.raw, newM.raw, formatter);
    } else if (valEl) {
      valEl.textContent = newM.display;
    }

    if (chgEl) {
      chgEl.textContent = newM.change;
      chgEl.className = 'metric-change ' + (newM.dir === 'up' ? 'up' : 'down');
      // Comparison period label
      const periodEl = chgEl.parentElement?.querySelector('.metric-period');
      if (periodEl && data.comparison) periodEl.textContent = data.comparison;
    }

    if (spkEl) {
      // #23 Save previous sparkline as ghost before overwriting
      if (spkEl.dataset.values) spkEl.dataset.prevValues = spkEl.dataset.values;
      spkEl.dataset.values = newM.spark.join(',');
      if (newM.invert) spkEl.dataset.invert = 'true'; else delete spkEl.dataset.invert;
      // Collect page for batched render (not called here — prevents 16 renders per switch)
      _spkPages.add(spkEl.closest('.page') || document);
    }

    // Re-apply card editor settings (goal % recalculate on period change)
    if (cardEl?.dataset.metricKey) applyCardSettings(cardEl, cardEl.dataset.metricKey, false);
  });

  // Single sparkline render pass per affected page (was 16 calls, now ≤4)
  _spkPages.forEach(p => renderSparklines(p));

  // Destroy all initialized charts; only immediately recreate the visible page
  const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
  _initializedPages.forEach(pid => _destroyPageCharts(pid));
  _initializedPages.clear();
  if (activePage) setTimeout(() => initChartsForPage(activePage), 0);

  // Update extras — progress bars, tables
  const ex = data.extras;
  if (!ex) return;

  // Channel breakdown progress bars
  ex.channelBars.forEach((pct, i) => {
    const fill = document.getElementById(`ch-fill-${i}`);
    const val  = document.getElementById(`ch-pct-${i}`);
    if (fill) fill.style.width = pct + '%';
    if (val)  val.textContent  = pct + '%';
  });

  // Channel summary card values
  const SUMMARY_NAMES = ['Google Ads','Meta Ads','Organic SEO','Website'];
  ex.channelSummary.forEach((s, i) => {
    const row = document.getElementById(`ch-sum-${i}`);
    if (!row) return;
    const valEl = row.querySelector('.summary-value');
    const chgEl = row.querySelector('.summary-change');
    const subEl = row.querySelector('.summary-sub');
    if (valEl) valEl.textContent = s.value;
    if (chgEl) { chgEl.textContent = s.change; chgEl.className = `summary-change trend-${s.dir}`; }
    if (subEl && s.sub) subEl.textContent = s.sub;
  });

  // Ads campaigns table
  const adsBody = document.getElementById('ads-table-body');
  if (adsBody && ex.adsTable) {
    const rows = adsBody.querySelectorAll('tr');
    ex.adsTable.forEach((row, ri) => {
      const tr = rows[ri];
      if (!tr) return;
      const tds = tr.querySelectorAll('td.num');
      // tds[0]=impressions, [1]=clicks, [2]=ctr, [3]=spend, [4]=cpc, [5]=conv, [6]=roas
      row.forEach((val, ci) => { if (tds[ci]) tds[ci].textContent = val; });
    });
  }

  // SEO keywords table
  // row format: [keyword, position, impressions, clicks, ctr%, color, change]
  const seoBody = document.getElementById('seo-table-body');
  if (seoBody && ex.seoTable) {
    seoBody.innerHTML = ex.seoTable.map((row) => {
      const posNum   = parseFloat(row[1]);
      const ctr      = parseFloat(row[4]);
      const posClass = posNum <= 3 ? 'cell-good' : posNum <= 10 ? '' : 'cell-warn';
      const ctrClass = ctr >= 12 ? 'cell-good' : ctr >= 8 ? '' : 'cell-warn';
      return `<tr>
        <td data-col-id="keyword"><strong>${row[0]}</strong></td>
        <td data-col-id="device"  style="display:none">—</td>
        <td data-col-id="country" style="display:none">—</td>
        <td data-col-id="page"    style="display:none">—</td>
        <td data-col-id="month"   style="display:none">—</td>
        <td data-col-id="day"     style="display:none">—</td>
        <td class="num ${posClass}" data-col-id="position">${row[1]}</td>
        <td class="num"            data-col-id="impressions">${row[2]}</td>
        <td class="num"            data-col-id="clicks">${row[3]}</td>
        <td class="num ${ctrClass}" data-col-id="ctr">${row[4]}</td>
        <td data-col-id="trend"><span class="chip chip-${row[5]}">${row[6]}</span></td>
      </tr>`;
    }).join('');
    // Re-init table sort after innerHTML replacement
    if (typeof initTableSort === 'function') {
      initTableSort('seo-table','seo-table-search','seo-table-count');
    }
  }

  // #17 Conditional formatting for ads table ROAS/CTR cells
  const adsBodyRows = document.querySelectorAll('#ads-table-body tr');
  adsBodyRows.forEach(tr => {
    const tds = tr.querySelectorAll('td.num');
    // CTR at index 2
    if (tds[2]) {
      const ctr = parseFloat(tds[2].textContent);
      tds[2].className = 'num ' + (ctr >= 4 ? 'cell-good' : ctr >= 3 ? '' : 'cell-warn');
    }
    // ROAS at index 6
    if (tds[6]) {
      const roas = parseFloat(tds[6].textContent);
      tds[6].className = 'num ' + (roas >= 4 ? 'cell-good' : roas >= 3 ? '' : roas >= 2 ? 'cell-warn' : 'cell-bad');
    }
  });

  // #7 Health scores
  applyHealthScores(periodKey);

  // #8 Goal bars
  applyGoalBars(periodKey);

  // #11 Benchmark diffs — recalculate after metric values animate
  setTimeout(_updateBenchmarkDiffs, 400);

}

/* ── Navigation ────────────────────────────────────────────────── */
const PAGE_CHARTS = {
  overview: ['overviewTrend', 'channelDonut'],
  ads:      ['adsTrend', 'adsPlatform'],
  seo:      ['seoTrend', 'seoRanking'],
  web:      ['webDevice'],
};

/* ── Nav DOM cache — built once, reused every navigate() call ── */
// Eliminates 3× querySelectorAll on every sidebar click
let _NAV_PAGES    = null;  // Map<pageId, pageElement>
let _NAV_ITEMS    = null;  // Map<pageId, navItemElement>
let _NAV_ALL      = null;  // Array<navItemElement>

function _ensureNavRefs() {
  if (_NAV_PAGES) return;
  _NAV_PAGES = new Map();
  document.querySelectorAll('.page[id]').forEach(p =>
    _NAV_PAGES.set(p.id.replace('page-', ''), p));
  _NAV_ITEMS = new Map();
  _NAV_ALL   = Array.from(document.querySelectorAll('.nav-item[data-page]'));
  _NAV_ALL.forEach(n => _NAV_ITEMS.set(n.dataset.page, n));
}

/* ═══════════════════════════════════════════════════════════════
   Page Registry — dynamic page add / delete
   ═══════════════════════════════════════════════════════════════ */

const DEFAULT_PAGE_REGISTRY = [
  { id: 'overview', title: 'Overview', deletable: false },
  { id: 'ads',      title: 'Ads',      deletable: true  },
  { id: 'seo',      title: 'SEO',      deletable: true  },
  { id: 'web',      title: 'Website',  deletable: true  },
];

function _loadPageRegistry() {
  try {
    const saved = localStorage.getItem('avo_page_registry');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch(e) {}
  return DEFAULT_PAGE_REGISTRY.map(p => ({...p}));
}

let PAGE_REGISTRY = _loadPageRegistry();

function _savePageRegistry() {
  try { localStorage.setItem('avo_page_registry', JSON.stringify(PAGE_REGISTRY)); } catch(e) {}
}

function _invalidateNavRefs() { _NAV_PAGES = null; _NAV_ITEMS = null; _NAV_ALL = null; }

function _buildCustomPageHTML(page) {
  const pid = page.id;
  const cards = [1,2,3,4].map(n => `
      <div class="metric-card accent-teal" data-metric-key="${pid}-m${n}">
        <div class="metric-top">
          <span class="metric-label" data-def="Configure this metric via Edit Mode.">Metric ${n}</span>
          <div class="metric-icon teal">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
        </div>
        <div class="metric-value">—</div>
        <div class="metric-sparkline" data-color="#00C2B8" data-values="0,0,0,0,0,0,0,0,0,0,0,0"></div>
        <div class="metric-footer">
          <span class="metric-change up">—</span>
          <span class="metric-period">—</span>
        </div>
      </div>`).join('');

  return `<div class="page" id="page-${pid}" data-custom-page="true">
    <div class="report-banner" style="background:linear-gradient(135deg,#1a3050 0%,#0C182C 100%)">
      <div class="banner-content">
        <div class="banner-logo"><img src="assets/img/logo-mark.png" alt="Avonetiq" /></div>
        <div class="banner-text">
          <div class="banner-title">${page.title}</div>
          <div class="banner-subtitle" id="banner-date-${pid}">—</div>
        </div>
      </div>
    </div>
    <p class="section-title">KEY METRICS</p>
    <div class="grid grid-4">${cards}</div>
  </div>`;
}

function _createNavItem(page) {
  const item = document.createElement('div');
  item.className = 'nav-item';
  item.dataset.page = page.id;
  item.innerHTML = `<svg class="nav-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>${page.title}`;
  item.addEventListener('click', () => navigate(page.id));
  return item;
}

function renderPageManagerList() {
  const list = document.getElementById('page-manager-list');
  if (!list) return;
  list.innerHTML = PAGE_REGISTRY.map(page => `
    <div class="page-manager-item" data-page-id="${page.id}">
      <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="opacity:0.35;flex-shrink:0"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      <span class="page-manager-item-name">${page.title}</span>
      ${page.deletable
        ? `<button class="page-manager-item-del" data-delete-page="${page.id}" title="Delete ${page.title}">
            <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>`
        : `<span class="page-manager-item-locked">locked</span>`}
    </div>`).join('');

  list.querySelectorAll('[data-delete-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pageId = btn.dataset.deletePage;
      const entry = PAGE_REGISTRY.find(p => p.id === pageId);
      if (!confirm(`Delete the "${entry?.title}" page? This cannot be undone.`)) return;
      deletePage(pageId);
    });
  });
}

function addPage(name) {
  name = (name || '').trim();
  if (!name) return;
  const base = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'page';
  const id   = base + '-' + Date.now().toString(36);
  const page = { id, title: name, deletable: true };

  PAGE_REGISTRY.push(page);
  _savePageRegistry();

  // Inject page DOM
  const main = document.querySelector('.main');
  let newPageEl = null;
  if (main) {
    const tmp = document.createElement('div');
    tmp.innerHTML = _buildCustomPageHTML(page);
    newPageEl = tmp.firstElementChild;
    main.appendChild(newPageEl);
  }

  // If already in edit mode, inject drag handles + edit buttons into new page's cards
  if (newPageEl && document.body.classList.contains('edit-mode')) {
    newPageEl.querySelectorAll('.card, .metric-card, .insight-card, .funnel-card').forEach(el => {
      if (!el.querySelector('.drag-handle')) {
        const h = document.createElement('div');
        h.className = 'drag-handle';
        h.title = 'Drag to reorder / click to edit';
        el.insertBefore(h, el.firstChild);
      }
      if (!el.querySelector('.card-edit-btn')) {
        const btn = document.createElement('button');
        btn.className = 'card-edit-btn';
        btn.title = 'Edit card';
        btn.innerHTML = `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
        el.appendChild(btn);
      }
    });
  }

  // Add nav item (insert before #nav-manage-pages if exists, else append)
  const nav   = document.querySelector('.sidebar-nav');
  const manageBtn = document.getElementById('nav-manage-pages');
  const item  = _createNavItem(page);
  if (nav) nav.insertBefore(item, manageBtn || null);

  _invalidateNavRefs();
  renderPageManagerList();
  navigate(id);
}

function deletePage(pageId) {
  PAGE_REGISTRY = PAGE_REGISTRY.filter(p => p.id !== pageId);
  _savePageRegistry();

  document.getElementById('page-' + pageId)?.remove();
  document.querySelector(`.nav-item[data-page="${pageId}"]`)?.remove();

  _invalidateNavRefs();
  renderPageManagerList();

  // If user was on the deleted page, go to overview
  const hash = location.hash.slice(1);
  if (hash === pageId || !document.getElementById('page-' + (hash || 'overview'))) {
    navigate('overview');
  }
}

// On load: restore any persisted custom pages not in static HTML
document.addEventListener('DOMContentLoaded', () => {
  PAGE_REGISTRY.filter(p => p.deletable && !document.getElementById('page-' + p.id)).forEach(page => {
    const main = document.querySelector('.main');
    if (main) {
      const tmp = document.createElement('div');
      tmp.innerHTML = _buildCustomPageHTML(page);
      main.appendChild(tmp.firstElementChild);
    }
    if (!document.querySelector(`.nav-item[data-page="${page.id}"]`)) {
      const nav = document.querySelector('.sidebar-nav');
      const manageBtn = document.getElementById('nav-manage-pages');
      const item = _createNavItem(page);
      if (nav) nav.insertBefore(item, manageBtn || null);
    }
  });
  _invalidateNavRefs();
  renderPageManagerList();
  // Restore dynamic cards added by admin (after custom pages are in DOM)
  _loadDynCards();
});

// Wire "Manage Pages" sidebar button
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('nav-manage-pages')?.addEventListener('click', () => {
    // Open editor panel in Pages tab mode (no card context)
    _editingCard = null;
    const panel   = document.getElementById('editor-panel');
    const overlay = document.getElementById('editor-overlay');
    if (!panel || !overlay) return;
    panel.classList.add('open');
    overlay.classList.add('visible');
    // Switch to Pages tab
    panel.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
    panel.querySelectorAll('.editor-tab-content').forEach(c => c.classList.remove('active'));
    const pagesTab = panel.querySelector('.editor-tab[data-tab="pages"]');
    const pagesContent = document.getElementById('editor-pages');
    if (pagesTab) pagesTab.classList.add('active');
    if (pagesContent) pagesContent.classList.add('active');
  });
});

// Wire "Add Page" form
document.addEventListener('DOMContentLoaded', () => {
  const btnAdd     = document.getElementById('btn-add-page');
  const form       = document.getElementById('page-add-form');
  const input      = document.getElementById('new-page-name');
  const btnConfirm = document.getElementById('page-add-confirm');
  const btnCancel  = document.getElementById('page-add-cancel');

  btnAdd?.addEventListener('click', () => {
    form.style.display = '';
    btnAdd.style.display = 'none';
    input?.focus();
  });
  btnCancel?.addEventListener('click', () => {
    form.style.display = 'none';
    btnAdd.style.display = '';
    if (input) input.value = '';
  });
  btnConfirm?.addEventListener('click', () => {
    const name = input?.value.trim();
    if (!name) { input?.focus(); return; }
    addPage(name);
    form.style.display = 'none';
    btnAdd.style.display = '';
    if (input) input.value = '';
  });
  input?.addEventListener('keydown', e => {
    if (e.key === 'Enter') btnConfirm.click();
    if (e.key === 'Escape') btnCancel.click();
  });
});

function navigate(pageId) {
  _ensureNavRefs();

  // Deactivate all pages + nav items (cached — no querySelectorAll)
  _NAV_PAGES.forEach(p => p.classList.remove('active'));
  _NAV_ALL.forEach(n => n.classList.remove('active'));

  const page = _NAV_PAGES.get(pageId);
  if (page) {
    page.classList.remove('active');
    void page.offsetHeight; // single reflow to restart page-enter CSS animation
    page.classList.add('active');
    window.scrollTo(0, 0);

    // Re-trigger progress bar animations — batched read then write (no per-element reflow)
    const fills = Array.from(page.querySelectorAll('.progress-fill'));
    if (fills.length) {
      fills.forEach((el, i) => {
        el.style.animation      = 'none';
        el.style.animationDelay = `${i * 100}ms`;
      });
      void fills[0].offsetHeight; // one reflow flushes all pending style changes
      fills.forEach(el => { el.style.animation = ''; });
    }

    // Lazy init or destroy+recreate charts after CSS transition settles
    setTimeout(() => initChartsForPage(pageId), 50);

    // Re-apply pinned card positions after page becomes visible
    setTimeout(() => window._reapplyPinnedLayout?.(), 120);

    // Re-render sparklines + PSI rings
    renderSparklines(page);
    if (pageId === 'web') renderPsiRings();
  }

  const navItem = _NAV_ITEMS.get(pageId);
  if (navItem) navItem.classList.add('active');

  // #5 URL hash navigation
  if (history.replaceState) history.replaceState(null, '', '#' + pageId);

  // #24 Section progress — mark visited
  if (typeof _visitedPages !== 'undefined') {
    _visitedPages.add(pageId);
    _NAV_ALL.forEach(item => {
      item.classList.toggle('visited',
        _visitedPages.has(item.dataset.page) && item.dataset.page !== pageId);
    });
  }

  // Notify dock magnification & other listeners
  document.dispatchEvent(new CustomEvent('avo:pageShown', { detail: { pageId } }));
}

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => navigate(item.dataset.page));
});

// #5 URL hash — restore page on initial load (e.g. shared link or browser back)
document.addEventListener('DOMContentLoaded', () => {
  const h = location.hash.slice(1);
  if (h && document.getElementById('page-' + h)) navigate(h);
});

/* ── Feature Inits: Goals, Benchmarks, Modal, Compare, Customize ── */
document.addEventListener('DOMContentLoaded', () => {
  // #8 Goal rows — inject DOM then populate
  _injectGoalRows();

  // #11 Competitive benchmarks
  _injectBenchmarks();

  // #14 Metric modal — click handler on all metric cards
  document.addEventListener('click', e => {
    const card = e.target.closest('.metric-card[data-metric-key]');
    // Ignore clicks on edit handles, goal rows, benchmark rows
    if (!card) return;
    if (e.target.closest('.card-edit-btn, .metric-drag-handle, .goal-row, .benchmark-row')) return;
    if (document.body.classList.contains('edit-mode')) return;
    _openMetricModal(card);
  });

  // Modal close
  document.getElementById('metric-modal')?.addEventListener('click', e => {
    if (e.target === e.currentTarget || e.target.id === 'modal-close') _closeMetricModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') _closeMetricModal();
  });

  // #2 Comparison mode
  document.getElementById('btn-compare')?.addEventListener('click', _toggleComparison);

  // #18 Customization panel
  _initCustomizePanel();
  _applyCustomizeSettings();
  document.getElementById('btn-customize')?.addEventListener('click', _toggleCustomizePanel);
  document.getElementById('customize-overlay')?.addEventListener('click', _toggleCustomizePanel);
  document.getElementById('customize-close')?.addEventListener('click', _toggleCustomizePanel);
});

/* ── Present Mode ──────────────────────────────────────────────── */
const PRESENT_PAGES = ['overview', 'ads', 'seo', 'web'];
let presentIdx = 0;

/* Keyboard legend auto-hide --------------------------------------- */
const _kbdLegend = document.getElementById('present-kbd-legend');
let _legendHideTimer = null;

function showKbdLegend() {
  if (!document.body.classList.contains('present-mode') || !_kbdLegend) return;
  _kbdLegend.classList.remove('legend-hidden');
  clearTimeout(_legendHideTimer);
  _legendHideTimer = setTimeout(() => _kbdLegend?.classList.add('legend-hidden'), 5000);
}

// Throttled mousemove — requires ≥20px movement and 300ms gap to avoid over-triggering
let _lastMouseX = 0, _lastMouseY = 0, _mouseThrottle = 0;
document.addEventListener('mousemove', e => {
  const now = Date.now();
  const dx = e.clientX - _lastMouseX, dy = e.clientY - _lastMouseY;
  if (now - _mouseThrottle < 300 || (dx * dx + dy * dy) < 400) return;
  _mouseThrottle = now; _lastMouseX = e.clientX; _lastMouseY = e.clientY;
  showKbdLegend();
});
document.addEventListener('touchstart', showKbdLegend, { passive: true });

/* Section counter update ------------------------------------------ */
function updatePresentCounter() {
  const counter = document.getElementById('present-section-counter');
  if (counter) counter.textContent = `${presentIdx + 1} / ${PRESENT_PAGES.length}`;
}

function enterPresentMode() {
  const active = document.querySelector('.nav-item.active');
  if (active?.dataset?.page) {
    const idx = PRESENT_PAGES.indexOf(active.dataset.page);
    if (idx !== -1) presentIdx = idx;
  }
  navigate(PRESENT_PAGES[presentIdx]);
  updatePresentCounter();
  if (typeof closeDrpPanel === 'function') closeDrpPanel();
  document.body.classList.add('present-mode');
  // Show legend briefly on enter then auto-hide
  setTimeout(() => showKbdLegend(), 50);
  if (document.documentElement.requestFullscreen)
    document.documentElement.requestFullscreen().catch(() => {});
}

function exitPresentMode() {
  if (!document.body.classList.contains('present-mode')) return;
  document.body.classList.remove('present-mode');
  clearTimeout(_legendHideTimer);
  if (_kbdLegend) _kbdLegend.classList.add('legend-hidden');
  // Restore sidebar (remove collapsed if set)
  document.querySelector('.sidebar')?.classList.remove('collapsed');
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

// Handle browser-native fullscreen exit (Esc captured by browser before keydown)
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && document.body.classList.contains('present-mode')) {
    exitPresentMode();
  }
});

document.getElementById('btn-present').addEventListener('click', enterPresentMode);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { exitPresentMode(); return; }
  if (!document.body.classList.contains('present-mode')) return;
  showKbdLegend(); // any key shows legend briefly
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    if (presentIdx < PRESENT_PAGES.length - 1) {
      presentIdx++;
      navigate(PRESENT_PAGES[presentIdx]);
      updatePresentCounter();
    }
  }
  if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    if (presentIdx > 0) {
      presentIdx--;
      navigate(PRESENT_PAGES[presentIdx]);
      updatePresentCounter();
    }
  }
});

/* ── Edit / View Mode (Admin) ──────────────────────────────────── */
let isEditMode = false;
const editModeBtn = document.getElementById('btn-edit-mode');


const EDIT_BTN_EDIT = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit Mode`;
const EDIT_BTN_VIEW = `<svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> View Mode`;

function _showLayoutToast(msg) {
  let t = document.getElementById('avo-layout-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'avo-layout-toast';
    t.className = 'avo-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('visible');
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove('visible'), 2400);
}

editModeBtn?.addEventListener('click', () => {
  isEditMode = !isEditMode;
  document.body.classList.toggle('edit-mode', isEditMode);
  if (editModeBtn) {
    editModeBtn.innerHTML = isEditMode ? EDIT_BTN_VIEW : EDIT_BTN_EDIT;
    editModeBtn.title = isEditMode ? 'Switch to View Mode' : 'Switch to Edit Mode (Admin)';
    editModeBtn.classList.toggle('btn-view-mode', isEditMode);
  }
  // F1: Inject drag handles, resize handles + edit button when entering edit mode
  if (isEditMode) {
    document.querySelectorAll('.card, .metric-card, .insight-card, .funnel-card').forEach(el => {
      if (!el.querySelector('.drag-handle')) {
        const h = document.createElement('div');
        h.className = 'drag-handle';
        h.title = 'Drag to reorder / click to edit';
        el.insertBefore(h, el.firstChild);
      }
      if (!el.querySelector('.card-edit-btn')) {
        const btn = document.createElement('button');
        btn.className = 'card-edit-btn';
        btn.title = 'Edit card';
        btn.innerHTML = `<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
        el.appendChild(btn);
      }
      // Resize handle (only for metric cards — used by interact.js)
      if (el.classList.contains('metric-card') && !el.querySelector('.resize-handle')) {
        const rh = document.createElement('div');
        rh.className = 'resize-handle';
        rh.title = 'Drag to resize';
        rh.innerHTML = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 8 L8 2 M5 8 L8 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>`;
        el.appendChild(rh);
      }
    });
    // Switch metric-grids to free (absolute) layout
    document.querySelectorAll('.grid').forEach(grid => {
      if (typeof window.enterFreeLayout === 'function') window.enterFreeLayout(grid);
    });
    // Inject edit-mode toolbar (auto-arrange + undo hint)
    if (!document.getElementById('edit-mode-toolbar')) {
      const toolbar = document.createElement('div');
      toolbar.id = 'edit-mode-toolbar';
      toolbar.className = 'edit-mode-toolbar';
      const isPinned = localStorage.getItem('avo_layout_pinned_v1') === '1';
      toolbar.innerHTML = `
        <button class="emt-btn emt-btn-primary" id="btn-layout-studio" title="Layout templates &amp; report configurator">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
          Layout Studio
        </button>
        <div class="emt-divider"></div>
        <button class="emt-btn" id="btn-auto-arrange" title="Auto-arrange cards in a clean grid">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Auto Arrange
        </button>
        <button class="emt-btn" id="btn-undo-layout" title="Undo last move/resize (Ctrl+Z)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>
          </svg>
          Undo
        </button>
        <div class="emt-divider"></div>
        <button class="emt-btn emt-btn-add-card" id="btn-add-card" title="Tambah metric card baru ke halaman ini">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Tambah Card
        </button>
        <div class="emt-divider"></div>
        <button class="emt-btn emt-btn-save" id="btn-save-layout" title="Simpan layout — posisi kartu akan tetap di mode view">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
          </svg>
          Simpan Layout
        </button>
        ${isPinned ? `<button class="emt-btn emt-btn-reset" id="btn-reset-layout" title="Hapus layout tersimpan, kembali ke grid otomatis">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/>
          </svg>
          Reset Layout
        </button>` : ''}
        <span class="emt-hint">Drag ⠿ · Resize pojok · Snap ke tepi</span>`;
      // Insert directly after the sticky header so it flows naturally below it
      const header = document.querySelector('.header');
      if (header?.parentElement) {
        header.parentElement.insertBefore(toolbar, header.nextSibling);
      } else {
        document.body.appendChild(toolbar);
      }
      document.getElementById('btn-layout-studio')?.addEventListener('click', () => {
        if (typeof window.openLayoutStudio === 'function') window.openLayoutStudio();
      });
      document.getElementById('btn-auto-arrange')?.addEventListener('click', () => {
        if (typeof window.autoArrangeLayout === 'function') window.autoArrangeLayout();
      });
      document.getElementById('btn-add-card')?.addEventListener('click', () => {
        const activePage = document.querySelector('.page.active')?.id?.replace('page-', '');
        if (activePage) addCardToPage(activePage);
        else _showLayoutToast('Tidak ada halaman aktif');
      });
      document.getElementById('btn-undo-layout')?.addEventListener('click', () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
      });
      document.getElementById('btn-save-layout')?.addEventListener('click', () => {
        // Save current positions + set pinned flag
        window._saveLayout?.();
        localStorage.setItem('avo_layout_pinned_v1', '1');
        // Show confirmation toast
        _showLayoutToast('✓ Layout tersimpan — posisi dijaga di mode view');
        // Exit edit mode (exitFreeLayout will see the pinned flag and keep positions)
        editModeBtn?.click();
      });
      document.getElementById('btn-reset-layout')?.addEventListener('click', () => {
        if (typeof window.clearPinnedLayout === 'function') window.clearPinnedLayout();
        // Also clear positions from free-layout (auto-arrange style)
        _showLayoutToast('Layout direset ke grid otomatis');
        editModeBtn?.click();
      });
    }
    // Editable banner titles — make contenteditable in edit mode
    _initEditableBannerTitles();

  } else {
    // Lock banner titles back to read-only
    document.querySelectorAll('.banner-title[contenteditable]').forEach(el => {
      el.removeAttribute('contenteditable');
      el.title = '';
    });
    // Exit free layout before removing decorators
    document.querySelectorAll('.grid').forEach(grid => {
      if (typeof window.exitFreeLayout === 'function') window.exitFreeLayout(grid);
    });
    // Remove edit buttons when leaving edit mode
    document.querySelectorAll('.card-edit-btn').forEach(b => b.remove());
    document.querySelectorAll('.drag-handle').forEach(h => h.remove());
    document.querySelectorAll('.resize-handle').forEach(h => h.remove());
    document.getElementById('edit-mode-toolbar')?.remove();
    // Restore cards hidden by Layout Studio — but ONLY if layout is NOT pinned
    // (when pinned, hidden cards should stay hidden in view mode)
    if (localStorage.getItem('avo_layout_pinned_v1') !== '1') {
      document.querySelectorAll('.metric-card[data-ls-hidden]').forEach(c => {
        c.style.display = '';
        delete c.dataset.lsHidden;
      });
      document.querySelectorAll('.ls-show-all').forEach(el => el.remove());
    }
  }
});

/* ── Date Range Picker — Liquid Glass ──────────────────────────── */
const drpPanel   = document.getElementById('drp-panel');
const drpDaysEl  = document.getElementById('drp-days');
const drpTitle   = document.getElementById('drp-cal-title');
const drpSelLbl  = document.getElementById('drp-sel-label');

let activeDrpBtn    = null;
let drpCalYear      = new Date().getFullYear();
let drpCalMonth     = new Date().getMonth(); // 0-indexed, reflects real current month
let drpStart        = null; // Date
let drpEnd          = null; // Date
let drpSelecting    = false;
let _drpJustOpened  = false; // guard: prevents document click from immediately closing

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Period order for prev/next navigation — populated dynamically by Supabase init (oldest → newest)
let ORDERED_PERIODS_MAP = ['jan-2025','feb-2025','mar-2025'];

// Compute preset date ranges relative to the latest available data date
function getPresetRange(range) {
  const ref = new Date(); // always use real today for date calculations
  const d = n => new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + n);
  const startOfWeek  = dt => { const d2 = new Date(dt); d2.setDate(d2.getDate() - d2.getDay()); return d2; };
  const startOfMonth = dt => new Date(dt.getFullYear(), dt.getMonth(), 1);
  const endOfMonth   = dt => new Date(dt.getFullYear(), dt.getMonth() + 1, 0);
  const fmt = dt => `${dt.getDate()} ${MONTHS_SHORT[dt.getMonth()]} ${dt.getFullYear()}`;

  // Compute period key from a date (matches buildPeriods() key format)
  const toPeriodKey = dt =>
    `${MONTHS_SHORT[dt.getMonth()].toLowerCase()}-${dt.getFullYear()}`;
  // Find the closest available period key (latest available period not after target)
  const nearestPeriod = dt => {
    const target = toPeriodKey(dt);
    if (ORDERED_PERIODS_MAP.includes(target)) return target;
    // Walk backwards to find a matching period
    const sorted = [...ORDERED_PERIODS_MAP].sort();
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i] <= target) return sorted[i];
    }
    return ORDERED_PERIODS_MAP[ORDERED_PERIODS_MAP.length - 1] || target;
  };

  let start, end, label;
  let periodKey = nearestPeriod(ref);

  switch (range) {
    case 'today':
      start = d(0); end = d(0);
      label = `Today · ${fmt(start)}`;
      periodKey = nearestPeriod(start);
      break;
    case 'yesterday':
      start = d(-1); end = d(-1);
      label = `Yesterday · ${fmt(start)}`;
      periodKey = nearestPeriod(start);
      break;
    case 'this-week':
      start = startOfWeek(ref); end = d(0);
      label = `This week · ${fmt(start)} – ${fmt(end)}`;
      periodKey = nearestPeriod(ref);
      break;
    case 'this-month':
      start = startOfMonth(ref); end = d(0);
      label = `This month · ${MONTHS_SHORT[ref.getMonth()]} ${ref.getFullYear()}`;
      periodKey = toPeriodKey(ref);
      break;
    case '7d':
      start = d(-6); end = d(0);
      label = `Last 7 days · ${fmt(start)} – ${fmt(end)}`;
      periodKey = nearestPeriod(ref);
      break;
    case 'last-week': {
      const lws = startOfWeek(d(-7));
      const lwe = new Date(lws); lwe.setDate(lws.getDate() + 6);
      start = lws; end = lwe;
      label = `Last week · ${fmt(start)} – ${fmt(end)}`;
      periodKey = nearestPeriod(lwe);
      break;
    }
    case 'last-month': {
      const lm = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
      start = lm; end = endOfMonth(lm);
      label = `Last month · ${MONTHS_SHORT[lm.getMonth()]} ${lm.getFullYear()}`;
      periodKey = toPeriodKey(lm);
      break;
    }
    case '30d':
      start = d(-29); end = d(0);
      label = `Last 30 days · ${fmt(start)} – ${fmt(end)}`;
      periodKey = nearestPeriod(d(-15));
      break;
    case '60d':
      start = d(-59); end = d(0);
      label = `Last 60 days · ${fmt(start)} – ${fmt(end)}`;
      periodKey = nearestPeriod(d(-30));
      break;
    case '90d':
      start = d(-89); end = d(0);
      label = `Last 90 days · ${fmt(start)} – ${fmt(end)}`;
      periodKey = nearestPeriod(d(-45));
      break;
    default:
      return null;
  }
  return { start, end, label, periodKey };
}

// Get CSS zoom on html to fix getBoundingClientRect positioning
function getCssZoom() {
  const z = parseFloat(getComputedStyle(document.documentElement).zoom);
  return isNaN(z) ? 1 : z;
}

function positionDrpPanel(btn) {
  const zoom = getCssZoom();
  const rect = btn.getBoundingClientRect(); // physical px
  const panelW_phys = drpPanel.offsetWidth * zoom;   // CSS px → physical px
  const vw = window.innerWidth; // physical px
  const margin = 10;

  // Center the panel below the button
  const top_phys = rect.bottom + 8;
  const btnCenterX = (rect.left + rect.right) / 2;
  let left_phys = btnCenterX - panelW_phys / 2;

  // Clamp so panel stays within viewport
  if (left_phys < margin) left_phys = margin;
  if (left_phys + panelW_phys > vw - margin) left_phys = vw - panelW_phys - margin;

  drpPanel.style.top  = (top_phys  / zoom) + 'px';
  drpPanel.style.left = (left_phys / zoom) + 'px';
}

function openDrpPanel(btn) {
  activeDrpBtn = btn;
  positionDrpPanel(btn);
  renderCalendar();
  syncCustomInputs(); // populate inputs when panel opens
  drpPanel.classList.add('open');
  btn.classList.add('active');
  _drpJustOpened = true;
  // clear the guard after this event has fully propagated
  setTimeout(() => { _drpJustOpened = false; }, 0);
}

function closeDrpPanel() {
  drpPanel.classList.remove('open');
  drpSelecting = false;
  if (activeDrpBtn) { activeDrpBtn.classList.remove('active'); activeDrpBtn = null; }
}

function updateAllDateLabels(label) {
  ['overview','ads','seo','web'].forEach(page => {
    const el = document.getElementById(`banner-date-${page}`);
    if (el) el.textContent = label;
  });
}

// ── Calendar renderer — builds DOM once, never rebuilds on hover ─
function renderCalendar(tempEnd) {
  drpTitle.textContent = `${MONTHS[drpCalMonth]} ${drpCalYear}`;
  drpDaysEl.innerHTML = '';
  const firstDay   = new Date(drpCalYear, drpCalMonth, 1).getDay();
  const daysInMonth = new Date(drpCalYear, drpCalMonth + 1, 0).getDate();
  const today = new Date();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'drp-day drp-day-empty';
    drpDaysEl.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(drpCalYear, drpCalMonth, d);
    const cell = document.createElement('div');
    cell.className = 'drp-day';
    cell.textContent = d;
    cell.dataset.ts = date.getTime(); // store timestamp for class updates

    if (date.toDateString() === today.toDateString()) cell.classList.add('drp-day-today');

    // Future dates — disabled: no click, no hover, greyed out
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (date > todayMidnight) {
      cell.classList.add('drp-day-disabled');
    } else {
      // Attach click — uses closure over stable `date`
      cell.addEventListener('click', ev => { ev.stopPropagation(); onDayClick(date); });
      // Hover updates classes in-place (no DOM rebuild)
      cell.addEventListener('mouseenter', () => onDayHover(date));
    }
    drpDaysEl.appendChild(cell);
  }

  applyRangeClasses(tempEnd || drpEnd);
  updateSelLabel();
  // NOTE: syncCustomInputs() is NOT called here intentionally.
  // It must be called explicitly from calendar interactions (not from text input changes),
  // otherwise renderCalendar overwrites whatever the user is typing.
}

// Update only CSS classes on existing cells — no DOM rebuild
function applyRangeClasses(endDate) {
  const cells = drpDaysEl.querySelectorAll('.drp-day:not(.drp-day-empty)');
  const s = drpStart ? drpStart.getTime() : null;
  const e = endDate   ? endDate.getTime()  : null;
  const lo = (s && e) ? Math.min(s, e) : s;
  const hi = (s && e) ? Math.max(s, e) : s;

  cells.forEach(cell => {
    cell.classList.remove('drp-day-start','drp-day-end','drp-day-in-range');
    if (!s) return;
    const t = parseInt(cell.dataset.ts);
    if (lo && hi) {
      if (t === lo && t === hi)  { cell.classList.add('drp-day-start','drp-day-end'); }
      else if (t === lo)         { cell.classList.add('drp-day-start'); }
      else if (t === hi)         { cell.classList.add('drp-day-end'); }
      else if (t > lo && t < hi) { cell.classList.add('drp-day-in-range'); }
    } else if (t === s) {
      cell.classList.add('drp-day-start','drp-day-end');
    }
  });
}

function onDayClick(date) {
  if (!drpSelecting || !drpStart) {
    drpStart = date;
    drpEnd   = null;
    drpSelecting = true;
    applyRangeClasses(null);
    updateSelLabel();
    syncCustomInputs();
  } else {
    // Finalize — swap if needed
    if (date < drpStart) { drpEnd = drpStart; drpStart = date; }
    else drpEnd = date;
    drpSelecting = false;
    document.querySelectorAll('.drp-preset').forEach(b => b.classList.remove('active'));
    document.querySelector('.drp-preset[data-range="custom"]')?.classList.add('active');
    applyRangeClasses(drpEnd);
    updateSelLabel();
    syncCustomInputs();
  }
}

function onDayHover(date) {
  if (!drpSelecting || !drpStart) return;
  // Update classes in-place — NO DOM rebuild, so clicks always work
  const preview = date.getTime() < drpStart.getTime() ? drpStart : date;
  applyRangeClasses(preview);
  // Update label preview
  const fmt = d => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  const lo = drpStart < preview ? drpStart : preview;
  const hi = drpStart < preview ? preview  : drpStart;
  drpSelLbl.textContent = lo.getTime() === hi.getTime() ? fmt(lo) + ' → Select end' : `${fmt(lo)} – ${fmt(hi)}`;
}

function updateSelLabel() {
  const fmt = d => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  if (!drpStart)  { drpSelLbl.textContent = 'Select start date'; return; }
  if (drpSelecting) { drpSelLbl.textContent = fmt(drpStart) + ' → Select end date'; return; }
  if (!drpEnd || drpStart.getTime() === drpEnd.getTime()) {
    drpSelLbl.textContent = fmt(drpStart);
  } else {
    drpSelLbl.textContent = `${fmt(drpStart)} – ${fmt(drpEnd)}`;
  }
}

// ── Custom date inputs ────────────────────────────────────────────
function syncCustomInputs() {
  const pad2 = n => String(n).padStart(2,'0');
  if (drpStart) {
    document.getElementById('drp-from-d').value = pad2(drpStart.getDate());
    document.getElementById('drp-from-m').value = pad2(drpStart.getMonth()+1);
    document.getElementById('drp-from-y').value = drpStart.getFullYear();
  } else {
    ['drp-from-d','drp-from-m','drp-from-y'].forEach(id => document.getElementById(id).value = '');
  }
  if (drpEnd) {
    document.getElementById('drp-to-d').value = pad2(drpEnd.getDate());
    document.getElementById('drp-to-m').value = pad2(drpEnd.getMonth()+1);
    document.getElementById('drp-to-y').value = drpEnd.getFullYear();
  } else {
    ['drp-to-d','drp-to-m','drp-to-y'].forEach(id => document.getElementById(id).value = '');
  }
}

function readCustomInputDate(prefix) {
  const d = parseInt(document.getElementById(`drp-${prefix}-d`).value);
  const m = parseInt(document.getElementById(`drp-${prefix}-m`).value);
  const y = parseInt(document.getElementById(`drp-${prefix}-y`).value);
  if (!d || !m || !y || y < 1900 || y > 2100) return null;
  const date = new Date(y, m-1, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

function onCustomInputChange() {
  const fD = document.getElementById('drp-from-d').value.trim();
  const fM = document.getElementById('drp-from-m').value.trim();
  const fY = document.getElementById('drp-from-y').value.trim();
  const tD = document.getElementById('drp-to-d').value.trim();
  const tM = document.getElementById('drp-to-m').value.trim();
  const tY = document.getElementById('drp-to-y').value.trim();

  let changed = false;

  // FROM — act only when all 3 fields are complete OR all are empty (never on partial)
  const fromEmpty = !fD && !fM && !fY;
  const fromFull  = fD.length === 2 && fM.length === 2 && fY.length === 4;
  if (fromEmpty) {
    if (drpStart) { drpStart = null; drpSelecting = false; changed = true; }
  } else if (fromFull) {
    const from = readCustomInputDate('from');
    if (from && (!drpStart || from.getTime() !== drpStart.getTime())) {
      drpStart = from; drpSelecting = false;
      drpCalMonth = from.getMonth(); drpCalYear = from.getFullYear();
      changed = true;
    }
  }

  // TO — same logic
  const toEmpty = !tD && !tM && !tY;
  const toFull  = tD.length === 2 && tM.length === 2 && tY.length === 4;
  if (toEmpty) {
    if (drpEnd) { drpEnd = null; changed = true; }
  } else if (toFull) {
    const to = readCustomInputDate('to');
    if (to && (!drpEnd || to.getTime() !== drpEnd.getTime())) {
      drpEnd = to; changed = true;
    }
  }

  if (changed) {
    document.querySelectorAll('.drp-preset').forEach(b => b.classList.remove('active'));
    document.querySelector('.drp-preset[data-range="custom"]')?.classList.add('active');
    renderCalendar(); // safe — no longer calls syncCustomInputs
  }
}

// Input listeners — auto-advance on 2 chars; Backspace on empty field → go to previous field
['drp-from-d','drp-from-m','drp-to-d','drp-to-m'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', e => {
    e.stopPropagation();
    if (e.target.value.length === 2) {
      const next = e.target.nextElementSibling?.nextElementSibling;
      if (next && next.classList.contains('drp-dmy-input')) next.focus();
    }
    onCustomInputChange();
  });
  el.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && e.target.value === '') {
      e.preventDefault();
      const prev = e.target.previousElementSibling?.previousElementSibling;
      if (prev && prev.classList.contains('drp-dmy-input')) {
        prev.focus(); prev.select();
      }
    }
  });
});
['drp-from-y','drp-to-y'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', e => {
    e.stopPropagation();
    onCustomInputChange();
  });
  el.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && e.target.value === '') {
      e.preventDefault();
      const prev = e.target.previousElementSibling?.previousElementSibling;
      if (prev && prev.classList.contains('drp-dmy-input')) {
        prev.focus(); prev.select();
      }
    }
  });
});
// Prevent input clicks from closing panel
document.querySelectorAll('.drp-dmy-input').forEach(inp => {
  inp.addEventListener('click', e => e.stopPropagation());
});

// ── Calendar prev/next ───────────────────────────────────────────
document.getElementById('drp-cal-prev')?.addEventListener('click', e => {
  e.stopPropagation();
  drpCalMonth--;
  if (drpCalMonth < 0) { drpCalMonth = 11; drpCalYear--; }
  renderCalendar();
});
document.getElementById('drp-cal-next')?.addEventListener('click', e => {
  e.stopPropagation();
  drpCalMonth++;
  if (drpCalMonth > 11) { drpCalMonth = 0; drpCalYear++; }
  renderCalendar();
});

// ── Quick presets ────────────────────────────────────────────────
document.querySelectorAll('.drp-preset').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const range = btn.dataset.range;
    if (!range) return; // divider or non-button
    document.querySelectorAll('.drp-preset').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (range === 'custom') {
      // Keep panel open — user picks manually on calendar
      drpStart = null; drpEnd = null; drpSelecting = false;
      renderCalendar();
      syncCustomInputs(); // clear inputs
      return;
    }

    const preset = getPresetRange(range);
    if (preset) {
      drpStart = preset.start;
      drpEnd   = preset.end;
      drpSelecting = false;
      // Re-aggregate Supabase rows for the exact date range
      if (typeof window.avoApplyDateRange === 'function') {
        window.avoApplyDateRange(preset.start, preset.end, preset.label);
      } else {
        applyPeriod(preset.periodKey);
        updateAllDateLabels(preset.label);
      }
      // Jump calendar to the start month
      drpCalMonth = preset.start.getMonth();
      drpCalYear  = preset.start.getFullYear();
    }
    // Close immediately for quick presets (no Apply needed)
    closeDrpPanel();
  });
});

// ── Apply logic (shared by button click and Enter key) ───────────
function applyCustomRange() {
  if (!drpStart) return;
  const fmt = d => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  const end   = drpEnd && drpEnd.getTime() !== drpStart.getTime() ? drpEnd : drpStart;
  const label = drpStart.getTime() === end.getTime()
    ? fmt(drpStart)
    : `${fmt(drpStart)} – ${fmt(end)}`;

  // Route through avoApplyDateRange which re-aggregates raw Supabase rows
  if (typeof window.avoApplyDateRange === 'function') {
    window.avoApplyDateRange(drpStart, end, label);
  }
  closeDrpPanel();
}

document.getElementById('drp-apply')?.addEventListener('click', applyCustomRange);

// Enter key anywhere inside the panel triggers Apply
drpPanel.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); applyCustomRange(); }
});

// ── Banner date btn open/close ───────────────────────────────────
document.querySelectorAll('.banner-date-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    if (drpPanel.classList.contains('open') && activeDrpBtn === btn) {
      closeDrpPanel();
    } else {
      closeDrpPanel();
      openDrpPanel(btn);
    }
  });
});

document.addEventListener('click', e => {
  if (_drpJustOpened) return; // ignore the same click that opened the panel
  if (drpPanel && !drpPanel.contains(e.target) &&
      !e.target.closest('.banner-date-btn') &&
      !e.target.closest('.date-nav-arrow')) {
    closeDrpPanel();
  }
});

// ── Prev/Next month arrows on banner ────────────────────────────
function shiftPeriod(direction) {
  const idx = ORDERED_PERIODS_MAP.indexOf(currentPeriod);
  const next = ORDERED_PERIODS_MAP[idx + direction];
  if (next) applyPeriod(next);
}

['overview','ads','seo','web'].forEach(page => {
  document.getElementById(`date-prev-${page}`)?.addEventListener('click', e => {
    e.stopPropagation(); shiftPeriod(-1);
  });
  document.getElementById(`date-next-${page}`)?.addEventListener('click', e => {
    e.stopPropagation(); shiftPeriod(1);
  });
});

/* ── Export Dropdown ───────────────────────────────────────────── */
const exportBtn  = document.getElementById('btn-export');
const exportMenu = document.getElementById('export-menu');

exportBtn?.addEventListener('click', e => {
  e.stopPropagation();
  exportMenu.classList.toggle('open');
});
document.addEventListener('click', e => {
  if (exportMenu && !exportMenu.contains(e.target) && e.target !== exportBtn) {
    exportMenu.classList.remove('open');
  }
});

document.getElementById('export-all')?.addEventListener('click', () => {
  exportMenu.classList.remove('open');
  window.print();
});

document.getElementById('export-page')?.addEventListener('click', () => {
  exportMenu.classList.remove('open');
  // Show only current active page for print
  document.querySelectorAll('.page').forEach(p => {
    if (!p.classList.contains('active')) p.style.display = 'none';
  });
  window.print();
  document.querySelectorAll('.page').forEach(p => { p.style.display = ''; });
});

/* ── Chart Dimension Data (Daily / Weekly / Monthly) ──────────── */
const OVERVIEW_DIM = {
  daily: {
    labels: () => days(31),
    sessions: () => PERIOD_DATA['mar-2025'].charts['overview-trend'].sessions,
    spend:    () => PERIOD_DATA['mar-2025'].charts['overview-trend'].spend,
    yLabel:   v => v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v,
  },
  weekly: {
    // Aggregate daily → 5 weeks (Mon week labels)
    labels: () => ['W1 Mar', 'W2 Mar', 'W3 Mar', 'W4 Mar', 'W5 Mar'],
    sessions: () => {
      const d = PERIOD_DATA['mar-2025'].charts['overview-trend'].sessions;
      const chunks = [d.slice(0,7), d.slice(7,14), d.slice(14,21), d.slice(21,28), d.slice(28)];
      return chunks.map(c => Math.round(c.reduce((a, b) => a + b, 0)));
    },
    spend: () => {
      const d = PERIOD_DATA['mar-2025'].charts['overview-trend'].spend;
      const chunks = [d.slice(0,7), d.slice(7,14), d.slice(14,21), d.slice(21,28), d.slice(28)];
      return chunks.map(c => c.reduce((a, b) => a + b, 0));
    },
    yLabel: v => v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v,
  },
  monthly: {
    labels: () => ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    sessions: () => [52400, 55100, 57800, 58900, 59200, 61240],
    spend:    () => [39200000, 41800000, 43500000, 44100000, 45600000, 48500000],
    yLabel:   v => v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v,
  },
};

function applyOverviewDim(dim) {
  const chart = CHARTS.overviewTrend;
  if (!chart) return;
  const cfg = OVERVIEW_DIM[dim];
  chart.data.labels              = cfg.labels();
  chart.data.datasets[0].data   = cfg.sessions();
  chart.data.datasets[1].data   = cfg.spend();
  chart.options.scales.y.ticks.callback = cfg.yLabel;
  // Bars vs lines: for weekly/monthly use bars for spend with wider width
  chart.data.datasets[1].barPercentage = dim === 'daily' ? 0.6 : 0.8;
  chart.update();
}

/* ── Tab Buttons + Fluid Indicator ────────────────────────────── */
function _updateTabIndicator(tabs) {
  let indicator = tabs.querySelector('.tab-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'tab-indicator';
    tabs.style.position = 'relative';
    tabs.appendChild(indicator);
  }
  const active = tabs.querySelector('.tab-btn.active');
  if (!active) return;
  const tabsRect = tabs.getBoundingClientRect();
  const btnRect  = active.getBoundingClientRect();
  indicator.style.left  = (btnRect.left - tabsRect.left) + 'px';
  indicator.style.width = btnRect.width + 'px';
}

document.querySelectorAll('.tabs').forEach(tabs => {
  // Init indicator on first active tab
  requestAnimationFrame(() => _updateTabIndicator(tabs));

  tabs.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _updateTabIndicator(tabs);
      // Overview trend dimension tabs
      if (tabs.id === 'overview-trend-tabs' && btn.dataset.dim) {
        applyOverviewDim(btn.dataset.dim);
      }
    });
  });
});

/* ══════════════════════════════════════════════════════════════
   CHARTS — Lazy Initialization (B1/B2/B3)
   ══════════════════════════════════════════════════════════════ */

const _initializedPages = new Set();

function _destroyPageCharts(pageId) {
  (PAGE_CHARTS[pageId] || []).forEach(k => {
    if (CHARTS[k]) { CHARTS[k].destroy(); delete CHARTS[k]; }
  });
}

/* ── Named chart init functions (use currentPeriod) ──────────── */
function _initOverviewTrend() {
  const el = document.getElementById('chart-overview-trend');
  if (!el) return;
  if (Object.keys(chartColumnSettings['overview-trend'] || {}).length && window._avoAllRows?.length) {
    _renderChartDynamic('overview-trend'); return;
  }
  const ctx = el.getContext('2d');
  const pd  = PERIOD_DATA[currentPeriod].charts['overview-trend'];
  const dsSessions = {
    type: 'line', label: 'Sessions', data: pd.sessions,
    borderColor: COLORS.teal, backgroundColor: areaGradient(ctx, COLORS.teal, 0.12),
    yAxisID: 'y', ...heroLine,
  };
  const dsSpend = {
    type: 'bar', label: 'Ad Spend (Rp)', data: pd.spend,
    backgroundColor: COLORS.yellow + '40', borderColor: COLORS.yellow,
    borderWidth: 0, borderRadius: 3, yAxisID: 'y1',
  };
  CHARTS.overviewTrend = new Chart(ctx, {
    type: 'bar',
    data: { labels: days(pd.sessions.length), datasets: [dsSessions, dsSpend] },
    options: {
      ...sharedOpts,
      scales: {
        x:  { ...sharedScales.x, offset: false, ticks: { ...sharedScales.x.ticks, maxTicksLimit: 10 } },
        y:  { ...sharedScales.y, position: 'left', ticks: { ...sharedScales.y.ticks, callback: v => v >= 1000 ? (v/1000).toFixed(0)+'K' : v } },
        y1: { ...sharedScales.y, position: 'right', grid: { drawOnChartArea: false },
              ticks: { ...sharedScales.y.ticks, callback: v => rupiah(v), maxTicksLimit: 5 },
              afterFit(s) { if (s.width < 130) s.width = 130; } },
      },
      plugins: { ...sharedOpts.plugins, chartAnnotations: [{ idx: 7, label: 'Campaign launch' }, { idx: 21, label: 'Budget +20%' }] },
    },
  });
  renderLegend('legend-overview-trend', [dsSessions, dsSpend]);
}

function _initChannelDonut() {
  const el = document.getElementById('chart-channel-donut');
  if (!el) return;
  const ex = PERIOD_DATA[currentPeriod].extras;
  const data   = ex?.channelDonut  || [45,30,14,7,4];
  const center = ex?.channelCenter || { value: '61.2K', label: 'Sessions' };
  CHARTS.channelDonut = new Chart(el.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Paid Ads','Organic','Direct','Referral','Social'],
      datasets: [{ data, backgroundColor: [COLORS.yellow,COLORS.teal,COLORS.navy,'#8B9CF4','#F472B6'], borderWidth: 2, borderColor: 'rgba(255,255,255,0.05)', hoverOffset: 6 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      animation: { animateRotate: true, animateScale: false, duration: 1200, easing: 'easeOutCubic' },
      plugins: { legend: { display: false }, tooltip: tooltipConfig, centerLabel: center },
    },
  });
}

function _initAdsTrend() {
  const el = document.getElementById('chart-ads-trend');
  if (!el) return;
  if (Object.keys(chartColumnSettings['ads-trend'] || {}).length && window._avoAllRows?.length) {
    _renderChartDynamic('ads-trend'); return;
  }
  const ctx = el.getContext('2d');
  const pd  = PERIOD_DATA[currentPeriod].charts['ads-trend'];
  const dsRevenue = {
    label: 'Revenue (Rp)', data: pd.revenue,
    borderColor: COLORS.teal, backgroundColor: areaGradient(ctx, COLORS.teal, 0.12), ...heroLine,
  };
  const dsSpend = {
    label: 'Spend (Rp)', data: pd.spend,
    borderColor: COLORS.yellow, backgroundColor: areaGradient(ctx, COLORS.yellow, 0.07), ...suppLine,
  };
  CHARTS.adsTrend = new Chart(ctx, {
    type: 'line',
    data: { labels: days(pd.revenue.length), datasets: [dsRevenue, dsSpend] },
    options: {
      ...sharedOpts,
      scales: {
        x: { ...sharedScales.x, ticks: { ...sharedScales.x.ticks, maxTicksLimit: 8 } },
        y: { ...sharedScales.y,
             ticks: { ...sharedScales.y.ticks, callback: v => rupiah(v * 1000000), maxTicksLimit: 5 },
             afterFit(s) { if (s.width < 130) s.width = 130; } },
      },
    },
  });
  renderLegend('legend-ads-trend', [dsRevenue, dsSpend]);
}

function _initAdsPlatform() {
  const el = document.getElementById('chart-ads-platform');
  if (!el) return;
  const pd = PERIOD_DATA[currentPeriod].charts['ads-platform'];
  CHARTS.adsPlatform = new Chart(el.getContext('2d'), {
    type: 'bar',
    data: {
      labels: months(6),
      datasets: [
        { label: 'Google Ads', data: pd.google, backgroundColor: '#4285F4', borderRadius: 4, borderSkipped: false },
        { label: 'Meta Ads',   data: pd.meta,   backgroundColor: '#1877F2BB', borderRadius: 4, borderSkipped: false },
      ],
    },
    options: {
      ...sharedOpts,
      animation: {
        y: { from: (ctx) => ctx.chart.scales.y?.getPixelForValue(0) || ctx.chart.height, duration: 900, easing: 'easeOutCubic', delay: (ctx) => ctx.dataIndex * 45 }
      },
      scales: {
        x: sharedScales.x,
        y: { ...sharedScales.y,
             ticks: { ...sharedScales.y.ticks, callback: v => rupiah(v * 1000000), maxTicksLimit: 5 },
             afterFit(s) { if (s.width < 130) s.width = 130; } },
      },
    },
  });
}

function _initSeoTrend() {
  const el = document.getElementById('chart-seo-trend');
  if (!el) return;
  // If GSC rows are loaded and chart has been configured, use dynamic GSC rendering
  if (Object.keys(chartColumnSettings['seo-trend'] || {}).length && window._gscAllRows?.length) {
    _renderSeoChartDynamic(); return;
  }
  // Also use dynamic if GSC rows exist (even with default settings)
  if (window._gscAllRows?.length) {
    _renderSeoChartDynamic(); return;
  }
  // Fallback: static data from PERIOD_DATA
  const ctx = el.getContext('2d');
  const pd  = PERIOD_DATA[currentPeriod].charts['seo-trend'];
  const dsSessions = {
    label: 'Organic Clicks', data: pd.sessions,
    borderColor: COLORS.teal, backgroundColor: areaGradient(ctx, COLORS.teal, 0.12),
    yAxisID: 'y', ...heroLine,
  };
  const dsImpressions = {
    label: 'Impressions', data: pd.impressions,
    borderColor: COLORS.orange, backgroundColor: areaGradient(ctx, COLORS.orange, 0.07),
    yAxisID: 'y1', ...suppLine,
  };
  CHARTS.seoTrend = new Chart(ctx, {
    type: 'line',
    data: { labels: months(6), datasets: [dsSessions, dsImpressions] },
    options: {
      ...sharedOpts,
      scales: {
        x:  sharedScales.x,
        y:  { ...sharedScales.y, position: 'left', ticks: { ...sharedScales.y.ticks, callback: v => (v/1000).toFixed(0)+'K' } },
        y1: { ...sharedScales.y, position: 'right', grid: { drawOnChartArea: false }, ticks: { ...sharedScales.y.ticks, callback: v => (v/1000).toFixed(0)+'K' } },
      },
    },
  });
  renderLegend('legend-seo-trend', [dsSessions, dsImpressions]);
}

/* ── Render SEO trend chart dynamically from _gscAllRows ─────── */
function _renderSeoChartDynamic() {
  const def  = CHART_DEFS['seo-trend'];
  const rows = window._gscAllRows;
  if (!def || !rows?.length) return;

  const settings  = chartColumnSettings['seo-trend'] || {};
  const metLabels = settings._metLabels || {};
  const dimId     = settings._dim || 'day';
  const dimDef    = def.dimensions.find(d => d.id === dimId) || def.dimensions[0];

  // Active metrics (max 2)
  const metIds  = (settings._metOrder?.length
    ? settings._metOrder
    : def.metrics.filter(m => m.defaultOn !== false).map(m => m.id)
  ).slice(0, 2);
  const selMets = metIds.map(id => def.metrics.find(m => m.id === id)).filter(Boolean);
  if (!selMets.length) return;

  // Group GSC rows by date dimension
  const groups = new Map();
  for (const row of rows) {
    const key = dimDef.group ? dimDef.group(row) : String(row[dimDef.field] || '').substring(0, 10);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, { _clicks: 0, _impressions: 0, _posW: 0, _imprW: 0 });
    const g    = groups.get(key);
    const impr = +row.impressions || 0;
    g._clicks      += +row.clicks  || 0;
    g._impressions += impr;
    g._posW        += (+row.position || 0) * impr;
    g._imprW       += impr;
  }

  const sorted  = [...groups.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  const labels  = sorted.map(([k]) => k);
  const PALETTE = ['#00C2B8','#F8B400','#818CF8','#34D399','#FB923C','#F472B6'];

  const fmtTick = (fmt, v) => {
    if (fmt === 'pct') return v.toFixed(1) + '%';
    if (v >= 1e6) return (v / 1e6).toFixed(1) + 'Jt';
    if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
    return Math.round(v).toLocaleString('id-ID');
  };

  const datasets = selMets.map((m, i) => ({
    label:           metLabels[m.id] || m.label,
    data:            sorted.map(([, g]) => m.compute(g)),
    borderColor:     m.color || PALETTE[i % PALETTE.length],
    backgroundColor: i === 0 ? (m.color || PALETTE[0]) + '1A' : 'transparent',
    borderWidth: 2,
    pointRadius: labels.length > 60 ? 0 : 3,
    tension: 0.4,
    fill: i === 0,
    yAxisID: i === 0 ? 'y' : 'y1',
    _fmt: m.fmt,
  }));

  // Destroy existing chart
  if (CHARTS.seoTrend) { CHARTS.seoTrend.destroy(); CHARTS.seoTrend = null; }

  const canvas = document.getElementById('chart-seo-trend');
  if (!canvas) return;

  const xMaxTicks = dimId === 'day' ? 8 : 12;
  const scales = {
    x: { ...sharedScales.x, ticks: { ...sharedScales.x.ticks, autoSkip: true, maxRotation: 0, maxTicksLimit: xMaxTicks } },
    y: { ...sharedScales.y, position: 'left',
         ticks: { ...sharedScales.y.ticks, maxTicksLimit: 5, callback: v => fmtTick(datasets[0]._fmt, v) },
         afterFit(s) { if (s.width < 72) s.width = 72; } },
  };
  if (selMets.length === 2) {
    scales.y1 = { ...sharedScales.y, position: 'right', grid: { drawOnChartArea: false },
                  ticks: { ...sharedScales.y.ticks, maxTicksLimit: 5, callback: v => fmtTick(datasets[1]._fmt, v) },
                  afterFit(s) { if (s.width < 72) s.width = 72; } };
  }

  CHARTS.seoTrend = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { labels, datasets },
    options: { ...sharedOpts, scales },
  });

  if (typeof renderLegend === 'function') renderLegend('legend-seo-trend', datasets);

  const countEl = document.getElementById('editor-chart-col-count');
  if (countEl) countEl.textContent = `${selMets.length} METRIK`;
}

function _initSeoRanking() {
  const el = document.getElementById('chart-seo-ranking');
  if (!el) return;
  const data = PERIOD_DATA[currentPeriod].extras?.seoRanking || [12,38,54,82,104];
  CHARTS.seoRanking = new Chart(el.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Top 3','Pos 4–10','Pos 11–20','Pos 21–50','Pos 50+'],
      datasets: [{ label: 'Keywords', data,
        backgroundColor: [COLORS.green,COLORS.teal,COLORS.navy,COLORS.orange+'CC',COLORS.gray],
        borderRadius: 6, borderSkipped: false }],
    },
    options: {
      ...sharedOpts,
      animation: {
        y: { from: (ctx) => ctx.chart.scales.y?.getPixelForValue(0) || ctx.chart.height, duration: 900, easing: 'easeOutCubic', delay: (ctx) => ctx.dataIndex * 45 }
      },
      scales: { x: sharedScales.x, y: sharedScales.y },
    },
  });
}

function _initWebDevice() {
  const el = document.getElementById('chart-web-device');
  if (!el) return;
  const ex = PERIOD_DATA[currentPeriod].extras;
  const data   = ex?.webDevice       || [62,32,6];
  const center = ex?.webDeviceCenter || { value: '62%', label: 'Mobile' };
  CHARTS.webDevice = new Chart(el.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Mobile','Desktop','Tablet'],
      datasets: [{ data, backgroundColor: [COLORS.navy,COLORS.teal,COLORS.yellow], borderWidth: 2, borderColor: 'rgba(255,255,255,0.05)', hoverOffset: 6 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      animation: { animateRotate: true, animateScale: false, duration: 1200, easing: 'easeOutCubic' },
      plugins: { legend: { display: false }, tooltip: tooltipConfig, centerLabel: center },
    },
  });
}

/* ── initChartsForPage — destroy + recreate per page ─────────── */
function initChartsForPage(pageId) {
  _destroyPageCharts(pageId);
  // E5: reset progressive line animation state (will be set fresh on new chart instances)
  if (pageId === 'overview') { _initOverviewTrend(); _initChannelDonut(); }
  else if (pageId === 'ads') { _initAdsTrend(); _initAdsPlatform(); }
  else if (pageId === 'seo') { _initSeoTrend(); _initSeoRanking(); }
  else if (pageId === 'web') { _initWebDevice(); }
  _initializedPages.add(pageId);
  // Re-apply comparison overlay after new charts are created
  if (typeof _comparisonActive !== 'undefined' && _comparisonActive) {
    _applyComparisonOverlay();
  }
}

/* ── Init ──────────────────────────────────────────────────────── */
renderSparklines();
renderPsiRings();
// Defer initial chart creation to after CSS layout resolves
setTimeout(() => initChartsForPage('overview'), 0);

/* ── Progress bar stagger on initial load ─────────────────────── */
document.querySelectorAll('.progress-fill').forEach((el, i) => {
  el.style.animationDelay = (i * 100) + 'ms';
});

/* ── Sidebar toggle (responsive) ─────────────────────────────── */
document.getElementById('btn-sidebar-toggle')?.addEventListener('click', () => {
  document.querySelector('.sidebar')?.classList.toggle('open');
});

/* ── Table scroll detection ──────────────────────────────────── */
document.querySelectorAll('.table-wrap').forEach(wrap => {
  const check = () => {
    const isScrollable = wrap.scrollWidth > wrap.clientWidth;
    const isScrolledToEnd = wrap.scrollLeft + wrap.clientWidth >= wrap.scrollWidth - 2;
    wrap.classList.toggle('scrollable', isScrollable && !isScrolledToEnd);
  };
  check();
  wrap.addEventListener('scroll', check);
  window.addEventListener('resize', check);
});

/* ══════════════════════════════════════════════════════════════
   FEATURE ADDITIONS v4
   ══════════════════════════════════════════════════════════════ */

/* ── #7 Health Scores ─────────────────────────────────────────── */
const HEALTH_SCORES = {
  'mar-2025': { overview:78, ads:65, seo:82, web:71 },
  'feb-2025': { overview:72, ads:60, seo:75, web:67 },
  'jan-2025': { overview:67, ads:55, seo:70, web:63 },
  'q1-2025':  { overview:81, ads:68, seo:84, web:74 },
  'q4-2024':  { overview:64, ads:57, seo:67, web:69 },
};

function healthStatus(score) {
  if (score >= 80) return ['excellent','Excellent'];
  if (score >= 60) return ['good','Good'];
  return ['needs-work','Needs Work'];
}

function applyHealthScores(periodKey) {
  const scores = HEALTH_SCORES[periodKey];
  if (!scores) return;
  ['overview','ads','seo','web'].forEach(page => {
    const fill   = document.getElementById(`health-fill-${page}`);
    const val    = document.getElementById(`health-val-${page}`);
    const status = document.getElementById(`health-status-${page}`);
    const score  = scores[page];
    if (fill)   { fill.style.width = score + '%'; }
    if (val)    { val.innerHTML = `${score} <span>/100</span>`; }
    if (status) {
      const [cls, label] = healthStatus(score);
      status.className = `health-score-status ${cls}`;
      status.textContent = label;
    }
  });
}

/* ── #8 Goal Tracking ─────────────────────────────────────────── */
const GOALS = {
  'mar-2025': {
    'ov-spend':    {pct:93,label:'93% of budget'},   'ov-traffic':  {pct:87,label:'87% of goal'},
    'ov-sessions': {pct:85,label:'85% of goal'},     'ov-conv':     {pct:92,label:'92% of target'},
    'ads-spend':   {pct:88,label:'88% of budget'},   'ads-clicks':  {pct:90,label:'90% of goal'},
    'ads-ctr':     {pct:86,label:'86% of target'},   'ads-roas':    {pct:77,label:'77% of 4x target'},
    'seo-sess':    {pct:89,label:'89% of goal'},     'seo-impr':    {pct:91,label:'91% of goal'},
    'seo-pos':     {pct:84,label:'84% toward top 5'},'seo-ctr':     {pct:87,label:'87% of target'},
    'web-sess':    {pct:85,label:'85% of goal'},     'web-users':   {pct:88,label:'88% of goal'},
    'web-bounce':  {pct:75,label:'75% to 50% target'},'web-dur':    {pct:89,label:'89% of 3m target'},
  },
  'feb-2025': {
    'ov-spend':    {pct:83,label:'83% of budget'},   'ov-traffic':  {pct:76,label:'76% of goal'},
    'ov-sessions': {pct:75,label:'75% of goal'},     'ov-conv':     {pct:75,label:'75% of target'},
    'ads-spend':   {pct:78,label:'78% of budget'},   'ads-clicks':  {pct:80,label:'80% of goal'},
    'ads-ctr':     {pct:75,label:'75% of target'},   'ads-roas':    {pct:70,label:'70% of 4x target'},
    'seo-sess':    {pct:79,label:'79% of goal'},     'seo-impr':    {pct:81,label:'81% of goal'},
    'seo-pos':     {pct:72,label:'72% toward top 5'},'seo-ctr':     {pct:77,label:'77% of target'},
    'web-sess':    {pct:75,label:'75% of goal'},     'web-users':   {pct:78,label:'78% of goal'},
    'web-bounce':  {pct:65,label:'65% to 50% target'},'web-dur':    {pct:79,label:'79% of 3m target'},
  },
  'jan-2025': {
    'ov-spend':    {pct:72,label:'72% of budget'},   'ov-traffic':  {pct:68,label:'68% of goal'},
    'ov-sessions': {pct:65,label:'65% of goal'},     'ov-conv':     {pct:62,label:'62% of target'},
    'ads-spend':   {pct:68,label:'68% of budget'},   'ads-clicks':  {pct:70,label:'70% of goal'},
    'ads-ctr':     {pct:63,label:'63% of target'},   'ads-roas':    {pct:58,label:'58% of 4x target'},
    'seo-sess':    {pct:68,label:'68% of goal'},     'seo-impr':    {pct:70,label:'70% of goal'},
    'seo-pos':     {pct:60,label:'60% toward top 5'},'seo-ctr':     {pct:67,label:'67% of target'},
    'web-sess':    {pct:65,label:'65% of goal'},     'web-users':   {pct:68,label:'68% of goal'},
    'web-bounce':  {pct:55,label:'55% to 50% target'},'web-dur':    {pct:69,label:'69% of 3m target'},
  },
  'q1-2025': {
    'ov-spend':    {pct:96,label:'96% of budget'},   'ov-traffic':  {pct:91,label:'91% of goal'},
    'ov-sessions': {pct:88,label:'88% of goal'},     'ov-conv':     {pct:94,label:'94% of target'},
    'ads-spend':   {pct:92,label:'92% of budget'},   'ads-clicks':  {pct:93,label:'93% of goal'},
    'ads-ctr':     {pct:88,label:'88% of target'},   'ads-roas':    {pct:82,label:'82% of 4x target'},
    'seo-sess':    {pct:92,label:'92% of goal'},     'seo-impr':    {pct:94,label:'94% of goal'},
    'seo-pos':     {pct:88,label:'88% toward top 5'},'seo-ctr':     {pct:91,label:'91% of target'},
    'web-sess':    {pct:88,label:'88% of goal'},     'web-users':   {pct:91,label:'91% of goal'},
    'web-bounce':  {pct:80,label:'80% to 50% target'},'web-dur':    {pct:92,label:'92% of 3m target'},
  },
  'q4-2024': {
    'ov-spend':    {pct:78,label:'78% of budget'},   'ov-traffic':  {pct:72,label:'72% of goal'},
    'ov-sessions': {pct:69,label:'69% of goal'},     'ov-conv':     {pct:71,label:'71% of target'},
    'ads-spend':   {pct:74,label:'74% of budget'},   'ads-clicks':  {pct:76,label:'76% of goal'},
    'ads-ctr':     {pct:71,label:'71% of target'},   'ads-roas':    {pct:65,label:'65% of 4x target'},
    'seo-sess':    {pct:74,label:'74% of goal'},     'seo-impr':    {pct:76,label:'76% of goal'},
    'seo-pos':     {pct:68,label:'68% toward top 5'},'seo-ctr':     {pct:73,label:'73% of target'},
    'web-sess':    {pct:69,label:'69% of goal'},     'web-users':   {pct:72,label:'72% of goal'},
    'web-bounce':  {pct:60,label:'60% to 50% target'},'web-dur':    {pct:74,label:'74% of 3m target'},
  },
};

function applyGoalBars(periodKey) {
  const goals = GOALS[periodKey];
  if (!goals) return;
  Object.entries(goals).forEach(([key, g]) => {
    const fill = document.getElementById(`goal-fill-${key}`);
    const lbl  = document.getElementById(`goal-lbl-${key}`);
    if (fill) fill.style.width = g.pct + '%';
    if (lbl)  lbl.textContent  = g.label;
  });
}

// Init on load
applyHealthScores('mar-2025');

/* ── #8 Goal Row DOM Injection ────────────────────────────────── */
function _injectGoalRows() {
  document.querySelectorAll('.metric-card[data-metric-key]').forEach(card => {
    if (card.querySelector('.goal-row')) return;
    const key = card.dataset.metricKey;
    const row = document.createElement('div');
    row.className = 'goal-row';
    row.innerHTML = `<div class="goal-track"><div class="goal-fill" id="goal-fill-${key}" style="width:0%"></div></div><span class="goal-label" id="goal-lbl-${key}">Loading...</span>`;
    const sparkline = card.querySelector('.metric-sparkline');
    const footer    = card.querySelector('.metric-footer');
    if (sparkline)      sparkline.after(row);
    else if (footer)    footer.before(row);
    else                card.appendChild(row);
  });
  applyGoalBars(typeof currentPeriod !== 'undefined' ? currentPeriod : 'mar-2025');
}

/* ── #11 Competitive Benchmarks ───────────────────────────────── */
const BENCHMARKS = {
  'ads-ctr':    { avg: 3.1,  unit: '%',  label: 'Industry avg 3.1%' },
  'ads-roas':   { avg: 3.5,  unit: 'x',  label: 'Industry avg 3.5x' },
  'seo-ctr':    { avg: 2.5,  unit: '%',  label: 'Industry avg 2.5%' },
  'web-bounce': { avg: 55,   unit: '%',  label: 'Industry avg 55%'  },
  'seo-pos':    { avg: 12,   unit: '',   label: 'Industry avg pos 12' },
};

function _injectBenchmarks() {
  Object.entries(BENCHMARKS).forEach(([key, b]) => {
    const card = document.querySelector(`.metric-card[data-metric-key="${key}"]`);
    if (!card || card.querySelector('.benchmark-row')) return;
    const footer = card.querySelector('.metric-footer');
    const row = document.createElement('div');
    row.className = 'benchmark-row';
    row.dataset.bmKey = key;
    row.innerHTML = `<span class="benchmark-label">${b.label}</span><span class="benchmark-diff" id="bm-diff-${key}"></span>`;
    if (footer) footer.before(row);
    else card.appendChild(row);
  });
  _updateBenchmarkDiffs();
}

function _updateBenchmarkDiffs() {
  Object.entries(BENCHMARKS).forEach(([key, b]) => {
    const diffEl = document.getElementById(`bm-diff-${key}`);
    if (!diffEl) return;
    const card  = document.querySelector(`.metric-card[data-metric-key="${key}"]`);
    const valEl = card?.querySelector('.metric-value');
    if (!valEl) return;
    const raw = parseFloat(valEl.textContent.replace(/[^0-9.]/g, ''));
    if (isNaN(raw)) return;
    const diff = +(raw - b.avg).toFixed(2);
    // Position metric: lower is better
    const isBetter = key === 'seo-pos' ? diff < 0 : diff > 0;
    const isBounce = key === 'web-bounce';
    const realBetter = isBounce ? diff < 0 : isBetter;
    const sign = diff > 0 ? '+' : '';
    diffEl.textContent = `${sign}${diff}${b.unit}`;
    diffEl.className = 'benchmark-diff ' + (realBetter ? 'above' : 'below');
  });
}

/* ── #14 Metric Card Click Modal ──────────────────────────────── */
let _modalChart = null;

function _openMetricModal(card) {
  const modal  = document.getElementById('metric-modal');
  const title  = document.getElementById('modal-title');
  const canvas = document.getElementById('modal-chart');
  const stats  = document.getElementById('modal-stats');
  if (!modal) return;

  const key    = card.dataset.metricKey;
  const label  = card.querySelector('.metric-label')?.textContent || key;
  const value  = card.querySelector('.metric-value')?.textContent || '—';
  const change = card.querySelector('.metric-change')?.textContent || '—';
  const spkEl  = card.querySelector('.metric-sparkline');
  const vals   = spkEl?.dataset.values?.split(',').map(Number) || [];
  const color  = spkEl?.dataset.color || '#00C2B8';

  if (title) title.textContent = label;
  if (stats) stats.innerHTML = `<span class="modal-stat-val">${value}</span><span class="modal-stat-chg ${change.includes('▲')?'up':'down'}">${change}</span>`;

  // Destroy previous chart
  if (_modalChart) { _modalChart.destroy(); _modalChart = null; }

  if (canvas && vals.length) {
    const ctx = canvas.getContext('2d');
    _modalChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: vals.map((_, i) => i + 1),
        datasets: [{
          data: vals,
          borderColor: color,
          backgroundColor: color + '22',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: color,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { display: true, grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } } }
        }
      }
    });
  }

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function _closeMetricModal() {
  const modal = document.getElementById('metric-modal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── #2 Comparison Mode ───────────────────────────────────────── */
let _comparisonActive = false;
const _PREV_PERIOD = {
  'mar-2025': 'feb-2025', 'feb-2025': 'jan-2025',
  'jan-2025': 'q4-2024',  'q1-2025':  'q4-2024',
  'q4-2024':  'q4-2024',
};

function _toggleComparison() {
  _comparisonActive = !_comparisonActive;
  const btn = document.getElementById('btn-compare');
  if (btn) btn.classList.toggle('active', _comparisonActive);
  _applyComparisonOverlay();
}

function _applyComparisonOverlay() {
  const prevKey = _PREV_PERIOD[currentPeriod] || currentPeriod;
  const prevData = PERIOD_DATA[prevKey];

  // Map chartId → dataset key pairs to show as comparison
  const chartCompMap = {
    overviewTrend: ['sessions', 'spend'],
    adsTrend:      ['spend', 'revenue'],
    seoTrend:      ['sessions', 'impressions'],
    adsPlatform:   ['google', 'meta'],
    webDevice:     null, // donut — skip
    channelDonut:  null,
    seoRanking:    null,
  };

  Object.entries(CHARTS || {}).forEach(([cid, chart]) => {
    if (!chart?.data?.datasets) return;
    const keys = chartCompMap[cid];
    if (!keys) return;

    // Remove any existing ghost datasets (marked with _ghost)
    chart.data.datasets = chart.data.datasets.filter(d => !d._ghost);

    if (_comparisonActive && prevData?.charts?.[_chartDataKey(cid)]) {
      const prevChartData = prevData.charts[_chartDataKey(cid)];
      keys.forEach((k, i) => {
        const orig = chart.data.datasets[i];
        if (!orig || !prevChartData[k]) return;
        const ghostColor = orig.borderColor
          ? orig.borderColor.replace(/[\d.]+\)$/, '0.4)').replace(/rgba\((\d+,\d+,\d+),/, 'rgba($1,')
          : 'rgba(180,180,180,0.4)';
        chart.data.datasets.push({
          _ghost: true,
          type: 'line',   // force line even inside bar charts for visible dashed overlay
          label: (orig.label || k) + ' (prev)',
          data:  prevChartData[k],
          borderColor: ghostColor,
          backgroundColor: 'transparent',
          borderDash: [6, 4],
          borderWidth: 2,
          pointRadius: 0,
          tension: orig.tension || 0.4,
          fill: false,
          yAxisID: orig.yAxisID,   // keep correct axis
          order: (orig.order ?? 0) + 10, // render behind current
        });
      });
    }
    chart.update('none');
  });
}

function _chartDataKey(chartId) {
  const map = {
    overviewTrend: 'overview-trend',
    adsTrend: 'ads-trend',
    seoTrend: 'seo-trend',
    adsPlatform: 'ads-platform',
  };
  return map[chartId] || chartId;
}

/* ── #18 Report Customization Panel ──────────────────────────── */
const _CUSTOMIZE_LS = 'avo_customize_v1';

const _CUSTOMIZE_SECTIONS = [
  { id: 'overview-kpi',    label: 'Overview · KPI Cards',     sel: '#page-overview .metrics-grid' },
  { id: 'overview-trend',  label: 'Overview · Trend Chart',   sel: '#page-overview .card:has(#overviewTrendChart)' },
  { id: 'overview-ch',     label: 'Overview · Channel Mix',   sel: '#page-overview .card:has(#channelDonutChart)' },
  { id: 'ads-kpi',         label: 'Ads · KPI Cards',          sel: '#page-ads .metrics-grid' },
  { id: 'ads-trend',       label: 'Ads · Trend Chart',        sel: '#page-ads .card:has(#adsTrendChart)' },
  { id: 'ads-funnel',      label: 'Ads · Funnel',             sel: '#page-ads .funnel-card' },
  { id: 'ads-table',       label: 'Ads · Keywords Table',     sel: '#page-ads .card:has(#ads-table)' },
  { id: 'seo-kpi',         label: 'SEO · KPI Cards',          sel: '#page-seo .metrics-grid' },
  { id: 'seo-trend',       label: 'SEO · Trend Chart',        sel: '#page-seo .card:has(#seoTrendChart)' },
  { id: 'seo-table',       label: 'SEO · Keywords Table',     sel: '#page-seo .card:has(#seo-table)' },
  { id: 'web-kpi',         label: 'Website · KPI Cards',      sel: '#page-web .metrics-grid' },
];

function _loadCustomizeSettings() {
  try { return JSON.parse(localStorage.getItem(_CUSTOMIZE_LS) || '{}'); } catch(e) { return {}; }
}
function _saveCustomizeSettings(settings) {
  try { localStorage.setItem(_CUSTOMIZE_LS, JSON.stringify(settings)); } catch(e) {}
}

function _applyCustomizeSettings() {
  const settings = _loadCustomizeSettings();
  _CUSTOMIZE_SECTIONS.forEach(({ id, sel }) => {
    const visible = settings[id] !== false; // default to true
    document.querySelectorAll(sel).forEach(el => {
      el.style.display = visible ? '' : 'none';
    });
  });
}

function _initCustomizePanel() {
  const panel  = document.getElementById('customize-panel');
  const list   = document.getElementById('customize-list');
  if (!panel || !list) return;

  const settings = _loadCustomizeSettings();
  list.innerHTML = _CUSTOMIZE_SECTIONS.map(({ id, label }) => {
    const checked = settings[id] !== false;
    return `<label class="customize-item"><input type="checkbox" data-cid="${id}" ${checked ? 'checked' : ''}><span>${label}</span></label>`;
  }).join('');

  list.querySelectorAll('input[type=checkbox]').forEach(cb => {
    cb.addEventListener('change', () => {
      const settings = _loadCustomizeSettings();
      settings[cb.dataset.cid] = cb.checked;
      _saveCustomizeSettings(settings);
      _applyCustomizeSettings();
    });
  });
}

function _toggleCustomizePanel() {
  const panel = document.getElementById('customize-panel');
  if (!panel) return;
  const isOpen = panel.classList.toggle('open');
  document.getElementById('customize-overlay')?.classList.toggle('open', isOpen);
}

/* ── #15 Table Sort & Search ──────────────────────────────────── */
function initTableSort(tableId, searchId, countId) {
  const table = document.getElementById(tableId);
  const searchInput = document.getElementById(searchId);
  const countEl = document.getElementById(countId);
  if (!table || !searchInput) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  // Page size — reads from tableColumnSettings each render so editor changes take effect
  function _getPageSize() {
    const s = tableColumnSettings[tableId] || {};
    return parseInt(s._pageSize) || 10;
  }
  let pageSize = 10; // default; refreshed on each _applyAll call
  let currentPage = 1;
  let sortCol = -1, sortDir = 1;

  // Stable snapshot of all rows — only updated when table is re-rendered
  let allRows = Array.from(tbody.rows);
  // Re-paginate with current allRows (page-size change, filter update, etc.)
  // Does NOT re-read from DOM — allRows stays the full set captured at initTableSort time.
  // When the table is fully re-rendered (e.g. _renderAdsTableRows), initTableSort is
  // called again anyway, so a fresh allRows snapshot is captured then.
  table._refreshRows = function() {
    currentPage = 1;
    _applyAll();
  };

  function parseVal(td) {
    const t = td ? td.textContent.trim().replace(/[Rp\s\.Jt%x,]/g,'').replace(',','.') : '';
    const n = parseFloat(t);
    return isNaN(n) ? (td ? td.textContent.trim().toLowerCase() : '') : n;
  }

  function _applyAll() {
    pageSize = _getPageSize(); // refresh in case editor changed it
    const q = searchInput.value.toLowerCase().trim();
    let filtered = allRows.filter(r => !q || r.textContent.toLowerCase().includes(q));

    if (sortCol >= 0) {
      filtered.sort((a,b) => {
        const av = parseVal(a.cells[sortCol]), bv = parseVal(b.cells[sortCol]);
        if (typeof av === 'string') return av.localeCompare(bv) * sortDir;
        return (av - bv) * sortDir;
      });
    }

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * pageSize;
    const pageRows = filtered.slice(start, start + pageSize);

    tbody.innerHTML = '';
    pageRows.forEach(r => tbody.appendChild(r));

    if (countEl) countEl.textContent = `${filtered.length} baris`;

    _renderPagination(filtered.length, totalPages);
  }

  function _renderPagination(total, totalPages) {
    const paginId = tableId + '-pagination';
    let paginEl = document.getElementById(paginId);
    if (!paginEl) {
      paginEl = document.createElement('div');
      paginEl.id = paginId;
      paginEl.className = 'table-pagination';
      table.closest('.table-wrap')?.after(paginEl);
    }
    if (totalPages <= 1) { paginEl.innerHTML = ''; return; }
    paginEl.innerHTML = `
      <button class="pg-btn pg-prev" ${currentPage <= 1 ? 'disabled' : ''}>&#8249;</button>
      <span class="pg-info">Halaman ${currentPage} / ${totalPages}</span>
      <button class="pg-btn pg-next" ${currentPage >= totalPages ? 'disabled' : ''}>&#8250;</button>`;
    paginEl.querySelector('.pg-prev').addEventListener('click', () => { if (currentPage > 1) { currentPage--; _applyAll(); } });
    paginEl.querySelector('.pg-next').addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; _applyAll(); } });
  }

  searchInput.addEventListener('input', () => { currentPage = 1; _applyAll(); });

  table.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = parseInt(th.dataset.col ?? th.cellIndex);
      sortDir = (sortCol === col) ? -sortDir : 1;
      sortCol = col;
      table.querySelectorAll('th.sortable').forEach(t => {
        t.classList.remove('sort-asc','sort-desc');
        const ic = t.querySelector('.sort-icon'); if (ic) ic.textContent = '↕';
      });
      th.classList.add(sortDir === 1 ? 'sort-asc' : 'sort-desc');
      const ic = th.querySelector('.sort-icon'); if (ic) ic.textContent = sortDir === 1 ? '↑' : '↓';
      currentPage = 1;
      _applyAll();
    });
  });

  _applyAll();
}

/* ── #17 Initial conditional formatting ──────────────────────── */
(function applyInitialConditionalFormatting() {
  document.querySelectorAll('#ads-table-body tr').forEach(tr => {
    const tds = tr.querySelectorAll('td.num');
    if (tds[2]) { const ctr = parseFloat(tds[2].textContent); tds[2].className = 'num ' + (ctr>=4?'cell-good':ctr>=3?'':'cell-warn'); }
    if (tds[6]) { const roas = parseFloat(tds[6].textContent); tds[6].className = 'num ' + (roas>=4?'cell-good':roas>=3?'':roas>=2?'cell-warn':'cell-bad'); }
  });
  document.querySelectorAll('#seo-table-body tr').forEach(tr => {
    const tds = tr.querySelectorAll('td.num');
    if (tds[3]) { const ctr = parseFloat(tds[3].textContent); tds[3].className = 'num ' + (ctr>=12?'cell-good':ctr>=8?'':'cell-warn'); }
  });
})();

/* ── #22 Metric Definition Tooltips ──────────────────────────── */
(function initTooltip() {
  const tip = document.getElementById('def-tooltip');
  if (!tip) return;
  document.querySelectorAll('[data-def]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      tip.textContent = el.dataset.def;
      tip.classList.add('visible');
    });
    el.addEventListener('mousemove', e => {
      tip.style.left = (e.clientX + 16) + 'px';
      tip.style.top  = Math.max(8, e.clientY - 36) + 'px';
    });
    el.addEventListener('mouseleave', () => tip.classList.remove('visible'));
  });
})();



/* ── #24 Section Progress Indicator ──────────────────────────── */
const _visitedPages = new Set(['overview']);
// Initial state
document.querySelector('.nav-item[data-page="overview"]')?.classList.add('active');

/* ── #5 URL Hash Navigation on load ──────────────────────────── */
(function initHashNav() {
  const h = (location.hash || '').slice(1);
  if (h && ['overview','ads','seo','web'].includes(h)) {
    navigate(h);
  }
})();

/* ── #23 Previous-period ghost sparklines ─────────────────────── */
// Enhance sparkline renderer to optionally show prev period ghost
// (Triggered when comparison mode is active and period changes)
// Note: sparklines are SVG-based; ghost layer added via second polyline

/* #13 Action Item Tracker removed per user request — no checkboxes in insight cards */

/* ── Searchable Select component ──────────────────────────────
   Replaces a <select> with a custom searchable dropdown.
   The native <select> is hidden but kept for JS compatibility.
   ──────────────────────────────────────────────────────────── */
function makeSearchableSelect(sel) {
  if (!sel || sel.dataset.searchified) return;
  sel.dataset.searchified = 'true';
  sel.style.display = 'none';

  /* Wrap */
  const wrap = document.createElement('div');
  wrap.className = 'ss-wrap';
  sel.parentNode.insertBefore(wrap, sel);
  wrap.appendChild(sel);

  /* Trigger button */
  const trigger = document.createElement('div');
  trigger.className = 'ss-trigger';
  trigger.setAttribute('role', 'combobox');
  const label = document.createElement('span');
  label.className = 'ss-trigger-label';
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrow.setAttribute('width','12'); arrow.setAttribute('height','12');
  arrow.setAttribute('fill','none'); arrow.setAttribute('stroke','currentColor');
  arrow.setAttribute('stroke-width','2'); arrow.setAttribute('viewBox','0 0 24 24');
  arrow.innerHTML = '<polyline points="6 9 12 15 18 9"/>';
  trigger.appendChild(label);
  trigger.appendChild(arrow);
  wrap.insertBefore(trigger, sel);

  /* Panel */
  const panel = document.createElement('div');
  panel.className = 'ss-panel';
  panel.style.display = 'none';

  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.className = 'ss-search';
  searchInput.placeholder = 'Search…';

  const list = document.createElement('div');
  list.className = 'ss-list';

  panel.appendChild(searchInput);
  panel.appendChild(list);
  wrap.appendChild(panel);

  function updateTrigger() {
    const opt = Array.from(sel.options).find(o => o.value === sel.value) || sel.options[0];
    label.textContent = opt ? opt.text : '—';
  }

  function buildList(q) {
    q = (q || '').toLowerCase();
    list.innerHTML = '';
    let count = 0;
    Array.from(sel.options).forEach(opt => {
      if (q && !opt.text.toLowerCase().includes(q)) return;
      const item = document.createElement('div');
      item.className = 'ss-item' + (opt.value === sel.value ? ' ss-active' : '');
      item.textContent = opt.text;
      item.addEventListener('mousedown', e => {
        e.preventDefault();
        sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        updateTrigger();
        closePanel();
      });
      list.appendChild(item);
      count++;
    });
    if (!count) {
      const empty = document.createElement('div');
      empty.className = 'ss-empty';
      empty.textContent = 'No results';
      list.appendChild(empty);
    }
  }

  function openPanel() {
    panel.style.display = '';
    searchInput.value = '';
    buildList('');
    wrap.classList.add('ss-open');
    setTimeout(() => searchInput.focus(), 0);
  }

  function closePanel() {
    panel.style.display = 'none';
    wrap.classList.remove('ss-open');
  }

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    panel.style.display === 'none' ? openPanel() : closePanel();
  });

  searchInput.addEventListener('input', () => buildList(searchInput.value));
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanel();
    if (e.key === 'Enter') { const first = list.querySelector('.ss-item'); if (first) first.dispatchEvent(new MouseEvent('mousedown')); }
    if (e.key === 'ArrowDown') { const items = list.querySelectorAll('.ss-item'); if (items.length) items[0].focus(); }
  });

  document.addEventListener('click', e => { if (!wrap.contains(e.target)) closePanel(); });

  /* Re-build trigger label when native select options change */
  new MutationObserver(() => {
    updateTrigger();
    if (panel.style.display !== 'none') buildList(searchInput.value);
  }).observe(sel, { childList: true });

  updateTrigger();
}

/* Apply to editor account + property selects on DOMContentLoaded */
document.addEventListener('DOMContentLoaded', () => {
  makeSearchableSelect(document.getElementById('editor-ds-account'));
  makeSearchableSelect(document.getElementById('editor-ds-property'));
});

/* ── Card Editor Panel (Part C4/C5) ──────────────────────────── */
let _editingCard = null;

function openEditor(card) {
  _editingCard = card;
  const panel   = document.getElementById('editor-panel');
  const overlay = document.getElementById('editor-overlay');
  if (!panel || !overlay) return;

  const isMetricCard = card.classList.contains('metric-card');
  const tableId      = card.dataset.tableId  || null;  // 'ads-table' | 'seo-table' | null
  const chartId      = card.dataset.chartId  || null;  // 'ads-trend' | 'overview-trend' | ...

  /* ── Show/hide sections depending on card type ─────────────── */
  const METRIC_ONLY_IDS  = ['editor-section-metric',
                             'editor-section-comparison', 'editor-section-filter',
                             'editor-section-daterange'];
  METRIC_ONLY_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (tableId || chartId) ? 'none' : '';
  });

  // Table-specific column picker
  const tableConfig = document.getElementById('editor-table-config');
  if (tableConfig) tableConfig.style.display = tableId ? '' : 'none';

  // Chart-specific dim+metric picker
  const chartConfig = document.getElementById('editor-chart-config');
  if (chartConfig) chartConfig.style.display = chartId ? '' : 'none';

  /* ── Metric card setup ──────────────────────────────────────── */
  if (isMetricCard) {
    const cardKey = card.dataset.metricKey || '';

    // Restore the source saved for this card (per-card, not global)
    const savedSrc = getCardSettings(cardKey).source || 'google-ads';
    document.querySelectorAll('.editor-ds-src-btn').forEach(b => b.classList.toggle('active', b.dataset.src === savedSrc));
    updateEditorMetrics(savedSrc);

    // Restore metric: use the full effective key (e.g. 'gsc-clicks') directly
    const effectiveKey = getEffectiveMetricKey(cardKey);
    const sel = document.getElementById('editor-metric');
    if (sel) {
      setTimeout(() => {
        if (Array.from(sel.options).some(o => o.value === effectiveKey)) sel.value = effectiveKey;
      }, 0);
    }

    // Restore width button active state
    const savedWidth = getCardSettings(cardKey).colWidth;
    if (savedWidth !== undefined) {
      document.querySelectorAll('.editor-size-btn[data-size]').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.size) === savedWidth);
      });
    }

    // Restore padding inputs
    const savedPad = getCardSettings(cardKey).padding;
    if (savedPad) {
      const padT = document.getElementById('editor-pad-top');    if (padT)  padT.value  = savedPad.t;
      const padR = document.getElementById('editor-pad-right');  if (padR)  padR.value  = savedPad.r;
      const padB = document.getElementById('editor-pad-bottom'); if (padB)  padB.value  = savedPad.b;
      const padL = document.getElementById('editor-pad-left');   if (padL)  padL.value  = savedPad.l;
    }
  }

  /* ── Table card setup ───────────────────────────────────────── */
  if (tableId) {
    populateTableEditor(tableId);
    const titleEl = panel.querySelector('.editor-panel-title-wrap h3');
    if (titleEl) titleEl.textContent = tableId === 'ads-table' ? 'Tabel Campaign' : 'Tabel Keyword';
  }

  /* ── Chart card setup ───────────────────────────────────────── */
  else if (chartId) {
    populateChartEditor(chartId);
    const titleEl = panel.querySelector('.editor-panel-title-wrap h3');
    const def = CHART_DEFS[chartId];
    if (titleEl) titleEl.textContent = def ? 'Grafik · ' + chartId.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) : 'Chart Properties';
  } else {
    const titleEl = panel.querySelector('.editor-panel-title-wrap h3');
    if (titleEl) titleEl.textContent = 'Card Properties';
  }

  /* ── Card title / subtitle rename inputs ───────────────────── */
  const titleInp = document.getElementById('editor-card-title-input');
  const subInp   = document.getElementById('editor-card-subtitle-input');
  if (titleInp) {
    const titleEl = card.querySelector('.card-title');
    const metEl   = card.querySelector('.metric-label');
    const srcEl   = titleEl || metEl;
    titleInp.value       = srcEl?.textContent?.trim() || '';
    titleInp.placeholder = titleEl ? 'Judul card…' : metEl ? 'Nama metrik…' : 'Judul…';
    titleInp.oninput = () => { if (srcEl) srcEl.textContent = titleInp.value; };
    titleInp.onblur  = () => {
      const cid = card.dataset.cid; if (!cid) return;
      if (!cardLabels[cid]) cardLabels[cid] = {};
      if (srcEl === metEl) cardLabels[cid].metricLabel = titleInp.value;
      else                 cardLabels[cid].title        = titleInp.value;
      _saveCardLabels();
    };
  }
  if (subInp) {
    const subEl = card.querySelector('.card-subtitle');
    subInp.value       = subEl?.textContent?.trim() || '';
    subInp.placeholder = 'Deskripsi singkat…';
    subInp.style.display = subEl ? '' : 'none';
    subInp.oninput = () => { if (subEl) subEl.textContent = subInp.value; };
    subInp.onblur  = () => {
      const cid = card.dataset.cid; if (!cid) return;
      if (!cardLabels[cid]) cardLabels[cid] = {};
      cardLabels[cid].subtitle = subInp.value;
      _saveCardLabels();
    };
  }

  panel.classList.add('open');
  overlay.classList.add('open');

  // Show delete button only for dynamic (admin-added) cards
  const deleteBtn = document.getElementById('btn-delete-card');
  if (deleteBtn) deleteBtn.style.display = card.dataset.dynCard === '1' ? '' : 'none';

  // Pre-fill comparison / goal / benchmark toggles from stored settings (metric cards only)
  if (isMetricCard) populateEditorFromCard(card);
}

function closeEditor() {
  const panel   = document.getElementById('editor-panel');
  const overlay = document.getElementById('editor-overlay');
  if (panel)   panel.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  _editingCard = null;
}

// Tab switching
document.querySelectorAll('.editor-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const panel = document.getElementById('editor-panel');
    if (!panel) return;
    panel.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
    panel.querySelectorAll('.editor-tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const content = document.getElementById('editor-' + tab.dataset.tab);
    if (content) content.classList.add('active');
  });
});

// Chart type selection
document.querySelectorAll('.chart-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Color swatch selection
document.querySelectorAll('.editor-color-swatch').forEach(swatch => {
  swatch.addEventListener('click', () => {
    document.querySelectorAll('.editor-color-swatch').forEach(s => s.classList.remove('active'));
    swatch.classList.add('active');
  });
});

// Size buttons — font size (editor-size-group) + card width (data-size)
document.querySelectorAll('.editor-size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.editor-size-group, .editor-size-row')?.querySelectorAll('.editor-size-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Card width buttons have data-size (percentage: 25/33/50/100)
    if (btn.dataset.size && _editingCard) {
      const pct    = parseInt(btn.dataset.size, 10);
      const grid   = _editingCard.closest('.grid');
      if (grid) {
        const gridW  = grid.clientWidth || grid.offsetWidth;
        const newW   = Math.round(gridW * pct / 100);
        _editingCard.style.width = newW + 'px';
        if (typeof resizeCardContent === 'function') resizeCardContent(_editingCard);
        // Persist width to card settings + trigger layout save debounce
        if (_editingCard.dataset.metricKey) {
          setCardSetting(_editingCard.dataset.metricKey, { colWidth: pct });
        }
      }
    }
  });
});

// Padding inputs — apply to card + save
(function _wirePaddingInputs() {
  ['top','right','bottom','left'].forEach(side => {
    const inp = document.getElementById('editor-pad-' + side);
    if (!inp) return;
    inp.addEventListener('input', () => {
      if (!_editingCard) return;
      const t = +(document.getElementById('editor-pad-top')?.value    ?? 20);
      const r = +(document.getElementById('editor-pad-right')?.value  ?? 20);
      const b = +(document.getElementById('editor-pad-bottom')?.value ?? 20);
      const l = +(document.getElementById('editor-pad-left')?.value   ?? 20);
      _editingCard.style.padding = `${t}px ${r}px ${b}px ${l}px`;
      if (typeof resizeCardContent === 'function') resizeCardContent(_editingCard);
      if (_editingCard.dataset.metricKey) {
        setCardSetting(_editingCard.dataset.metricKey, { padding: { t, r, b, l } });
      }
    });
  });
})();

// Opacity range slider live preview
document.querySelectorAll('.editor-range').forEach(range => {
  const valEl = range.closest('.editor-field')?.querySelector('.editor-range-val')
             || range.nextElementSibling;
  range.addEventListener('input', () => {
    if (valEl) valEl.textContent = range.value + '%';
  });
});

// Close button and overlay
document.getElementById('editor-close')?.addEventListener('click', closeEditor);
document.getElementById('editor-overlay')?.addEventListener('click', closeEditor);

// Delete dynamic card
document.getElementById('btn-delete-card')?.addEventListener('click', () => {
  if (!_editingCard || _editingCard.dataset.dynCard !== '1') return;
  if (!confirm('Hapus card ini? Tindakan ini tidak dapat dibatalkan.')) return;
  removeCardFromPage(_editingCard);
});

// Duplicate card (any metric card)
document.getElementById('btn-duplicate-card')?.addEventListener('click', () => {
  if (!_editingCard) return;
  duplicateCard(_editingCard);
});

// Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.getElementById('editor-panel')?.classList.contains('open')) {
    closeEditor();
  }
});

// Edit Mode toggle button (C5)
// edit-mode toggle handled above near line 990

/* ── Editor: Data Source ↔ Primary Metric wiring ────────────── */
// Metrics per source — values map 1-to-1 to Supabase ads_data columns
const EDITOR_SOURCE_METRICS = {
  'google-ads': [
    { value: 'ads-spend',               label: 'Total Spend',          col: 'spend' },
    { value: 'ads-clicks',              label: 'Clicks',               col: 'clicks' },
    { value: 'ads-impressions',         label: 'Impressions',          col: 'impressions' },
    { value: 'ads-ctr',                 label: 'CTR',                  col: 'ctr' },
    { value: 'ads-avg_cpc',             label: 'Avg. CPC',             col: 'avg_cpc' },
    { value: 'ads-conv_rate',           label: 'Conv. Rate',           col: 'conv_rate' },
    { value: 'ads-conversions',         label: 'Conversions',          col: 'conversions' },
    { value: 'ads-cost_per_conversion', label: 'Cost per Conversion',  col: 'cost_per_conversion' },
    { value: 'ads-roas',                label: 'ROAS (computed)',      col: null },
  ],
  'ga4': [
    { value: 'ga4-sessions',  label: 'Sessions',        col: null },
    { value: 'ga4-users',     label: 'Users',           col: null },
    { value: 'ga4-bounce',    label: 'Bounce Rate',     col: null },
    { value: 'ga4-duration',  label: 'Avg. Duration',   col: null },
    { value: 'ga4-pageviews', label: 'Pageviews',       col: null },
  ],
  'gsc': [
    { value: 'gsc-impressions', label: 'Impressions',   col: null },
    { value: 'gsc-clicks',      label: 'Clicks',        col: null },
    { value: 'gsc-ctr',         label: 'CTR',           col: null },
    { value: 'gsc-position',    label: 'Avg. Position', col: null },
  ],
  'meta-ads': [
    { value: 'meta-spend',       label: 'Total Spend',  col: null },
    { value: 'meta-impressions', label: 'Impressions',  col: null },
    { value: 'meta-clicks',      label: 'Clicks',       col: null },
    { value: 'meta-ctr',         label: 'CTR',          col: null },
    { value: 'meta-conversions', label: 'Conversions',  col: null },
    { value: 'meta-roas',        label: 'ROAS',         col: null },
  ],
  'custom': [
    { value: 'custom', label: 'Custom field...', col: null },
  ],
};

// Sources that have real data in Supabase
const EDITOR_CONNECTED_SOURCES = new Set(['google-ads', 'gsc', 'ga4', 'custom']);

function updateEditorMetrics(source) {
  const sel  = document.getElementById('editor-metric');
  const warn = document.getElementById('editor-metric-warn');
  if (!sel) return;
  const metrics     = EDITOR_SOURCE_METRICS[source] || EDITOR_SOURCE_METRICS['custom'];
  const isConnected = EDITOR_CONNECTED_SOURCES.has(source);
  sel.innerHTML = metrics.map(m =>
    `<option value="${m.value}">${m.label}</option>`
  ).join('');
  if (warn) warn.style.display = isConnected ? 'none' : 'flex';
}

// Source toggle button click — select source + refresh metric dropdown + save per-card
document.querySelectorAll('.editor-ds-src-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.editor-ds-src-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateEditorMetrics(btn.dataset.src);
    // Save source choice to the card currently being edited
    if (_editingCard?.dataset?.metricKey) {
      setCardSetting(_editingCard.dataset.metricKey, { source: btn.dataset.src });
    }
  });
});

// Initialise metric list for default source (Google Ads)
document.addEventListener('DOMContentLoaded', () => updateEditorMetrics('google-ads'));

// ── Live card update when metric selection changes ────────────
document.getElementById('editor-metric')?.addEventListener('change', e => {
  if (!_editingCard || !_editingCard.dataset.metricKey) return;

  const cardKey      = _editingCard.dataset.metricKey;           // e.g. 'ads-spend'
  const prefix       = cardKey.split('-')[0];                    // 'ads'
  const selectedVal  = e.target.value;                           // e.g. 'impressions' or 'gsc-clicks'

  // All metric values are now fully source-prefixed (ads-spend, gsc-clicks, ga4-sessions, etc.)
  // Use the value directly as the key — no page-prefix construction needed.
  const newKey = selectedVal;

  // Store or clear override (persisted to localStorage)
  if (newKey !== cardKey) {
    cardMetricOverrides[cardKey] = newKey;
  } else {
    delete cardMetricOverrides[cardKey];
  }
  _saveCardMetricOverrides();

  // Pull metric data from current period
  const periodData = PERIOD_DATA[currentPeriod];
  const m = periodData?.metrics[newKey];
  if (!m) {
    console.warn('[Editor] No data for metric key:', newKey);
    return;
  }

  // Update card DOM immediately
  const valEl = _editingCard.querySelector('.metric-value');
  const chgEl = _editingCard.querySelector('.metric-change');
  const spkEl = _editingCard.querySelector('.metric-sparkline');
  const lblEl = _editingCard.querySelector('.metric-label');

  if (valEl) valEl.textContent = m.display;
  if (chgEl) { chgEl.textContent = m.change; chgEl.className = 'metric-change ' + (m.dir || 'up'); }
  if (spkEl && m.spark) {
    spkEl.dataset.values = m.spark.join(',');
    renderSparklines(_editingCard.closest('.page') || document);
  }
  if (lblEl) lblEl.textContent = getMetricLabel(selectedVal);
});

// Click drag-handle to open editor panel
document.addEventListener('click', e => {
  const handle = e.target.closest('.drag-handle');
  if (handle && document.body.classList.contains('edit-mode')) {
    e.stopPropagation();
    openEditor(handle.closest('.card, .metric-card, .insight-card, .funnel-card'));
  }
});

// Also: clicking the edit-pencil button on each card opens editor
document.addEventListener('click', e => {
  const btn = e.target.closest('.card-edit-btn');
  if (btn && document.body.classList.contains('edit-mode')) {
    e.stopPropagation();
    openEditor(btn.closest('.card, .metric-card, .insight-card, .funnel-card'));
  }
});

/* ═══════════════════════════════════════════════════════════════
   Card Editor — Comparison / Goal / Benchmark live wiring
   ═══════════════════════════════════════════════════════════════ */

// Per-card settings store. Persists to localStorage.
const cardSettings = (() => {
  try { return JSON.parse(localStorage.getItem('avo_card_settings_v1') || '{}'); } catch(e) { return {}; }
})();
function _saveCardSettings() {
  try { localStorage.setItem('avo_card_settings_v1', JSON.stringify(cardSettings)); } catch(e) {}
}

/* ── Card label rename store (titles, subtitles, metric labels) ── */
let cardLabels = (() => {
  try { return JSON.parse(localStorage.getItem('avo_card_labels_v1') || '{}'); } catch(e) { return {}; }
})();
function _saveCardLabels() {
  try { localStorage.setItem('avo_card_labels_v1', JSON.stringify(cardLabels)); } catch(e) {}
}
function _applyCardLabels() {
  document.querySelectorAll('[data-cid]').forEach(card => {
    const saved = cardLabels[card.dataset.cid];
    if (!saved) return;
    if (saved.title !== undefined) {
      const el = card.querySelector('.card-title');
      if (el) el.textContent = saved.title;
    }
    if (saved.subtitle !== undefined) {
      const el = card.querySelector('.card-subtitle');
      if (el) el.textContent = saved.subtitle;
    }
    if (saved.metricLabel !== undefined) {
      const el = card.querySelector('.metric-label');
      if (el) el.textContent = saved.metricLabel;
    }
  });
}

/* ══════════════════════════════════════════════════════════════
   TABLE COLUMN CONFIGURATION
   Allows users to show/hide any column in a table card via the
   editor panel. Supports multi-select of dimensions + metrics.
   ══════════════════════════════════════════════════════════════ */

/* Column definitions for each table
 * dbCol  = actual Supabase column name (null = not in Supabase, static only)
 * derive = fn(row) → string value (overrides dbCol for grouping)
 * compute= fn(g)   → metric value from aggregator group {_spend,_impressions,_clicks,_conversions}
 */
const TABLE_COLUMN_DEFS = {
  'ads-table': {
    dimensions: [
      { id: 'campaign',     label: 'Campaign Name',   defaultOn: true,  dbCol: 'campaign_name' },
      { id: 'campaign_type',label: 'Campaign Type',   defaultOn: false, dbCol: 'campaign_type' },
      { id: 'ad_group',     label: 'Ad Group',        defaultOn: false, dbCol: 'ad_group' },
      { id: 'keyword',      label: 'Keyword',         defaultOn: false, dbCol: 'keyword' },
      { id: 'match_type',   label: 'Match Type',      defaultOn: false, dbCol: 'match_type' },
      { id: 'month',        label: 'Month',           defaultOn: false, dbCol: null, derive: r => r.day ? String(r.day).substring(0,7) : '—' },
      { id: 'day',          label: 'Day',             defaultOn: false, dbCol: 'day' },
      /* static-only dims (not in Supabase) */
      { id: 'platform',     label: 'Platform',        defaultOn: true,  dbCol: null },
      { id: 'status',       label: 'Status',          defaultOn: true,  dbCol: null },
      { id: 'target_loc',   label: 'Target Location', defaultOn: false, dbCol: null },
      { id: 'age',          label: 'Age',             defaultOn: false, dbCol: null },
      { id: 'gender',       label: 'Gender',          defaultOn: false, dbCol: null },
      { id: 'device',       label: 'Device',          defaultOn: false, dbCol: null },
    ],
    metrics: [
      { id: 'impressions', label: 'Impression',  defaultOn: true,  compute: g => g._impressions },
      { id: 'spend',       label: 'Spend',       defaultOn: true,  compute: g => g._spend },
      { id: 'clicks',      label: 'Click',       defaultOn: true,  compute: g => g._clicks },
      { id: 'cpc',         label: 'Avg. CPC',    defaultOn: true,  compute: g => g._clicks > 0 ? g._spend / g._clicks : 0 },
      { id: 'ctr',         label: 'CTR',         defaultOn: true,  compute: g => g._impressions > 0 ? g._clicks / g._impressions * 100 : 0 },
      { id: 'conv',        label: 'Conversions', defaultOn: true,  compute: g => g._conversions },
      { id: 'conv_rate',   label: 'Conv. Rate',  defaultOn: false, compute: g => g._clicks > 0 ? g._conversions / g._clicks * 100 : 0 },
      { id: 'roas',        label: 'ROAS',        defaultOn: false, compute: g => 0 },
    ]
  },
  'seo-table': {
    dimensions: [
      { id: 'keyword',  label: 'Keyword', defaultOn: true,  dbCol: null },
      { id: 'device',   label: 'Device',  defaultOn: false, dbCol: null },
      { id: 'country',  label: 'Country', defaultOn: false, dbCol: null },
      { id: 'page',     label: 'Page',    defaultOn: false, dbCol: null },
      { id: 'month',    label: 'Month',   defaultOn: false, dbCol: null },
      { id: 'day',      label: 'Day',     defaultOn: false, dbCol: null },
    ],
    metrics: [
      { id: 'position',    label: 'Position',    defaultOn: true,  compute: null },
      { id: 'impressions', label: 'Impressions', defaultOn: true,  compute: null },
      { id: 'clicks',      label: 'Clicks',      defaultOn: true,  compute: null },
      { id: 'ctr',         label: 'CTR',         defaultOn: true,  compute: null },
      { id: 'trend',       label: 'Trend',       defaultOn: true,  compute: null },
    ]
  }
};

/* Per-table visibility state: { 'ads-table': { impressions: true, cpc: false, ... } } */
const tableColumnSettings = {};

/* Load saved column settings from localStorage */
(function _restoreTableColumnSettings() {
  try {
    const saved = localStorage.getItem('avo_table_cols_v1');
    if (saved) Object.assign(tableColumnSettings, JSON.parse(saved));
  } catch(e) {}
})();

/* Save column settings to localStorage */
function _saveTableColumnSettings() {
  try { localStorage.setItem('avo_table_cols_v1', JSON.stringify(tableColumnSettings)); } catch(e) {}
}

/* Init table sort+pagination AFTER tableColumnSettings is declared */
initTableSort('ads-table','ads-table-search','ads-table-count');
initTableSort('seo-table','seo-table-search','seo-table-count');

/* Determine if a column should be visible given saved settings + defaultOn fallback */
function _colVisible(col, settings) {
  if (col.required) return true;
  const saved = settings[col.id];
  return saved !== undefined ? saved !== false : col.defaultOn !== false;
}

/* Apply column visibility to a single table */
function applyTableColumns(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const def = TABLE_COLUMN_DEFS[tableId];
  if (!def) return;
  const settings = tableColumnSettings[tableId] || {};
  const allCols = [...def.dimensions, ...def.metrics];

  allCols.forEach(col => {
    const visible = _colVisible(col, settings);
    table.querySelectorAll(`[data-col-id="${col.id}"]`).forEach(el => {
      el.style.display = visible ? '' : 'none';
    });
  });

  _updateEditorColCount(tableId);
}

/* Count visible columns and update the badge */
function _updateEditorColCount(tableId) {
  const countEl = document.getElementById('editor-col-count');
  if (!countEl) return;
  const def = TABLE_COLUMN_DEFS[tableId];
  if (!def) return;
  const settings = tableColumnSettings[tableId] || {};
  const allCols = [...def.dimensions, ...def.metrics];
  const visible = allCols.filter(c => _colVisible(c, settings)).length;
  countEl.textContent = `${visible}/${allCols.length} kolom`;
}

/* ── Drag List Component ───────────────────────────────────────────
 *  Vertical list of selected items with drag-to-reorder + add dropdown.
 *  createDragList(container, options, initialSelected, onChange)
 *  options:          [{id, label}]
 *  initialSelected:  string[] of ids (ordered)
 *  onChange:         called with (orderedSelectedIds: string[])
 * ───────────────────────────────────────────────────────────────── */
function createDragList(container, options, initialSelected, onChange, opts = {}) {
  /* opts: { maxSelected, onRename(id,label), getLabel(id) } */
  let selected = [...initialSelected];

  function _curLabel(id) {
    const opt = options.find(o => o.id === id);
    return (opts.getLabel?.(id)) || opt?.label || id;
  }

  function _render() {
    const avail    = options.filter(o => !selected.includes(o.id));
    const atMax    = opts.maxSelected && selected.length >= opts.maxSelected;
    const addDisabled = avail.length === 0 || atMax;
    const addPlaceholder = atMax
      ? `Maks ${opts.maxSelected} metrik`
      : avail.length === 0 ? 'Semua kolom dipilih' : 'Tambah…';
    container.innerHTML = `
      <div class="drag-list">
        ${selected.map(id => {
          const opt = options.find(o => o.id === id);
          if (!opt) return '';
          const lbl = _curLabel(id);
          return `<div class="drag-item" data-id="${id}">
            <span class="drag-handle" title="Drag untuk ubah urutan">⣿</span>
            <input type="text" class="drag-label-input" data-id="${id}" value="${lbl}"
                   title="Klik untuk rename" spellcheck="false" autocomplete="off" />
            <button type="button" class="drag-rm" data-id="${id}" title="Hapus">×</button>
          </div>`;
        }).join('')}
        <div class="drag-add-row">
          <div class="drag-add-field">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            <input type="text" class="drag-add-input" placeholder="${addPlaceholder}"
                   autocomplete="off" spellcheck="false" ${addDisabled ? 'disabled' : ''} />
            <svg class="tag-chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div class="drag-add-dropdown" style="display:none"></div>
        </div>
      </div>`;
    _wireEvents();
  }

  function _wireEvents() {
    /* ── Drag to reorder (pointer-events, works in scrollable panels) ── */
    let _dragSrc  = null;
    let _dragOver = null;

    container.querySelectorAll('.drag-item').forEach(item => {
      const handle = item.querySelector('.drag-handle');
      if (!handle) return;

      handle.addEventListener('mousedown', e => {
        if (e.button !== 0) return;
        e.preventDefault();
        _dragSrc = item;
        item.classList.add('dragging');

        const listEl = container.querySelector('.drag-list');
        const items  = () => Array.from(listEl.querySelectorAll('.drag-item:not(.dragging)'));

        function onMove(ev) {
          const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
          let nearest = null, nearestDist = Infinity;
          items().forEach(it => {
            const r = it.getBoundingClientRect();
            const mid = r.top + r.height / 2;
            const dist = Math.abs(clientY - mid);
            if (dist < nearestDist) { nearestDist = dist; nearest = it; }
          });
          if (nearest !== _dragOver) {
            items().forEach(i => i.classList.remove('drag-over'));
            if (nearest) nearest.classList.add('drag-over');
            _dragOver = nearest;
          }
        }

        function onUp() {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup',   onUp);
          document.removeEventListener('touchmove', onMove);
          document.removeEventListener('touchend',  onUp);
          item.classList.remove('dragging');
          container.querySelectorAll('.drag-item').forEach(i => i.classList.remove('drag-over'));

          if (_dragOver && _dragOver !== _dragSrc) {
            const srcId    = _dragSrc.dataset.id;
            const targetId = _dragOver.dataset.id;
            const fromIdx  = selected.indexOf(srcId);
            const toIdx    = selected.indexOf(targetId);
            if (fromIdx !== -1 && toIdx !== -1) {
              selected.splice(fromIdx, 1);
              selected.splice(selected.indexOf(targetId) + (fromIdx > toIdx ? 0 : 1), 0, srcId);
              _render();
              onChange([...selected]);
            }
          }
          _dragSrc = null; _dragOver = null;
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);
        document.addEventListener('touchmove', onMove, { passive: true });
        document.addEventListener('touchend',  onUp);
      });
    });

    /* ── Remove buttons ── */
    container.querySelectorAll('.drag-rm').forEach(btn => {
      btn.addEventListener('click', () => {
        selected = selected.filter(id => id !== btn.dataset.id);
        _render();
        onChange([...selected]);
      });
    });

    /* ── Rename (label inputs) ── */
    if (opts.onRename) {
      container.querySelectorAll('.drag-label-input').forEach(input => {
        /* Prevent drag handle from intercepting clicks on the input */
        input.addEventListener('mousedown', e => e.stopPropagation());
        input.addEventListener('change', () => {
          const newLabel = input.value.trim();
          if (newLabel) opts.onRename(input.dataset.id, newLabel);
        });
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        });
      });
    } else {
      /* Without onRename — make inputs read-only so they look like labels */
      container.querySelectorAll('.drag-label-input').forEach(input => {
        input.readOnly = true;
        input.style.pointerEvents = 'none';
      });
    }

    /* ── Add dropdown ── */
    const addField    = container.querySelector('.drag-add-field');
    const addInput    = container.querySelector('.drag-add-input');
    const addDropdown = container.querySelector('.drag-add-dropdown');
    if (!addInput || !addDropdown) return;

    function _openDrop() {
      const q     = (addInput.value || '').trim().toLowerCase();
      const avail = options.filter(o => !selected.includes(o.id) && (!q || o.label.toLowerCase().includes(q)));
      addDropdown.innerHTML = avail.length
        ? avail.map(o => `<div class="drag-dd-opt" data-id="${o.id}">${o.label}</div>`).join('')
        : `<div class="drag-dd-empty">${q ? 'Tidak ditemukan' : 'Semua kolom dipilih'}</div>`;
      addDropdown.querySelectorAll('.drag-dd-opt').forEach(el => {
        el.addEventListener('mousedown', e => {
          e.preventDefault();
          selected.push(el.dataset.id);
          addInput.value = '';
          _render();
          onChange([...selected]);
        });
      });
      addDropdown.style.display = 'block';
      addField.classList.add('focused');
    }
    function _closeDrop() {
      addDropdown.style.display = 'none';
      addField.classList.remove('focused');
    }

    addInput.addEventListener('focus', _openDrop);
    addInput.addEventListener('blur',  () => setTimeout(_closeDrop, 160));
    addInput.addEventListener('input', _openDrop);
    addField.addEventListener('mousedown', e => {
      if (e.target !== addInput) { e.preventDefault(); addInput.focus(); }
    });
  }

  _render();
}

/* ── Get dimension value from a raw Supabase row ──────────────── */
function _getDimValue(row, dimDef) {
  if (dimDef.derive) return dimDef.derive(row);
  if (dimDef.dbCol)  return row[dimDef.dbCol] ?? '—';
  return '—'; // static-only: no Supabase column
}

/* ── Format table cell ─────────────────────────────────────────── */
function _fmtTableCell(value, metId) {
  if (value == null || value === '' || value === '—') return '—';
  if (metId === 'spend' || metId === 'cpc') return rupiah(value);
  if (metId === 'ctr' || metId === 'conv_rate') return (value <= 1 ? value * 100 : value).toFixed(2) + '%';
  if (metId === 'roas')     return parseFloat(value).toFixed(2) + 'x';
  if (metId === 'position') return parseFloat(value).toFixed(1);
  if (typeof value === 'number') return Math.round(value).toLocaleString('id-ID');
  return String(value);
}

/* ── Conditional formatting class for a table cell ────────────── */
// Returns '' | 'cell-good' | 'cell-warn' | 'cell-bad'
function _cellClass(value, metId) {
  if (value == null || value === '' || value === '—') return '';
  const v = parseFloat(value);
  if (isNaN(v)) return '';
  switch (metId) {
    case 'roas':
      return v >= 4 ? 'cell-good' : v >= 2 ? 'cell-warn' : 'cell-bad';
    case 'ctr': {
      const pct = v <= 1 ? v * 100 : v;
      return pct >= 4 ? 'cell-good' : pct >= 2 ? 'cell-warn' : 'cell-bad';
    }
    case 'conv_rate': {
      const pct = v <= 1 ? v * 100 : v;
      return pct >= 3 ? 'cell-good' : pct >= 1 ? 'cell-warn' : 'cell-bad';
    }
    case 'position':
      // Lower position = better (rank 1 is best)
      return v < 10 ? 'cell-good' : v < 20 ? 'cell-warn' : 'cell-bad';
    case 'ctr_gsc': {
      const pct = v <= 1 ? v * 100 : v;
      return pct >= 5 ? 'cell-good' : pct >= 2 ? 'cell-warn' : 'cell-bad';
    }
    default: return '';
  }
}

/* ── Render ads table from pre-grouped rows ────────────────────── */
function _renderAdsTableRows(tableId, grouped, selDims, selMets) {
  const table = document.getElementById(tableId);
  const tbody = document.getElementById(`${tableId}-body`);
  if (!table || !tbody) return;

  /* Rebuild thead */
  const theadTr = table.querySelector('thead tr');
  if (theadTr) {
    theadTr.innerHTML = [
      ...selDims.map(d => `<th class="sortable" data-col-id="${d.id}">${d.label} <span class="sort-icon">↕</span></th>`),
      ...selMets.map(m => `<th class="num sortable" data-col-id="${m.id}">${m.label} <span class="sort-icon">↕</span></th>`),
    ].join('');
  }

  /* Rebuild tbody */
  tbody.innerHTML = grouped.map(g => {
    const dimCells = selDims.map(d => `<td data-col-id="${d.id}">${g[d.id] ?? '—'}</td>`).join('');
    const metCells = selMets.map(m => {
      const cls = _cellClass(g[m.id], m.id);
      return `<td class="num${cls ? ' ' + cls : ''}" data-col-id="${m.id}">${_fmtTableCell(g[m.id], m.id)}</td>`;
    }).join('');
    return `<tr>${dimCells}${metCells}</tr>`;
  }).join('') || `<tr><td colspan="99" class="table-supa-loading">Tidak ada data untuk periode ini</td></tr>`;

  /* Row count */
  const countEl = document.getElementById(`${tableId}-count`);
  if (countEl) countEl.textContent = `${grouped.length} rows`;

  /* Re-init sort on new headers */
  if (typeof initTableSort === 'function') {
    const searchId = `${tableId}-search`;
    const countId  = `${tableId}-count`;
    initTableSort(tableId, searchId, countId);
  }
}

/* ── Main: render ads-table from window._avoAllRows ───────────── */
function _avoRenderAdsTable(tableId) {
  if (tableId !== 'ads-table') return;   // seo-table uses static data for now
  const rawRows = window._avoAllRows;
  if (!rawRows?.length) return;          // data not yet loaded — called again after load

  const def      = TABLE_COLUMN_DEFS[tableId];
  if (!def) return;
  const settings = tableColumnSettings[tableId] || {};

  /* ── Filter rows by current date range + account + channel ── */
  let rows = rawRows;
  const acct     = window._avoCurrentAccount || 'All Accounts';
  const chanType = window._avoCampaignType   || 'All';
  const dr       = window._avoActiveDateRange;
  if (acct !== 'All Accounts') rows = rows.filter(r => r.account_name === acct);
  if (chanType !== 'All')      rows = rows.filter(r => r.campaign_type === chanType);
  if (dr) {
    const fmt = d => { const mm = String(d.getMonth()+1).padStart(2,'0'), dd = String(d.getDate()).padStart(2,'0'); return `${d.getFullYear()}-${mm}-${dd}`; };
    const s = fmt(dr.start), e = fmt(dr.end || dr.start);
    rows = rows.filter(r => { const d = String(r.day || '').substring(0, 10); return d >= s && d <= e; });
  }

  /* ── Resolve ordered selection ── */
  const dimOrder = settings._dimOrder || def.dimensions.filter(d => _colVisible(d, settings)).map(d => d.id);
  const metOrder = settings._metOrder || def.metrics.filter(m => _colVisible(m, settings)).map(m => m.id);

  const selDims = dimOrder.map(id => def.dimensions.find(d => d.id === id)).filter(Boolean);
  const selMets = metOrder.map(id => def.metrics.find(m => m.id === id)).filter(Boolean);

  if (!selDims.length) {
    const tbody = document.getElementById(`${tableId}-body`);
    if (tbody) tbody.innerHTML = `<tr><td colspan="99" class="table-supa-loading">Pilih minimal 1 dimensi untuk menampilkan data</td></tr>`;
    return;
  }

  /* ── Group and aggregate ── */
  const groups = new Map();
  const groupableDims = selDims.filter(d => d.dbCol || d.derive);

  for (const row of rows) {
    const key = groupableDims.map(d => String(_getDimValue(row, d))).join('\x00');
    if (!groups.has(key)) {
      const entry = { _spend: 0, _impressions: 0, _clicks: 0, _conversions: 0 };
      selDims.forEach(d => { entry[d.id] = _getDimValue(row, d); });
      groups.set(key, entry);
    }
    const g = groups.get(key);
    g._spend       += +row.spend       || 0;
    g._impressions += +row.impressions || 0;
    g._clicks      += +row.clicks      || 0;
    g._conversions += +row.conversions || 0;
  }

  const grouped = [...groups.values()].map(g => {
    const result = {};
    selDims.forEach(d => { result[d.id] = g[d.id]; });
    selMets.forEach(m => { result[m.id] = m.compute ? m.compute(g) : 0; });
    return result;
  });

  /* Sort by first metric descending */
  if (selMets.length) {
    const firstMet = selMets[0].id;
    grouped.sort((a, b) => (b[firstMet] || 0) - (a[firstMet] || 0));
  }

  _renderAdsTableRows(tableId, grouped, selDims, selMets);
}

/* Expose globally so index.html inline scripts can call after date/filter changes */
window._avoRenderAdsTable = _avoRenderAdsTable;

/* ── Populate the Table Columns section in the editor panel ────── */
function populateTableEditor(tableId) {
  const def = TABLE_COLUMN_DEFS[tableId];
  if (!def) return;
  const settings = tableColumnSettings[tableId] || {};

  const dimContainer = document.getElementById('editor-dim-list');
  const metContainer = document.getElementById('editor-metric-col-list');
  if (!dimContainer || !metContainer) return;

  /* Build initial ordered selection */
  function initOrdered(cols, savedOrder, hiddenKey) {
    if (savedOrder?.length) {
      /* restore saved order, then append any defaultOn cols not yet
         in savedOrder AND not explicitly hidden by the user via drag */
      const explicitlyHidden = settings[hiddenKey] || [];
      const extra = cols
        .filter(c => c.defaultOn !== false && !savedOrder.includes(c.id) && !explicitlyHidden.includes(c.id))
        .map(c => c.id);
      // Only keep savedOrder ids that still exist in cols definition
      const validSaved = savedOrder.filter(id => cols.find(c => c.id === id));
      return [...validSaved, ...extra];
    }
    return cols.filter(c => _colVisible(c, settings)).map(c => c.id);
  }

  const initDims = initOrdered(def.dimensions, settings._dimOrder, '_dimHidden');
  const initMets = initOrdered(def.metrics,    settings._metOrder, '_metHidden');

  function _onDimChange(selIds) {
    if (!tableColumnSettings[tableId]) tableColumnSettings[tableId] = {};
    def.dimensions.forEach(c => { tableColumnSettings[tableId][c.id] = selIds.includes(c.id); });
    tableColumnSettings[tableId]._dimOrder  = selIds;
    // Track items explicitly removed by the user so they don't auto-re-appear
    tableColumnSettings[tableId]._dimHidden = def.dimensions.filter(c => !selIds.includes(c.id)).map(c => c.id);
    _saveTableColumnSettings();
    _avoRenderAdsTable(tableId);
    _updateEditorColCount(tableId);
  }

  function _onMetChange(selIds) {
    if (!tableColumnSettings[tableId]) tableColumnSettings[tableId] = {};
    def.metrics.forEach(c => { tableColumnSettings[tableId][c.id] = selIds.includes(c.id); });
    tableColumnSettings[tableId]._metOrder  = selIds;
    tableColumnSettings[tableId]._metHidden = def.metrics.filter(c => !selIds.includes(c.id)).map(c => c.id);
    _saveTableColumnSettings();
    _avoRenderAdsTable(tableId);
    _updateEditorColCount(tableId);
  }

  function _onColRename(id, label) {
    if (!tableColumnSettings[tableId]) tableColumnSettings[tableId] = {};
    if (!tableColumnSettings[tableId]._colLabels) tableColumnSettings[tableId]._colLabels = {};
    tableColumnSettings[tableId]._colLabels[id] = label;
    _saveTableColumnSettings();
    /* Update th header text in the live table */
    const th = document.querySelector(`#${tableId} th[data-col-id="${id}"]`);
    if (th) {
      const sortIcon = th.querySelector('.sort-icon');
      th.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent = label + ' '; });
      if (!th.querySelector('.sort-icon') && sortIcon) th.appendChild(sortIcon);
    }
  }

  const colLabels = (tableColumnSettings[tableId] || {})._colLabels || {};
  createDragList(dimContainer, def.dimensions, initDims, _onDimChange, {
    getLabel:  id => colLabels[id] || def.dimensions.find(c => c.id === id)?.label,
    onRename:  _onColRename,
  });
  createDragList(metContainer, def.metrics, initMets, _onMetChange, {
    getLabel:  id => colLabels[id] || def.metrics.find(c => c.id === id)?.label,
    onRename:  _onColRename,
  });

  /* Page size selector */
  const pageSizeEl = document.getElementById('editor-page-size');
  if (pageSizeEl) {
    pageSizeEl.value = String(settings._pageSize || 10);
    // Remove previous listener by replacing element clone then re-grabbing
    const freshSel = pageSizeEl.cloneNode(true);
    pageSizeEl.parentNode.replaceChild(freshSel, pageSizeEl);
    freshSel.value = String(settings._pageSize || 10);
    freshSel.addEventListener('change', () => {
      if (!tableColumnSettings[tableId]) tableColumnSettings[tableId] = {};
      tableColumnSettings[tableId]._pageSize = parseInt(freshSel.value) || 10;
      _saveTableColumnSettings();
      const tableEl = document.getElementById(tableId);
      if (tableEl?._refreshRows) tableEl._refreshRows();
    });
  }

  /* Supabase status — show data connection state */
  const supaStatus = document.getElementById('editor-supa-status');
  if (supaStatus) {
    const hasData = !!(window._avoAllRows?.length);
    supaStatus.innerHTML = hasData
      ? `<span class="supa-dot connected"></span>Supabase terhubung · ${window._avoAllRows.length.toLocaleString('id-ID')} baris`
      : `<span class="supa-dot"></span>Supabase belum terhubung`;
    supaStatus.className = 'editor-supa-status' + (hasData ? ' connected' : '');
  }

  /* Hide Supabase connect form since credentials come from supabase-client.js */
  const supaToggle = document.getElementById('editor-supa-toggle');
  const supaForm   = document.getElementById('editor-supa-form');
  if (supaToggle) supaToggle.style.display = 'none';
  if (supaForm)   supaForm.style.display   = 'none';

  _updateEditorColCount(tableId);
}

/* Apply column visibility on page load — always run so defaultOn hides
   columns even when no settings are saved yet (fresh start / cleared cache) */
document.addEventListener('DOMContentLoaded', () => {
  Object.keys(TABLE_COLUMN_DEFS).forEach(tableId => {
    applyTableColumns(tableId);
  });

  /* Auto-assign data-cid to all cards for label-rename persistence */
  const _slugify = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const _usedCids = new Set();
  document.querySelectorAll('.card, .metric-card, .insight-card, .funnel-card').forEach(card => {
    if (card.dataset.cid) return;
    const text = (card.querySelector('.card-title, .metric-label')?.textContent || '').trim();
    let cid = _slugify(text) || 'card';
    let i = 2;
    while (_usedCids.has(cid)) cid = _slugify(text) + '-' + (i++);
    _usedCids.add(cid);
    card.dataset.cid = cid;
  });
  _applyCardLabels();

  /* Apply saved table column header labels */
  Object.keys(TABLE_COLUMN_DEFS).forEach(tableId => {
    const colLabels = (tableColumnSettings[tableId] || {})._colLabels || {};
    Object.entries(colLabels).forEach(([id, label]) => {
      const th = document.querySelector(`#${tableId} th[data-col-id="${id}"]`);
      if (th) {
        const sortIcon = th.querySelector('.sort-icon');
        th.childNodes.forEach(n => { if (n.nodeType === 3) n.textContent = label + ' '; });
        if (sortIcon && !th.querySelector('.sort-icon')) th.appendChild(sortIcon);
      }
    });
  });
});

/* ── Chart dimension & metric definitions ─────────────────────── */
const CHART_METRICS_COMMON = [
  { id: 'spend',       label: 'Spend',       defaultOn: true,  color: '#F8B400', fmt: 'rupiah', compute: g => g._spend },
  { id: 'clicks',      label: 'Click',        defaultOn: true,  color: '#00C2B8', fmt: 'num',    compute: g => g._clicks },
  { id: 'impressions', label: 'Impression',   defaultOn: false, color: '#818CF8', fmt: 'num',    compute: g => g._impressions },
  { id: 'conversions', label: 'Conversions',  defaultOn: false, color: '#34D399', fmt: 'num',    compute: g => g._conversions },
  { id: 'ctr',         label: 'CTR (%)',      defaultOn: false, color: '#FB923C', fmt: 'pct',    compute: g => g._impressions ? g._clicks/g._impressions*100 : 0 },
  { id: 'conv_rate',   label: 'Conv. Rate',   defaultOn: false, color: '#F472B6', fmt: 'pct',    compute: g => g._clicks ? g._conversions/g._clicks*100 : 0 },
];

// GSC-specific chart metrics (computed from _gscAllRows, not _avoAllRows)
const CHART_METRICS_GSC = [
  { id: 'clicks',      label: 'Clicks',        defaultOn: true,  color: '#00C2B8', fmt: 'num', compute: g => g._clicks },
  { id: 'impressions', label: 'Impressions',   defaultOn: true,  color: '#F8B400', fmt: 'num', compute: g => g._impressions },
  { id: 'ctr',         label: 'CTR (%)',       defaultOn: false, color: '#818CF8', fmt: 'pct', compute: g => g._imprW ? g._clicks/g._imprW*100 : 0 },
  { id: 'position',    label: 'Avg. Position', defaultOn: false, color: '#34D399', fmt: 'num', compute: g => g._imprW ? g._posW/g._imprW : 0 },
];

const CHART_DEFS = {
  'ads-trend': {
    dimensions: [
      { id: 'day',   label: 'Per Hari',   field: 'day',   defaultOn: true  },
      { id: 'week',  label: 'Per Minggu', field: 'week',  defaultOn: false },
      { id: 'month', label: 'Per Bulan',  field: 'month', defaultOn: false },
    ],
    metrics: CHART_METRICS_COMMON,
  },
  'overview-trend': {
    dimensions: [
      { id: 'day',   label: 'Per Hari',   field: 'day',   defaultOn: true  },
      { id: 'week',  label: 'Per Minggu', field: 'week',  defaultOn: false },
      { id: 'month', label: 'Per Bulan',  field: 'month', defaultOn: false },
    ],
    metrics: CHART_METRICS_COMMON,
  },
  'seo-trend': {
    // Uses GSC rows (_gscAllRows) — date field is 'date', not 'day'
    dimensions: [
      { id: 'day',   label: 'Per Hari',  field: 'date', defaultOn: true,  group: r => r.date || '' },
      { id: 'month', label: 'Per Bulan', field: 'date', defaultOn: false, group: r => (r.date || '').substring(0,7) },
    ],
    metrics: CHART_METRICS_GSC,
    useGscRows: true,  // flag: use _gscAllRows instead of _avoAllRows
  },
};

/* ── Chart column settings (localStorage) ─────────────────────── */
let chartColumnSettings = (() => {
  try { return JSON.parse(localStorage.getItem('avo_chart_cols_v1') || '{}'); } catch(e) { return {}; }
})();
function _saveChartColumnSettings() {
  try { localStorage.setItem('avo_chart_cols_v1', JSON.stringify(chartColumnSettings)); } catch(e) {}
}

/* ── Render a chart dynamically from _avoAllRows ──────────────── */
function _renderChartDynamic(chartId) {
  const def  = CHART_DEFS[chartId];
  const rows = window._avoAllRows;
  if (!def || !rows?.length) return;

  const settings  = chartColumnSettings[chartId] || {};
  const metLabels = settings._metLabels || {};
  const dimId     = settings._dim || def.dimensions.find(d => d.defaultOn)?.id || def.dimensions[0]?.id;
  const dimDef    = def.dimensions.find(d => d.id === dimId);
  if (!dimDef) return;

  /* Max 2 metrics */
  const metIds  = (settings._metOrder?.length
    ? settings._metOrder
    : def.metrics.filter(m => m.defaultOn !== false).map(m => m.id)
  ).slice(0, 2);
  const selMets = metIds.map(id => def.metrics.find(m => m.id === id)).filter(Boolean);
  if (!selMets.length) return;

  /* Group rows by dimension field */
  const groups = new Map();
  for (const row of rows) {
    const key = String(row[dimDef.field] || '').substring(0, 10);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, { _spend:0, _clicks:0, _impressions:0, _conversions:0 });
    const g = groups.get(key);
    g._spend       += +row.spend       || 0;
    g._clicks      += +row.clicks      || 0;
    g._impressions += +row.impressions || 0;
    g._conversions += +row.conversions || 0;
  }

  const sorted  = [...groups.entries()].sort((a, b) => a[0] < b[0] ? -1 : 1);
  const labels  = sorted.map(([k]) => k);
  const PALETTE = ['#00C2B8','#F8B400','#818CF8','#34D399','#FB923C','#F472B6'];

  /* Format tick label per metric */
  const fmtTick = (fmt, v) => {
    if (fmt === 'rupiah') { if (v >= 1e6) return 'Rp '+(v/1e6).toFixed(1)+'Jt'; return 'Rp '+Math.round(v).toLocaleString('id-ID'); }
    if (fmt === 'pct')   return v.toFixed(1)+'%';
    if (v >= 1e6) return (v/1e6).toFixed(1)+'Jt';
    if (v >= 1e3) return (v/1e3).toFixed(0)+'K';
    return Math.round(v).toLocaleString('id-ID');
  };

  /* Build datasets — each metric gets its own y-axis side */
  const datasets = selMets.map((m, i) => ({
    label:           metLabels[m.id] || m.label,
    data:            sorted.map(([, g]) => m.compute(g)),
    borderColor:     m.color || PALETTE[i % PALETTE.length],
    backgroundColor: i === 0 ? (m.color || PALETTE[0]) + '1A' : 'transparent',
    borderWidth: 2,
    pointRadius: labels.length > 60 ? 0 : 3,
    tension: 0.4,
    fill: i === 0,
    yAxisID: i === 0 ? 'y' : 'y1',
    _fmt: m.fmt,
  }));

  /* X-axis tick density by dimension */
  const xMaxTicks = dimId === 'day' ? 8 : dimId === 'week' ? 10 : 12;

  /* Scales: y left, y1 right (only when 2nd metric present) */
  const scales = {
    x: {
      ...sharedScales.x,
      ticks: { ...sharedScales.x.ticks, autoSkip: true, maxRotation: 0, minRotation: 0, maxTicksLimit: xMaxTicks },
    },
    y: {
      ...sharedScales.y,
      position: 'left',
      ticks: { ...sharedScales.y.ticks, maxTicksLimit: 5, callback: v => fmtTick(datasets[0]._fmt, v) },
      afterFit(s) { if (s.width < 72) s.width = 72; },
    },
  };
  if (selMets.length === 2) {
    scales.y1 = {
      ...sharedScales.y,
      position: 'right',
      grid: { drawOnChartArea: false },
      ticks: { ...sharedScales.y.ticks, maxTicksLimit: 5, callback: v => fmtTick(datasets[1]._fmt, v) },
      afterFit(s) { if (s.width < 72) s.width = 72; },
    };
  }

  /* Destroy & recreate chart */
  const CHART_KEY_MAP = { 'ads-trend': 'adsTrend', 'overview-trend': 'overviewTrend', 'seo-trend': 'seoTrend' };
  const key = CHART_KEY_MAP[chartId];
  if (key && CHARTS[key]) { CHARTS[key].destroy(); CHARTS[key] = null; }

  const canvas = document.getElementById('chart-' + chartId);
  if (!canvas) return;

  CHARTS[key] = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { labels, datasets },
    options: { ...sharedOpts, scales },
  });

  /* Update legend */
  const legendEl = document.getElementById('legend-' + chartId);
  if (legendEl) renderLegend('legend-' + chartId, datasets);

  /* Update col count badge */
  const countEl = document.getElementById('editor-chart-col-count');
  if (countEl) countEl.textContent = `${selMets.length} METRIK`;
}

/* ── Populate chart editor panel ──────────────────────────────── */
function populateChartEditor(chartId) {
  const def      = CHART_DEFS[chartId];
  if (!def) return;
  const settings = chartColumnSettings[chartId] || {};

  /* ── Dimension segmented buttons ────────────────────────────── */
  const dimGroup = document.getElementById('editor-chart-dim-group');
  if (dimGroup) {
    const activeDim = settings._dim || def.dimensions.find(d => d.defaultOn)?.id || def.dimensions[0]?.id;
    dimGroup.innerHTML = def.dimensions.map(d =>
      `<button class="chart-dim-btn${d.id === activeDim ? ' active' : ''}" data-dim="${d.id}">${d.label}</button>`
    ).join('');
    dimGroup.querySelectorAll('.chart-dim-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        dimGroup.querySelectorAll('.chart-dim-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (!chartColumnSettings[chartId]) chartColumnSettings[chartId] = {};
        chartColumnSettings[chartId]._dim = btn.dataset.dim;
        _saveChartColumnSettings();
        _routeChartRender(chartId);
      });
    });
  }

  /* ── Metric drag list ───────────────────────────────────────── */
  const metContainer = document.getElementById('editor-chart-metric-list');
  if (!metContainer) return;

  const savedMets = settings._metOrder || [];
  const initMets  = savedMets.length
    ? savedMets.filter(id => def.metrics.find(m => m.id === id))
    : def.metrics.filter(m => m.defaultOn !== false).map(m => m.id);

  function _onMetChange(selIds) {
    /* Enforce max 2 */
    const capped = selIds.slice(0, 2);
    if (!chartColumnSettings[chartId]) chartColumnSettings[chartId] = {};
    chartColumnSettings[chartId]._metOrder  = capped;
    chartColumnSettings[chartId]._metHidden = def.metrics.filter(m => !capped.includes(m.id)).map(m => m.id);
    _saveChartColumnSettings();
    _routeChartRender(chartId);
    const countEl = document.getElementById('editor-chart-col-count');
    if (countEl) countEl.textContent = `${capped.length} METRIK`;
  }

  function _onMetRename(id, label) {
    if (!chartColumnSettings[chartId]) chartColumnSettings[chartId] = {};
    if (!chartColumnSettings[chartId]._metLabels) chartColumnSettings[chartId]._metLabels = {};
    chartColumnSettings[chartId]._metLabels[id] = label;
    _saveChartColumnSettings();
    _routeChartRender(chartId);
  }

  createDragList(metContainer, def.metrics, initMets.slice(0, 2), _onMetChange, {
    maxSelected: 2,
    getLabel:  id => (settings._metLabels || {})[id] || def.metrics.find(m => m.id === id)?.label,
    onRename:  _onMetRename,
  });

  /* Immediately render dynamic chart with current settings */
  _routeChartRender(chartId);
}

/* ── Route chart render to correct function based on data source ─ */
function _routeChartRender(chartId) {
  if (chartId === 'seo-trend') {
    if (window._gscAllRows?.length) { _renderSeoChartDynamic(); return; }
  } else {
    if (window._avoAllRows?.length) { _renderChartDynamic(chartId); return; }
  }
}

function getCardSettings(key) {
  return Object.assign({
    showComparison:  true,
    compType:        'previous-period',
    customCompFrom:  null,
    customCompTo:    null,
    titleSize:       13,
    valueSize:       28,
    pos:             null,
  }, cardSettings[key] || {});
}

function setCardSetting(key, updates) {
  if (!cardSettings[key]) cardSettings[key] = {};
  Object.assign(cardSettings[key], updates);
  _saveCardSettings();
}


// ── Apply editor settings to card DOM ────────────────────────────
function applyCardSettings(card, key) {
  if (!card) return;
  const s = getCardSettings(key);

  // ── Font sizes ─────────────────────────────────────────────────
  card.style.setProperty('--card-title-fs', s.titleSize + 'px');
  card.style.setProperty('--card-value-fs',  s.valueSize  + 'px');

  // ── Padding ────────────────────────────────────────────────────
  if (s.padding) {
    const { t=20, r=20, b=20, l=20 } = s.padding;
    card.style.padding = `${t}px ${r}px ${b}px ${l}px`;
  }

  // ── Comparison visibility ──────────────────────────────────────
  const footer = card.querySelector('.metric-footer');
  if (footer) footer.style.display = s.showComparison ? '' : 'none';

  if (s.showComparison) {
    const periodEl = card.querySelector('.metric-period');
    if (periodEl) {
      if (s.compType === 'previous-year') {
        // Derive previous-year label from active date range
        const ar = window._avoActiveDateRange;
        if (ar) {
          const ID_M = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
          const ID_S = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agt','Sep','Okt','Nov','Des'];
          const sd = ar.start, ed = ar.end, py = sd.getFullYear() - 1;
          const isFullMon = sd.getDate() === 1 &&
            ed.getMonth() === sd.getMonth() && ed.getFullYear() === sd.getFullYear() &&
            ed.getDate() === new Date(sd.getFullYear(), sd.getMonth() + 1, 0).getDate();
          if (isFullMon) {
            periodEl.textContent = 'vs ' + ID_M[sd.getMonth()] + ' ' + py;
          } else if (sd.getMonth() === ed.getMonth()) {
            periodEl.textContent = 'vs ' + sd.getDate() + '–' + ed.getDate() + ' ' + ID_S[sd.getMonth()] + ' ' + py;
          } else {
            periodEl.textContent = 'vs ' + sd.getDate() + ' ' + ID_S[sd.getMonth()] + ' – ' + ed.getDate() + ' ' + ID_S[ed.getMonth()] + ' ' + py;
          }
        }
      } else if (s.compType === 'custom' && s.customCompFrom && s.customCompTo) {
        const cs = new Date(s.customCompFrom + 'T00:00:00');
        const ce = new Date(s.customCompTo   + 'T00:00:00');
        if (typeof window.formatCompLabelID === 'function') {
          periodEl.textContent = 'vs ' + window.formatCompLabelID(cs, ce);
        } else {
          periodEl.textContent = 'vs ' + s.customCompFrom + ' – ' + s.customCompTo;
        }
      }
      // 'previous-period': label already set by avoApplyDateRange / applyPeriod
    }
  }
}

// ── Populate editor toggles/inputs from stored settings ──────────
function populateEditorFromCard(card) {
  if (!card?.dataset?.metricKey) return;
  const key = card.dataset.metricKey;
  const s   = getCardSettings(key);

  const compToggle  = document.getElementById('editor-comparison-toggle');
  const compType    = document.getElementById('editor-comparison-type');
  const compField   = document.getElementById('editor-comp-type-field');
  const customDates = document.getElementById('editor-comp-custom-dates');
  const compFrom    = document.getElementById('editor-comp-from');
  const compTo      = document.getElementById('editor-comp-to');

  if (compToggle)  compToggle.checked      = s.showComparison;
  if (compType)    compType.value          = s.compType;
  if (compField)   compField.style.display = s.showComparison ? '' : 'none';
  if (customDates) customDates.style.display = (s.showComparison && s.compType === 'custom') ? '' : 'none';
  if (compFrom && s.customCompFrom) compFrom.value = s.customCompFrom;
  if (compTo   && s.customCompTo)   compTo.value   = s.customCompTo;

  // Font size buttons
  document.querySelectorAll('.editor-size-btn[data-fs-target="title"]').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.fs) === (s.titleSize || 13));
  });
  document.querySelectorAll('.editor-size-btn[data-fs-target="value"]').forEach(b => {
    b.classList.toggle('active', parseInt(b.dataset.fs) === (s.valueSize || 28));
  });
}

// ── Wire editor comparison controls → update settings → apply ────
document.getElementById('editor-comparison-toggle')?.addEventListener('change', function() {
  if (!_editingCard?.dataset?.metricKey) return;
  const key = _editingCard.dataset.metricKey;
  setCardSetting(key, { showComparison: this.checked });
  const typeField   = document.getElementById('editor-comp-type-field');
  const customDates = document.getElementById('editor-comp-custom-dates');
  if (typeField)   typeField.style.display   = this.checked ? '' : 'none';
  if (customDates) customDates.style.display = (this.checked && getCardSettings(key).compType === 'custom') ? '' : 'none';
  applyCardSettings(_editingCard, key);
});

document.getElementById('editor-comparison-type')?.addEventListener('change', function() {
  if (!_editingCard?.dataset?.metricKey) return;
  const key = _editingCard.dataset.metricKey;
  setCardSetting(key, { compType: this.value });
  const customDates = document.getElementById('editor-comp-custom-dates');
  if (customDates) customDates.style.display = this.value === 'custom' ? '' : 'none';
  applyCardSettings(_editingCard, key);
});

document.getElementById('editor-comp-from')?.addEventListener('change', function() {
  if (!_editingCard?.dataset?.metricKey) return;
  const key = _editingCard.dataset.metricKey;
  setCardSetting(key, { customCompFrom: this.value || null });
  applyCardSettings(_editingCard, key);
});

document.getElementById('editor-comp-to')?.addEventListener('change', function() {
  if (!_editingCard?.dataset?.metricKey) return;
  const key = _editingCard.dataset.metricKey;
  setCardSetting(key, { customCompTo: this.value || null });
  applyCardSettings(_editingCard, key);
});

/* ── Editor: Font-Size buttons ─────────────────────────────────── */
document.addEventListener('click', e => {
  const btn = e.target.closest('.editor-size-btn');
  if (!btn) return;
  if (!_editingCard?.dataset?.metricKey) return;
  const target  = btn.dataset.fsTarget;   // 'title' | 'value'
  const size    = parseInt(btn.dataset.fs, 10);
  const cardKey = _editingCard.dataset.metricKey;
  // Highlight active button in this group
  document.querySelectorAll(`.editor-size-btn[data-fs-target="${target}"]`)
          .forEach(b => b.classList.toggle('active', b === btn));
  // Persist + apply
  setCardSetting(cardKey, target === 'title' ? { titleSize: size } : { valueSize: size });
  applyCardSettings(_editingCard, cardKey);
});

/* ── Free Layout: Drag + Resize + Smart Guides ─────────────────── */
(function initFreeLayout() {
  const LS_KEY    = 'avo_card_layout_v1';
  const LS_PINNED = 'avo_layout_pinned_v1';  // flag: keep absolute positions in view mode
  const GRID     = 8;   // snap-to-grid px
  const SNAP_THR = 10;  // edge-snap threshold px
  const _iInst   = new WeakMap();
  const _rObs    = new WeakMap();
  const _guideLayers = new WeakMap();  // grid → guide-layer el
  const _history = [];                 // undo stack {key, left, top, w, h}[]
  const MAX_HIST = 20;

  /* ---------- grid snap ---------- */
  const sg = v => Math.round(v / GRID) * GRID;

  /* ---------- persistence ---------- */
  function _loadLayout() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch(e) { return {}; }
  }
  function _saveLayout() {
    // Merge into existing saved data so sequential exitFreeLayout calls
    // (one per grid) don't overwrite positions saved by the previous grids.
    const data = _loadLayout();
    const hiddenSet = new Set(Array.isArray(data.__hidden) ? data.__hidden : []);

    document.querySelectorAll('.grid.free-layout .metric-card[data-metric-key]').forEach(card => {
      const key = card.dataset.metricKey;
      if (!key) return;
      // Skip cards with invalid dimensions to prevent corrupt saves
      const w = parseInt(card.style.width);
      const h = parseInt(card.style.height);
      if (w < 50 || h < 30) return;
      data[key] = { left: card.style.left, top: card.style.top,
                    width: card.style.width, height: card.style.height };
      if (card.dataset.lsHidden === '1') {
        hiddenSet.add(key);
      } else {
        hiddenSet.delete(key);
      }
    });
    data.__hidden = Array.from(hiddenSet);
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch(e) {}
  }

  /* ---------- undo history ---------- */
  function _pushHistory(card) {
    const snap = { card, left: card.style.left, top: card.style.top,
                   width: card.style.width, height: card.style.height };
    _history.push(snap);
    if (_history.length > MAX_HIST) _history.shift();
  }
  function _undoLayout() {
    const snap = _history.pop();
    if (!snap) return;
    const { card, left, top, width, height } = snap;
    card.style.left   = left;
    card.style.top    = top;
    card.style.width  = width;
    card.style.height = height;
    resizeCardContent(card);
    _saveLayout();
  }
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && document.body.classList.contains('edit-mode')) {
      e.preventDefault();
      _undoLayout();
    }
  });

  /* ---------- chart / sparkline refresh ---------- */
  function resizeCardContent(card) {
    card.querySelectorAll('canvas').forEach(canvas => {
      const ci = (typeof Chart !== 'undefined' && Chart.getChart) ? Chart.getChart(canvas) : null;
      if (ci) ci.resize();
      if (canvas._sparkRender) canvas._sparkRender();
    });
  }
  window.resizeCardContent = resizeCardContent;

  /* ---------- guide layer ---------- */
  function _getGuideLayer(grid) {
    if (_guideLayers.has(grid)) return _guideLayers.get(grid);
    const el = document.createElement('div');
    el.className = 'snap-guide-layer';
    grid.appendChild(el);
    _guideLayers.set(grid, el);
    return el;
  }
  function _clearGuides(grid) {
    if (_guideLayers.has(grid)) _guideLayers.get(grid).innerHTML = '';
  }
  function _removeGuideLayer(grid) {
    if (_guideLayers.has(grid)) { _guideLayers.get(grid).remove(); _guideLayers.delete(grid); }
  }

  /* ---------- get sibling card rects ---------- */
  function _getRects(grid, exclude) {
    return Array.from(grid.querySelectorAll('.metric-card'))
      .filter(c => c !== exclude)
      .map(c => {
        const l = parseFloat(c.style.left)   || 0;
        const t = parseFloat(c.style.top)    || 0;
        const w = parseFloat(c.style.width)  || c.offsetWidth;
        const h = parseFloat(c.style.height) || c.offsetHeight;
        return { l, t, w, h, r: l + w, b: t + h };
      });
  }

  /* ---------- snap nearest value to candidate list ---------- */
  function _nearestSnap(val, candidates) {
    let best = null, bestD = SNAP_THR;
    candidates.forEach(v => {
      const d = Math.abs(val - v);
      if (d < bestD) { bestD = d; best = v; }
    });
    return best;
  }

  /* ---------- compute snapped position + build guides ---------- */
  function _applySnap(card, grid, x, y, w, h, isDrag, _pre) {
    const rects = _pre || _getRects(grid, card);
    // Collect all sibling edges as snap targets
    const xs = [], ys = [];
    rects.forEach(r => { xs.push(r.l, r.r); ys.push(r.t, r.b); });

    const right  = x + w;
    const bottom = y + h;
    const guides = [];

    if (isDrag) {
      // Snap left edge or right edge (prefer left)
      const sl = _nearestSnap(x, xs);
      const sr = _nearestSnap(right, xs);
      if (sl !== null)      { x = sl;     guides.push({ type: 'v', pos: sl }); }
      else if (sr !== null) { x = sr - w; guides.push({ type: 'v', pos: sr }); }

      // Snap top edge or bottom edge
      const st = _nearestSnap(y, ys);
      const sb = _nearestSnap(bottom, ys);
      if (st !== null)      { y = st;     guides.push({ type: 'h', pos: st }); }
      else if (sb !== null) { y = sb - h; guides.push({ type: 'h', pos: sb }); }
    } else {
      // Resize: snap right and bottom edges only
      const sr = _nearestSnap(right, xs);
      if (sr !== null) { w = sr - x; guides.push({ type: 'v', pos: sr }); }

      const sb = _nearestSnap(bottom, ys);
      if (sb !== null) { h = sb - y; guides.push({ type: 'h', pos: sb }); }
    }

    // Render guide lines
    const layer = _getGuideLayer(grid);
    layer.innerHTML = '';
    guides.forEach(g => {
      const line = document.createElement('div');
      line.className = 'snap-guide snap-guide-' + g.type;
      if (g.type === 'v') line.style.cssText = `left:${g.pos}px;top:0;height:100%;`;
      else                line.style.cssText = `top:${g.pos}px;left:0;width:100%;`;
      layer.appendChild(line);
    });

    return { x, y, w, h };
  }

  /* ---------- overlap detection ---------- */
  function _checkOverlap(card, grid, _pre) {
    const cx = parseFloat(card.style.left)   || 0;
    const cy = parseFloat(card.style.top)    || 0;
    const cw = parseFloat(card.style.width)  || card.offsetWidth;
    const ch = parseFloat(card.style.height) || card.offsetHeight;
    const overlap = (_pre || _getRects(grid, card)).some(r =>
      cx < r.r - 4 && cx + cw > r.l + 4 && cy < r.b - 4 && cy + ch > r.t + 4
    );
    card.classList.toggle('card-overlap', overlap);
  }

  /* ---------- update grid min-height to contain all cards ---------- */
  function _updateGridHeight(grid) {
    let maxBottom = 200;
    grid.querySelectorAll('.metric-card').forEach(c => {
      const b = (parseFloat(c.style.top) || 0) + (parseFloat(c.style.height) || c.offsetHeight);
      if (b > maxBottom) maxBottom = b;
    });
    grid.style.minHeight = (maxBottom + 24) + 'px';
  }

  /* ---------- interact.js per card ---------- */
  function _initInteract(card, grid) {
    if (!window.interact || _iInst.has(card)) return;

    let _r = null; // rects cached per gesture — avoids per-frame DOM reads

    const inst = interact(card)
      .draggable({
        allowFrom: '.drag-handle',
        inertia:   { resistance: 8, minSpeed: 100, endSpeed: 30 }, // light momentum
        modifiers: [interact.modifiers.restrictRect({ restriction: grid, endOnly: true })],
        listeners: {
          start() {
            _r = _getRects(grid, card); // snapshot once
            _pushHistory(card);
            card.classList.add('being-dragged');
          },
          move(ev) {
            let x = sg((parseFloat(card.style.left) || 0) + ev.dx);
            let y = sg((parseFloat(card.style.top)  || 0) + ev.dy);
            const w = parseFloat(card.style.width)  || card.offsetWidth;
            const h = parseFloat(card.style.height) || card.offsetHeight;
            const s = _applySnap(card, grid, x, y, w, h, true, _r);
            card.style.left = s.x + 'px';
            card.style.top  = s.y + 'px';
            _checkOverlap(card, grid, _r);
            _updateGridHeight(grid);
          },
          end() {
            _r = null;
            card.classList.remove('being-dragged');
            card.classList.remove('card-overlap');
            _clearGuides(grid);
            _saveLayout();
          }
        }
      })
      .resizable({
        edges:     { right: true, bottom: true, left: false, top: false },
        inertia:   false,
        modifiers: [interact.modifiers.restrictSize({ min: { width: 180, height: 120 } })],
        listeners: {
          start() {
            _r = _getRects(grid, card);
            _pushHistory(card);
            card.classList.add('being-resized');
          },
          move(ev) {
            let w = sg(ev.rect.width);
            let h = sg(ev.rect.height);
            const x = parseFloat(card.style.left) || 0;
            const y = parseFloat(card.style.top)  || 0;
            const s = _applySnap(card, grid, x, y, w, h, false, _r);
            card.style.width  = (s.w || w) + 'px';
            card.style.height = (s.h || h) + 'px';
            _checkOverlap(card, grid, _r);
            resizeCardContent(card);
            _updateGridHeight(grid);
          },
          end() {
            _r = null;
            card.classList.remove('being-resized');
            card.classList.remove('card-overlap');
            _clearGuides(grid);
            resizeCardContent(card);
            _saveLayout();
          }
        }
      });

    _iInst.set(card, inst);
    // Only resize charts when NOT actively dragging/resizing — avoids mid-gesture reflows
    const ro = new ResizeObserver(() => {
      if (!card.classList.contains('being-dragged') && !card.classList.contains('being-resized')) {
        resizeCardContent(card);
      }
    });
    ro.observe(card);
    _rObs.set(card, ro);
  }

  function _destroyInteract(card) {
    const inst = _iInst.get(card);
    if (inst) { try { inst.unset(); } catch(e) {} _iInst.delete(card); }
    const ro = _rObs.get(card);
    if (ro) { ro.disconnect(); _rObs.delete(card); }
  }

  /* ---------- enter / exit ---------- */
  window.enterFreeLayout = function(grid) {
    if (!grid.classList.contains('grid')) return;
    if (grid.classList.contains('free-layout')) return;
    const cards = Array.from(grid.querySelectorAll('.metric-card'));
    if (!cards.length) return;

    // If grid was in pinned-layout (view mode with saved absolute positions),
    // just upgrade the class and init interact — positions are already set
    if (grid.classList.contains('pinned-layout')) {
      grid.classList.remove('pinned-layout');
      grid.classList.add('free-layout');
      _updateGridHeight(grid);
      cards.forEach(card => _initInteract(card, grid));
      return;
    }

    grid.style.minHeight = grid.offsetHeight + 'px';

    const gridRect  = grid.getBoundingClientRect();
    const snapshots = cards.map(card => {
      const r = card.getBoundingClientRect();
      return { card, left: r.left - gridRect.left, top: r.top - gridRect.top,
               width: r.width, height: r.height };
    });

    grid.classList.add('free-layout');
    const saved = _loadLayout();

    snapshots.forEach(({ card, left, top, width, height }) => {
      const key = card.dataset.metricKey;
      const s   = key && saved[key];
      // Guard: ignore saved dimensions that are zero or impossibly small (corrupt data)
      const validSaved = s && parseInt(s.width) >= 50 && parseInt(s.height) >= 30;
      card.style.left   = validSaved ? s.left   : sg(left)   + 'px';
      card.style.top    = validSaved ? s.top    : sg(top)    + 'px';
      card.style.width  = validSaved ? s.width  : sg(width)  + 'px';
      card.style.height = validSaved ? s.height : sg(height) + 'px';
    });

    _updateGridHeight(grid);
    cards.forEach(card => _initInteract(card, grid));
  };

  window.exitFreeLayout = function(grid) {
    if (!grid.classList.contains('free-layout')) return;
    _saveLayout();
    const cards = Array.from(grid.querySelectorAll('.metric-card'));
    cards.forEach(card => {
      _destroyInteract(card);
      card.classList.remove('card-overlap');
    });
    _removeGuideLayer(grid);
    grid.classList.remove('free-layout');

    if (localStorage.getItem(LS_PINNED) === '1') {
      // Keep absolute positions — switch to pinned-layout (view mode with saved layout)
      grid.classList.add('pinned-layout');
      setTimeout(() => cards.forEach(c => {
        if (c.style.display !== 'none') resizeCardContent(c);
      }), 120);
    } else {
      // Clear inline styles → return to CSS grid flow
      cards.forEach(card => {
        card.style.left = card.style.top = card.style.width = card.style.height = '';
      });
      grid.style.minHeight = '';
      setTimeout(() => cards.forEach(resizeCardContent), 120);
    }
  };

  /* ---------- auto-arrange ---------- */
  window.autoArrangeLayout = function() {
    document.querySelectorAll('.grid.free-layout').forEach(grid => {
      const cards  = Array.from(grid.querySelectorAll('.metric-card:not([style*="display: none"])'));
      const cols   = 2;
      const gap    = 16;
      const gridW  = grid.offsetWidth - gap * 2;
      const colW   = sg(gridW / cols - gap / 2);
      const rowH   = sg(cards.reduce((max, c) => Math.max(max, c.offsetHeight), 200));

      cards.forEach((card, i) => {
        _pushHistory(card);
        const col = i % cols;
        const row = Math.floor(i / cols);
        card.style.left   = sg(gap + col * (colW + gap)) + 'px';
        card.style.top    = sg(gap + row * (rowH + gap)) + 'px';
        card.style.width  = colW + 'px';
        card.style.height = rowH + 'px';
      });

      _updateGridHeight(grid);
      _saveLayout();
      setTimeout(() => cards.forEach(resizeCardContent), 80);
    });
  };

  /* ---------- pinned layout — persist positions in view mode ---------- */
  function _applyPinnedOnLoad() {
    if (localStorage.getItem(LS_PINNED) !== '1') return;
    const saved = _loadLayout();
    const keys  = Object.keys(saved).filter(k => k !== '__hidden');
    if (!keys.length) return;
    const hiddenKeys = Array.isArray(saved.__hidden) ? saved.__hidden : [];

    document.querySelectorAll('.grid').forEach(grid => {
      const cards = Array.from(grid.querySelectorAll('.metric-card[data-metric-key]'));
      if (!cards.length) return;
      let applied = false;
      cards.forEach(card => {
        const key = card.dataset.metricKey;
        const s   = key && saved[key];
        // Guard: skip corrupt (zero-size) saved dimensions
        if (s && s.left && parseInt(s.width) >= 50 && parseInt(s.height) >= 30) {
          card.style.left   = s.left;
          card.style.top    = s.top;
          card.style.width  = s.width;
          card.style.height = s.height;
          applied = true;
        }
        if (hiddenKeys.includes(key)) {
          card.style.display = 'none';
          card.dataset.lsHidden = '1';
        }
      });
      if (applied) {
        grid.classList.add('pinned-layout');
        _updateGridHeight(grid);
        setTimeout(() => cards.forEach(c => {
          if (c.style.display !== 'none') resizeCardContent(c);
        }), 200);
      }
    });
  }

  // Expose for Layout Studio, toolbar buttons, and dynamic card manager
  window._saveLayout = _saveLayout;
  window._reapplyPinnedLayout = _applyPinnedOnLoad;
  window._initInteractCard = function(card, grid) { _initInteract(card, grid); };

  window.clearPinnedLayout = function() {
    localStorage.removeItem(LS_PINNED);
    document.querySelectorAll('.grid.pinned-layout').forEach(grid => {
      const cards = Array.from(grid.querySelectorAll('.metric-card'));
      cards.forEach(card => {
        card.style.left = card.style.top = card.style.width = card.style.height = '';
        card.style.display = '';
        delete card.dataset.lsHidden;
      });
      grid.classList.remove('pinned-layout');
      grid.style.minHeight = '';
      setTimeout(() => cards.forEach(resizeCardContent), 120);
    });
    document.querySelectorAll('.ls-show-all').forEach(el => el.remove());
  };

  // On load: restore pinned layout if it was previously saved
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _applyPinnedOnLoad);
  } else {
    setTimeout(_applyPinnedOnLoad, 80); // small defer so card DOM is fully rendered
  }
})();

/* ── Layout Studio — Templates + Report Configurator ───────────── */
(function initLayoutStudio() {

  /* ── SVG template previews ─────────────────────────────────── */
  const FILL = 'fill="#00C2B8" fill-opacity';
  const STR  = 'stroke="#00C2B8" stroke-opacity';
  const RECT = (x,y,w,h,fo,so) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" ${FILL}="${fo}" ${STR}="${so}" stroke-width="0.7"/>`;

  const TEMPLATES = [
    {
      id: 'compact', name: 'Compact', desc: '4 kolom · card kecil',
      cols: 4, gap: 10, height: 168,
      svg: `<svg viewBox="0 0 80 54" xmlns="http://www.w3.org/2000/svg">
        ${RECT(1,1,17,24,.3,.7)}${RECT(21,1,17,24,.3,.7)}${RECT(41,1,17,24,.3,.7)}${RECT(61,1,18,24,.3,.7)}
        ${RECT(1,28,17,25,.12,.35)}${RECT(21,28,17,25,.12,.35)}${RECT(41,28,17,25,.12,.35)}${RECT(61,28,18,25,.12,.35)}
      </svg>`,
    },
    {
      id: 'balanced', name: 'Balanced', desc: '2 kolom · ukuran sedang',
      cols: 2, gap: 14, height: 216,
      svg: `<svg viewBox="0 0 80 54" xmlns="http://www.w3.org/2000/svg">
        ${RECT(1,1,37,24,.3,.7)}${RECT(42,1,37,24,.3,.7)}
        ${RECT(1,28,37,25,.12,.35)}${RECT(42,28,37,25,.12,.35)}
      </svg>`,
    },
    {
      id: 'spacious', name: 'Spacious', desc: '2 kolom · card besar',
      cols: 2, gap: 16, height: 280,
      svg: `<svg viewBox="0 0 80 54" xmlns="http://www.w3.org/2000/svg">
        ${RECT(1,1,37,50,.3,.7)}${RECT(42,1,37,50,.3,.7)}
        <line x1="40" y1="4" x2="40" y2="50" stroke="rgba(0,194,184,0.2)" stroke-width="0.5" stroke-dasharray="2,2"/>
      </svg>`,
    },
    {
      id: 'magazine', name: 'Magazine', desc: '1 hero lebar + 3 kolom',
      type: 'magazine',
      svg: `<svg viewBox="0 0 80 54" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="78" height="20" rx="2" fill="#F8B400" fill-opacity="0.25" stroke="#F8B400" stroke-opacity="0.65" stroke-width="0.7"/>
        ${RECT(1,24,23,29,.25,.6)}${RECT(28,24,23,29,.25,.6)}${RECT(55,24,24,29,.25,.6)}
      </svg>`,
    },
    {
      id: 'wide', name: 'Wide', desc: '1 kolom · full lebar',
      cols: 1, gap: 12, height: 152,
      svg: `<svg viewBox="0 0 80 54" xmlns="http://www.w3.org/2000/svg">
        ${RECT(1,1,78,14,.3,.7)}
        ${RECT(1,18,78,14,.2,.5)}
        ${RECT(1,35,78,18,.12,.35)}
      </svg>`,
    },
  ];

  let _selTpl   = 'balanced';
  let _selCount = 0; // 0 = all

  /* ── component toggles ──────────────────────────────────────── */
  const LS_COMP = 'avo_comp_visibility_v1';

  const COMPONENTS = [
    { id: 'trend-overview', label: 'Overview · Trend Chart',    inner: '#chart-overview-trend'  },
    { id: 'channel-overview', label: 'Overview · Channel Donut', inner: '#chart-channel-donut' },
    { id: 'trend-ads',      label: 'Ads · Trend Chart',          inner: '#chart-ads-trend'       },
    { id: 'platform-ads',   label: 'Ads · Platform Chart',       inner: '#chart-ads-platform'    },
    { id: 'funnel-ads',     label: 'Ads · Conversion Funnel',    inner: '.funnel-card .card-header' },
    { id: 'table-ads',      label: 'Ads · Campaign Table',       inner: '#ads-table'             },
    { id: 'trend-seo',      label: 'SEO · Trend Chart',          inner: '#chart-seo-trend'       },
    { id: 'ranking-seo',    label: 'SEO · Ranking Chart',        inner: '#chart-seo-ranking'     },
    { id: 'table-seo',      label: 'SEO · Keyword Table',        inner: '#seo-table'             },
  ];

  function _loadCompState() {
    try { return JSON.parse(localStorage.getItem(LS_COMP) || '{}'); } catch { return {}; }
  }
  function _saveCompState(state) {
    try { localStorage.setItem(LS_COMP, JSON.stringify(state)); } catch {}
  }
  function _getCompCard(comp) {
    const inner = document.querySelector(comp.inner);
    if (!inner) return null;
    return inner.closest('.card, .funnel-card') || null;
  }
  function applyCompState(state) {
    COMPONENTS.forEach(comp => {
      const card = _getCompCard(comp);
      if (!card) return;
      card.style.display = (state[comp.id] === false) ? 'none' : '';
    });
  }
  // Apply saved comp state on load
  applyCompState(_loadCompState());

  /* ── build modal ────────────────────────────────────────────── */
  function _buildModal() {
    if (document.getElementById('ls-modal')) return;
    const compState = _loadCompState();

    const tplHTML = TEMPLATES.map(t => `
      <button class="ls-tpl-btn ${t.id === _selTpl ? 'active' : ''}" data-tpl="${t.id}" title="${t.desc}">
        <div class="ls-tpl-preview">${t.svg}</div>
        <div class="ls-tpl-name">${t.name}</div>
        <div class="ls-tpl-desc">${t.desc}</div>
      </button>`).join('');

    const countBtns = [
      { v:2, l:'2' }, { v:4, l:'4' }, { v:6, l:'6' }, { v:8, l:'8' }, { v:0, l:'Semua' }
    ].map(b => `<button class="ls-cnt-btn${b.v===_selCount?' active':''}" data-count="${b.v}">${b.l}</button>`).join('');

    // Only show components that have a corresponding element in DOM
    const availComps = COMPONENTS.filter(c => _getCompCard(c));
    const compHTML = availComps.length ? availComps.map(c => {
      const checked = compState[c.id] !== false;
      return `<label class="ls-comp-row">
        <input type="checkbox" class="ls-comp-chk" data-comp="${c.id}" ${checked ? 'checked' : ''}>
        <span class="ls-comp-label">${c.label}</span>
      </label>`;
    }).join('') : '<p class="ls-cnt-hint">Tidak ada komponen tersedia di halaman ini.</p>';

    const modal = document.createElement('div');
    modal.id = 'ls-modal';
    modal.className = 'ls-modal-overlay';
    modal.innerHTML = `
      <div class="ls-modal">
        <div class="ls-modal-header">
          <div class="ls-modal-icon">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
            </svg>
          </div>
          <div>
            <div class="ls-modal-title">Layout Studio</div>
            <div class="ls-modal-sub">Pilih template, jumlah card, dan komponen</div>
          </div>
          <button class="ls-close-btn" id="ls-close">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="ls-modal-body">
          <div class="ls-section-label">TEMPLATE LAYOUT</div>
          <div class="ls-tpl-grid">${tplHTML}</div>

          <div class="ls-section-label" style="margin-top:20px">JUMLAH METRIC CARD</div>
          <div class="ls-cnt-row">${countBtns}</div>
          <p class="ls-cnt-hint">Card di luar jumlah yang dipilih akan disembunyikan</p>

          <div class="ls-section-label" style="margin-top:20px">KOMPONEN HALAMAN</div>
          <div class="ls-comp-grid">${compHTML}</div>
        </div>

        <div class="ls-modal-footer">
          <button class="ls-btn-cancel" id="ls-cancel">Batal</button>
          <button class="ls-btn-apply" id="ls-apply">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
            Terapkan Layout
          </button>
        </div>
      </div>`;

    document.body.appendChild(modal);

    // Template selection
    modal.querySelectorAll('.ls-tpl-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.ls-tpl-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _selTpl = btn.dataset.tpl;
      });
    });

    // Card count selection
    modal.querySelectorAll('.ls-cnt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.ls-cnt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _selCount = parseInt(btn.dataset.count, 10);
      });
    });

    modal.querySelector('#ls-close').addEventListener('click',  _closeStudio);
    modal.querySelector('#ls-cancel').addEventListener('click', _closeStudio);
    modal.querySelector('#ls-apply').addEventListener('click',  () => { _applyLayout(); _closeStudio(); });
    modal.addEventListener('click', e => { if (e.target === modal) _closeStudio(); });

    // Live component preview: toggle visibility immediately on checkbox click
    modal.querySelectorAll('.ls-comp-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        const comp = COMPONENTS.find(c => c.id === chk.dataset.comp);
        if (!comp) return;
        const card = _getCompCard(comp);
        if (card) card.style.display = chk.checked ? '' : 'none';
      });
    });
  }

  function _openStudio() {
    _buildModal();
    requestAnimationFrame(() => {
      document.getElementById('ls-modal')?.classList.add('open');
    });
  }
  function _closeStudio() {
    const m = document.getElementById('ls-modal');
    if (!m) return;
    m.classList.remove('open');
    setTimeout(() => m?.remove(), 260);
  }

  /* ── apply selected template to current free-layout grids ──── */
  function _applyLayout() {
    const tpl = TEMPLATES.find(t => t.id === _selTpl);
    if (!tpl) return;

    // Collect component visibility from checkboxes
    const modal = document.getElementById('ls-modal');
    const compState = _loadCompState();
    if (modal) {
      modal.querySelectorAll('.ls-comp-chk').forEach(chk => {
        compState[chk.dataset.comp] = chk.checked;
      });
      _saveCompState(compState);
      applyCompState(compState);
    }

    document.querySelectorAll('.grid.free-layout').forEach(grid => {
      // Only count visible cards (not display:none from comp toggles)
      const all    = Array.from(grid.querySelectorAll('.metric-card'));
      const count  = _selCount || all.length;
      const active = all.slice(0, count);
      const hidden = all.slice(count);

      // Show/hide based on count
      active.forEach(c => { delete c.dataset.lsHidden; c.style.display = ''; });
      hidden.forEach(c => { c.dataset.lsHidden = '1'; c.style.display = 'none'; });

      const gridW = grid.offsetWidth;
      const gap   = tpl.gap || 14;

      if (tpl.type === 'magazine') {
        // Row 1: full-width hero
        const heroH = 240;
        if (active[0]) {
          _pushHistoryExt(active[0]);
          active[0].style.left   = gap + 'px';
          active[0].style.top    = gap + 'px';
          active[0].style.width  = (gridW - gap * 2) + 'px';
          active[0].style.height = heroH + 'px';
        }
        // Remaining in 3 columns
        const sub = active.slice(1);
        const cols3 = 3, colW3 = Math.floor((gridW - gap * (cols3 + 1)) / cols3);
        sub.forEach((card, i) => {
          _pushHistoryExt(card);
          const col = i % cols3, row = Math.floor(i / cols3);
          card.style.left   = (gap + col * (colW3 + gap)) + 'px';
          card.style.top    = (gap + heroH + gap + row * (200 + gap)) + 'px';
          card.style.width  = colW3 + 'px';
          card.style.height = '200px';
        });
      } else {
        const cols = tpl.cols || 2;
        const colW = Math.floor((gridW - gap * (cols + 1)) / cols);
        const h    = tpl.height || 216;
        active.forEach((card, i) => {
          _pushHistoryExt(card);
          const col = i % cols, row = Math.floor(i / cols);
          card.style.left   = (gap + col * (colW + gap)) + 'px';
          card.style.top    = (gap + row * (h + gap)) + 'px';
          card.style.width  = colW + 'px';
          card.style.height = h + 'px';
        });
      }

      // If any hidden cards exist, add a "show all" hint at the bottom
      _refreshShowAllHint(grid, hidden);
      _updateGridHeightExt(grid);
      // _saveLayout is now exposed on window from initFreeLayout
      if (typeof window._saveLayout === 'function') window._saveLayout();
      setTimeout(() => active.forEach(c => {
        if (c.style.display !== 'none') window.resizeCardContent?.(c);
      }), 100);
    });
  }

  function _pushHistoryExt(card) {
    // Bridge into initFreeLayout's history — call the exposed autoArrange path
    // (history is module-scoped; we trigger it via a small dispatch)
    card.dispatchEvent(new CustomEvent('ls:pushhistory', { bubbles: false }));
  }

  function _updateGridHeightExt(grid) {
    let max = 200;
    grid.querySelectorAll('.metric-card').forEach(c => {
      if (c.style.display === 'none') return;
      const b = (parseFloat(c.style.top)||0) + (parseFloat(c.style.height)||c.offsetHeight);
      if (b > max) max = b;
    });
    grid.style.minHeight = (max + 24) + 'px';
  }

  function _refreshShowAllHint(grid, hidden) {
    grid.querySelector('.ls-show-all')?.remove();
    if (!hidden.length) return;
    const hint = document.createElement('button');
    hint.className = 'ls-show-all';
    hint.textContent = `+ Tampilkan ${hidden.length} card tersembunyi`;
    hint.addEventListener('click', () => {
      hidden.forEach(c => { c.style.display = ''; delete c.dataset.lsHidden; });
      hint.remove();
      _updateGridHeightExt(grid);
    });
    grid.appendChild(hint);
  }

  window.openLayoutStudio = _openStudio;
  window._lsApplyLayout   = _applyLayout;

  // Restore hidden cards when exiting edit mode
  document.addEventListener('click', e => {
    if (e.target.id === 'btn-edit-mode' && !document.body.classList.contains('edit-mode')) return;
    // exitFreeLayout already clears styles, hidden cards come back naturally
  });
})();

/* ── Mac Dock Magnification ────────────────────────────────────── */
(function initDockMagnification() {
  const MAX_SCALE = 1.10;   // peak scale on hovered card
  const SIGMA     = 150;    // px — spread of magnification falloff
  const MIN_SCALE = 0.965;  // adjacent cards shrink slightly

  function applyDock(grid) {
    const cards = Array.from(grid.querySelectorAll('.metric-card, .card'));
    if (!cards.length) return;

    let _rects = null;   // cached once per mouseenter — never read on mousemove
    let _rafId  = 0;

    // Cache all bounding rects ONCE when the mouse enters the grid (not per-frame)
    grid.addEventListener('mouseenter', () => {
      _rects = cards.map(c => {
        const r = c.getBoundingClientRect();
        return { left: r.left, top: r.top, width: r.width, height: r.height };
      });
      // Set willChange once on enter (GPU layer created once, not recreated every frame)
      cards.forEach(c => { c.style.willChange = 'transform'; });
    });

    // Throttle via rAF — at most one DOM write per animation frame
    grid.addEventListener('mousemove', (e) => {
      // Skip magnification while dragging/resizing — interact.js controls transforms
      if (document.body.classList.contains('edit-mode')) return;
      if (!_rects) return;
      cancelAnimationFrame(_rafId);
      const mx = e.clientX, my = e.clientY;
      _rafId = requestAnimationFrame(() => {
        cards.forEach((card, i) => {
          const r = _rects[i];
          if (!r) return;
          const cx = r.left + r.width  / 2;
          const cy = r.top  + r.height / 2;
          const d2 = (mx - cx) * (mx - cx) + (my - cy) * (my - cy);
          const gaussian = Math.exp(-d2 / (2 * SIGMA * SIGMA));
          const scale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * gaussian;
          card.style.transform = `scale(${scale.toFixed(4)})`;
          // Keep z-index below report-banner (150) — max 10 is safe
          card.style.zIndex    = scale > 1.01 ? '10' : '';
        });
      });
    });

    // Reset all transforms and release GPU layers on leave
    grid.addEventListener('mouseleave', () => {
      cancelAnimationFrame(_rafId);
      _rects = null;
      cards.forEach(card => {
        card.style.transform  = '';
        card.style.zIndex     = '';
        card.style.willChange = '';
      });
    });
  }

  // Apply to all grid containers now and whenever a new page is lazily initialised
  document.querySelectorAll('.grid').forEach(applyDock);
  document.addEventListener('avo:pageShown', e => {
    const page = e.detail?.pageId;
    if (page) {
      document.getElementById('page-' + page)?.querySelectorAll('.grid').forEach(applyDock);
    }
  });
})();

/* ── Part G1: Escape exits present mode — handled by exitPresentMode() + fullscreenchange ── */
