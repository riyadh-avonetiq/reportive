// Reportive — shared chart primitives.
// All charts: AVQ palette, tabular-nums callouts, hover crosshair + tooltip.

// ─── MiniLine / MiniArea ──────────────────────────────────────────
// Single-series line with optional gradient area fill. Hover shows crosshair + value.
const MiniLine = ({ data, w = 240, h = 72, color = 'var(--avo-teal)', fill = true, id = Math.random().toString(36).slice(2), labels }) => {
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const c = color.startsWith('var') ? '#00C2B8' : color;
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const px = (i) => (i / (data.length - 1)) * (w - 10) + 5;
  const py = (v) => h - 6 - ((v - min) / (max - min || 1)) * (h - 14);
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');
  const area = `${line} L ${px(data.length - 1)} ${h} L ${px(0)} ${h} Z`;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = w / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    let nearest = 0, minDist = Infinity;
    for (let i = 0; i < data.length; i++) {
      const dist = Math.abs(px(i) - mouseX);
      if (dist < minDist) { minDist = dist; nearest = i; }
    }
    setHoverIdx(nearest);
  };

  const hx = hoverIdx !== null ? px(hoverIdx) : null;
  const hy = hoverIdx !== null ? py(data[hoverIdx]) : null;

  return (
    <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIdx(null)}>
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
        {hoverIdx !== null && (
          <>
            <line x1={hx} y1={3} x2={hx} y2={h} stroke={c} strokeWidth="0.8" strokeDasharray="3,2" opacity="0.4"/>
            <circle cx={hx} cy={hy} r="4.5" fill={c} stroke="#0A1222" strokeWidth="1.5"/>
          </>
        )}
      </svg>
      {hoverIdx !== null && (
        <div style={{
          position: 'absolute',
          left: Math.max(2, Math.min(hx - 32, w - 72)),
          top: Math.max(2, hy - 36),
          background: 'rgba(10,18,34,.92)',
          border: `1px solid ${c}55`,
          borderRadius: 5, padding: '3px 8px',
          fontFamily: 'DM Mono', fontSize: 10, color: '#FCFCFC',
          pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 20,
          lineHeight: 1.4,
        }}>
          {labels && labels[hoverIdx] ? <div style={{ opacity: 0.55, fontSize: 8, marginBottom: 1 }}>{labels[hoverIdx]}</div> : null}
          {data[hoverIdx].toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      )}
    </div>
  );
};

