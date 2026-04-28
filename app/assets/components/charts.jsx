// Reportive — shared chart primitives.
// Stays close to the existing hand-rolled SVG style in chrome.jsx / screen-dashboard.
// All charts: no axes labels by default, AVQ palette, tabular-nums callouts.

// ─── MiniLine / MiniArea ──────────────────────────────────────────
// Single-series line with optional gradient area fill. Expects data[].
const MiniLine = ({ data, w = 240, h = 72, color = 'var(--avo-teal)', fill = true, id = Math.random().toString(36).slice(2) }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const px = (i) => (i / (data.length - 1)) * (w - 10) + 5;
  const py = (v) => h - 6 - ((v - min) / (max - min || 1)) * (h - 14);
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');
  const area = `${line} L ${px(data.length - 1)} ${h} L ${px(0)} ${h} Z`;
  const c = color.startsWith('var') ? '#00C2B8' : color;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {fill && (
        <defs>
          <linearGradient id={`ml-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.28"/>
            <stop offset="100%" stopColor={c} stopOpacity="0"/>
          </linearGradient>
        </defs>
      )}
      {fill && <path d={area} fill={`url(#ml-${id})`}/>}
      <path d={line} fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// ─── MiniBar ──────────────────────────────────────────────────────
// Vertical bars; dims bars past `activeUntil` (for pacing charts).
const MiniBar = ({ data, w = 240, h = 72, color = 'var(--avo-teal)', activeUntil, gap = 2 }) => {
  const c = color.startsWith('var') ? '#00C2B8' : color;
  const max = Math.max(...data);
  const bw = (w - gap * (data.length - 1)) / data.length;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const bh = (v / max) * (h - 4);
        const dimmed = activeUntil != null && i >= activeUntil;
        return <rect key={i} x={i * (bw + gap)} y={h - bh} width={bw} height={bh} rx={Math.min(1.5, bw / 3)} fill={dimmed ? '#243350' : c}/>;
      })}
    </svg>
  );
};

// ─── MiniDonut ────────────────────────────────────────────────────
// Multi-segment donut with optional center readout (label + sub).
const MiniDonut = ({ segments, size = 120, thickness = 8, centerLabel, centerSub }) => {
  const r = size / 2 - thickness / 2 - 1;
  const cx = size / 2, cy = size / 2;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#243350" strokeWidth={thickness}/>
      {segments.map((s, i) => {
        const frac = s.value / total;
        const circ = 2 * Math.PI * r;
        const dash = `${circ * frac} ${circ}`;
        const offset = -acc * circ;
        acc += frac;
        return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={thickness}
          strokeDasharray={dash} strokeDashoffset={offset} transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="butt"/>;
      })}
      {centerLabel && (
        <text x={cx} y={cy - 2} textAnchor="middle" fontFamily="Space Grotesk" fontWeight="700" fontSize={size * 0.18} fill="#FCFCFC">{centerLabel}</text>
      )}
      {centerSub && (
        <text x={cx} y={cy + size * 0.14} textAnchor="middle" fontFamily="DM Mono" fontSize={size * 0.08} fill="#64748B" letterSpacing="0.5">{centerSub}</text>
      )}
    </svg>
  );
};