// ─── MiniBar ──────────────────────────────────────────────────────
// Vertical bars; dims bars past `activeUntil` (for pacing charts). Hover highlights bar.
const MiniBar = ({ data, w = 240, h = 72, color = 'var(--avo-teal)', activeUntil, gap = 2, labels }) => {
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const c = color.startsWith('var') ? '#00C2B8' : color;
  if (!data || data.length === 0) return null;
  const max = Math.max(...data) || 1;
  const bw = (w - gap * (data.length - 1)) / data.length;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = w / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const idx = Math.floor(mouseX / (bw + gap));
    setHoverIdx(Math.min(Math.max(0, idx), data.length - 1));
  };

  const tooltipX = hoverIdx !== null ? hoverIdx * (bw + gap) + bw / 2 : null;
  const tooltipY = hoverIdx !== null ? h - (data[hoverIdx] / max) * (h - 4) : null;

  return (
    <div style={{ position: 'relative', display: 'inline-block', lineHeight: 0 }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIdx(null)}>
        {data.map((v, i) => {
          const bh = (v / max) * (h - 4);
          const dimmed = activeUntil != null && i >= activeUntil;
          const hovered = hoverIdx === i;
          return (
            <rect key={i}
              x={i * (bw + gap)} y={h - bh} width={bw} height={bh}
              rx={Math.min(1.5, bw / 3)}
              fill={dimmed ? '#243350' : c}
              opacity={dimmed ? 1 : hovered ? 1 : 0.8}
              style={{ filter: hovered && !dimmed ? `brightness(1.25)` : 'none' }}
            />
          );
        })}
      </svg>
      {hoverIdx !== null && (
        <div style={{
          position: 'absolute',
          left: Math.max(2, Math.min(tooltipX - 32, w - 72)),
          top: Math.max(2, tooltipY - 36),
          background: 'rgba(10,18,34,.92)',
          border: `1px solid ${c}55`,
          borderRadius: 5, padding: '3px 8px',
          fontFamily: 'DM Mono', fontSize: 10, color: '#FCFCFC',
          pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 20,
          lineHeight: 1.4,
        }}>
          {labels && labels[hoverIdx] ? <div style={{ opacity: 0.55, fontSize: 8, marginBottom: 1 }}>{labels[hoverIdx]}</div> : null}
          {data[hoverIdx].toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      )}
    </div>
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
// Two overlaid area series for compound comparison charts. Hover shows both values.
const MultiArea = ({ seriesA, seriesB, labelsX = [], colorA = '#F8B400', colorB = '#00C2B8', w = 520, h = 180 }) => {
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const svgRef = React.useRef(null);

  const all = [...seriesA, ...seriesB];
  const max = Math.max(...all), min = Math.min(...all);
  const n = seriesA.length;
  const pxF = (i) => 30 + (i / (n - 1)) * (w - 40);
  const pyF = (v) => (h - 30) - ((v - min) / (max - min || 1)) * (h - 50);

  const build = (arr) => {
    const line = arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${pxF(i)} ${pyF(v)}`).join(' ');
    const area = `${line} L ${pxF(arr.length - 1)} ${h - 30} L ${pxF(0)} ${h - 30} Z`;
    const pts = arr.map((v, i) => [pxF(i), pyF(v)]);
    return { line, area, pts };
  };
  const A = build(seriesA), B = build(seriesB);
  const id = React.useRef(Math.random().toString(36).slice(2)).current;

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = w / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    let nearest = 0, minDist = Infinity;
    for (let i = 0; i < n; i++) {
      const dist = Math.abs(pxF(i) - mouseX);
      if (dist < minDist) { minDist = dist; nearest = i; }
    }
    setHoverIdx(nearest);
  };

  const hx = hoverIdx !== null ? pxF(hoverIdx) : null;

  return (
    <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
      onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIdx(null)}>
      <defs>
        <linearGradient id={`a-${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={colorA} stopOpacity="0.3"/><stop offset="100%" stopColor={colorA} stopOpacity="0"/></linearGradient>
        <linearGradient id={`b-${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={colorB} stopOpacity="0.3"/><stop offset="100%" stopColor={colorB} stopOpacity="0"/></linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((t, i) => <line key={i} x1="30" x2={w} y1={30 + (h - 60) * t} y2={30 + (h - 60) * t} stroke="#334766" strokeDasharray="2,3" strokeWidth="0.5"/>)}
      <path d={A.area} fill={`url(#a-${id})`}/>
      <path d={A.line} fill="none" stroke={colorA} strokeWidth="1.8"/>
      <path d={B.area} fill={`url(#b-${id})`}/>
      <path d={B.line} fill="none" stroke={colorB} strokeWidth="1.8"/>
      {A.pts.map(([x, y], i) => <circle key={`a${i}`} cx={x} cy={y} r={hoverIdx === i ? 4 : 2.5} fill={colorA} style={{ transition: 'r .1s' }}/>)}
      {B.pts.map(([x, y], i) => <circle key={`b${i}`} cx={x} cy={y} r={hoverIdx === i ? 4 : 2.5} fill={colorB} style={{ transition: 'r .1s' }}/>)}
      {labelsX.map((l, i) => <text key={l} x={30 + (i / (labelsX.length - 1)) * (w - 40)} y={h - 10} fontFamily="DM Mono" fontSize="9" fill="#64748B" textAnchor="middle">{l}</text>)}

      {/* Hover crosshair */}
      {hoverIdx !== null && (
        <>
          <line x1={hx} y1={15} x2={hx} y2={h - 30} stroke="rgba(255,255,255,.15)" strokeWidth="1" strokeDasharray="3,3"/>
          {/* Tooltip box in SVG space */}
          <rect x={Math.min(hx - 8, w - 130)} y={16} width={120} height={40} rx="4" fill="rgba(10,18,34,.88)" stroke="rgba(255,255,255,.08)" strokeWidth="0.8"/>
          <rect x={Math.min(hx - 8, w - 130) + 6} y={26} width={6} height={6} rx="1" fill={colorA}/>
          <text x={Math.min(hx - 8, w - 130) + 15} y={33} fontFamily="DM Mono" fontSize="9" fill="#FCFCFC" style={{ fontVariantNumeric: 'tabular-nums' }}>{seriesA[hoverIdx].toLocaleString(undefined, { maximumFractionDigits: 1 })}</text>
          <rect x={Math.min(hx - 8, w - 130) + 6} y={39} width={6} height={6} rx="1" fill={colorB}/>
          <text x={Math.min(hx - 8, w - 130) + 15} y={46} fontFamily="DM Mono" fontSize="9" fill="#FCFCFC" style={{ fontVariantNumeric: 'tabular-nums' }}>{seriesB[hoverIdx].toLocaleString(undefined, { maximumFractionDigits: 1 })}</text>
        </>
      )}
    </svg>
  );
};

// ─── Heatmap ─────────────────────────────────────────────────────
// Grid of intensity cells (rows × cols). Used for cohort / schedule-style charts.
const MiniHeatmap = ({ rows, cols, values, labelsRow = [], labelsCol = [], cell = 14, color = '#00C2B8' }) => {
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