// ─── MultiArea ────────────────────────────────────────────────────
// Two overlaid area series for compound comparison charts.
const MultiArea = ({ seriesA, seriesB, labelsX = [], colorA = '#F8B400', colorB = '#00C2B8', w = 520, h = 180 }) => {
  const all = [...seriesA, ...seriesB];
  const max = Math.max(...all), min = Math.min(...all);
  const build = (arr) => {
    const px = (i) => 30 + (i / (arr.length - 1)) * (w - 40);
    const py = (v) => (h - 30) - ((v - min) / (max - min || 1)) * (h - 50);
    const line = arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');
    const area = `${line} L ${px(arr.length - 1)} ${h - 30} L ${px(0)} ${h - 30} Z`;
    const pts = arr.map((v, i) => [px(i), py(v)]);
    return { line, area, pts };
  };
  const A = build(seriesA), B = build(seriesB);
  const id = Math.random().toString(36).slice(2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={`a-${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={colorA} stopOpacity="0.3"/><stop offset="100%" stopColor={colorA} stopOpacity="0"/></linearGradient>
        <linearGradient id={`b-${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={colorB} stopOpacity="0.3"/><stop offset="100%" stopColor={colorB} stopOpacity="0"/></linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((t, i) => <line key={i} x1="30" x2={w} y1={30 + (h - 60) * t} y2={30 + (h - 60) * t} stroke="#334766" strokeDasharray="2,3" strokeWidth="0.5"/>)}
      <path d={A.area} fill={`url(#a-${id})`}/>
      <path d={A.line} fill="none" stroke={colorA} strokeWidth="1.8"/>
      <path d={B.area} fill={`url(#b-${id})`}/>
      <path d={B.line} fill="none" stroke={colorB} strokeWidth="1.8"/>
      {A.pts.map(([x, y], i) => <circle key={`a${i}`} cx={x} cy={y} r="2.5" fill={colorA}/>)}
      {B.pts.map(([x, y], i) => <circle key={`b${i}`} cx={x} cy={y} r="2.5" fill={colorB}/>)}
      {labelsX.map((l, i) => <text key={l} x={30 + (i / (labelsX.length - 1)) * (w - 40)} y={h - 10} fontFamily="DM Mono" fontSize="9" fill="#64748B" textAnchor="middle">{l}</text>)}
    </svg>
  );
};

// ─── Heatmap ─────────────────────────────────────────────────────
// Grid of intensity cells (rows × cols). Used for cohort / schedule-style charts.
const MiniHeatmap = ({ rows, cols, values, labelsRow = [], labelsCol = [], cell = 14, color = '#00C2B8' }) => {
  // values: 2D array rows×cols of 0..1
  const w = cols * cell + 40;
  const h = rows * cell + 20;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block' }}>
      {labelsCol.map((l, i) => <text key={i} x={40 + i * cell + cell / 2} y={10} fontFamily="DM Mono" fontSize="8" fill="#64748B" textAnchor="middle">{l}</text>)}
      {Array.from({ length: rows }).map((_, r) => (
        <g key={r}>
          <text x={34} y={20 + r * cell + cell * 0.7} fontFamily="DM Mono" fontSize="8" fill="#64748B" textAnchor="end">{labelsRow[r] || ''}</text>
          {Array.from({ length: cols }).map((_, c) => {
            const v = (values[r] && values[r][c]) || 0;
            return <rect key={c} x={40 + c * cell + 1} y={15 + r * cell + 1} width={cell - 2} height={cell - 2} rx="1.5"
              fill={color} fillOpacity={0.08 + v * 0.8}/>;
          })}
        </g>
      ))}
    </svg>
  );
};

// ─── Ring (progress score) ───────────────────────────────────────
// Single-value progress ring; center number is the score.
const Ring = ({ value, max = 100, size = 120, thickness = 8, color = 'var(--avo-teal)', label }) => {
  const c = color.startsWith('var') ? '#00C2B8' : color;
  const r = size / 2 - thickness / 2 - 1;
  const circ = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, value / max));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#243350" strokeWidth={thickness}/>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={thickness}
        strokeDasharray={`${circ * frac} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}/>
      <text x={size / 2} y={size / 2 + size * 0.08} textAnchor="middle" fontFamily="Space Grotesk" fontWeight="800" fontSize={size * 0.28} fill="#FCFCFC" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</text>
      {label && <text x={size / 2} y={size / 2 + size * 0.3} textAnchor="middle" fontFamily="DM Mono" fontSize={size * 0.08} fill="#64748B" letterSpacing="1">{label}</text>}
    </svg>
  );
};

Object.assign(window, { MiniLine, MiniBar, MiniDonut, MultiArea, MiniHeatmap, Ring });
