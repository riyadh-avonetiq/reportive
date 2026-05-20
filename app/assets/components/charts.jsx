// Reportive — shared chart primitives.
// All charts: AVQ palette, tabular-nums callouts, hover crosshair + tooltip.

const fmtNum = (v) => {
  if (v >= 1000) return (v / 1000).toFixed(1).replace('.0', '') + 'K';
  if (Number.isInteger(v)) return String(v);
  if (Math.abs(v) >= 0.1) return v.toFixed(1).replace(/\.0$/, '');
  if (v > 0) return v.toFixed(2);
  return '0';
};
const niceMax = (max) => {
  if (max <= 10) return Math.ceil(max);
  const exp = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / exp) * exp;
};

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

// ─── RichAreaChart ─────────────────────────────────────────────────
// Dual-area trend with TWO independent Y-axes so metrics in different units
// (e.g. spend Rp vs conversions count) scale fairly. Gridlines, peak marker
// bubble on series A, colored axis ticks, hover crosshair + tooltip.
// seriesB is optional — omit for a polished single-series view.
const RichAreaChart = ({
  seriesA, seriesB, labelsX = [],
  unitA = '', unitB = '',
  colorA = '#00C2B8', colorB = '#F8B400',
  fmtY = null,
  tooltipLabels = [],
  smooth = false,
  w = 540, h = 220,
}) => {
  const fmt_ = fmtY || fmtNum;
  const hasDual = seriesB && seriesB.length >= 2;
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const svgRef = React.useRef(null);
  const id = React.useRef(Math.random().toString(36).slice(2)).current;
  const catmullRom = (pts) => {
    if (pts.length < 2) return '';
    return pts.map(([x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const p0 = pts[Math.max(i - 2, 0)];
      const p1 = pts[i - 1];
      const p2 = pts[i];
      const p3 = pts[Math.min(i + 1, pts.length - 1)];
      const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
      return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
    }).join(' ');
  };
  const m = { l: 40, r: 36, t: 18, b: 20 };
  const iw = w - m.l - m.r, ih = h - m.t - m.b;

  const mkAxis = (arr, color) => {
    const raw = niceMax(Math.max(...arr));
    const max = raw || 1;
    const px = (i) => m.l + (i / (arr.length - 1)) * iw;
    const py = (v) => m.t + ih - (v / max) * ih;
    const pts = arr.map((v, i) => [px(i), py(v)]);
    const line = smooth ? catmullRom(pts) : pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
    const closedBottom = ` L ${px(arr.length - 1)} ${m.t + ih} L ${px(0)} ${m.t + ih} Z`;
    const area = line + closedBottom;
    const peakIdx = arr.indexOf(Math.max(...arr));
    return { max, px, py, line, area, peakIdx, color, values: arr };
  };

  const A = mkAxis(seriesA, colorA);
  const B = hasDual ? mkAxis(seriesB, colorB) : null;

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = w / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX - m.l;
    const n = seriesA.length;
    let nearest = 0, minDist = Infinity;
    for (let i = 0; i < n; i++) {
      const dist = Math.abs((i / (n - 1)) * iw - mouseX);
      if (dist < minDist) { minDist = dist; nearest = i; }
    }
    setHoverIdx(nearest);
  };

  return (
    <svg ref={svgRef} viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
      onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIdx(null)}>
      <defs>
        <linearGradient id={`a-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={colorA} stopOpacity="0.32"/>
          <stop offset="100%" stopColor={colorA} stopOpacity="0"/>
        </linearGradient>
        <linearGradient id={`b-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={colorB} stopOpacity="0.32"/>
          <stop offset="100%" stopColor={colorB} stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line key={i} x1={m.l} x2={m.l + iw} y1={m.t + ih * t} y2={m.t + ih * t}
          stroke="#243350" strokeDasharray={t === 1 ? '0' : '2,4'} strokeWidth="0.6"/>
      ))}

      {/* left Y-axis ticks (series A) */}
      {[0, 0.5, 1].map((t, i) => {
        const v = A.max * (1 - t);
        return (
          <text key={i} x={m.l - 4} y={m.t + ih * t + 2} fontFamily="DM Mono" fontSize="6" fill={colorA} textAnchor="end" opacity="0.7">
            {fmt_(v)}{unitA && i === 0 ? ' ' + unitA : ''}
          </text>
        );
      })}
      {/* right Y-axis ticks (series B) — only when dual */}
      {hasDual && [0, 0.5, 1].map((t, i) => {
        const v = B.max * (1 - t);
        return (
          <text key={i} x={m.l + iw + 4} y={m.t + ih * t + 2} fontFamily="DM Mono" fontSize="6" fill={colorB} textAnchor="start" opacity="0.7">
            {fmt_(v)}{unitB && i === 0 ? ' ' + unitB : ''}
          </text>
        );
      })}

      {/* areas + lines */}
      <path d={A.area} fill={`url(#a-${id})`}/>
      <path d={A.line} fill="none" stroke={colorA} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      {hasDual && <path d={B.area} fill={`url(#b-${id})`}/>}
      {hasDual && <path d={B.line} fill="none" stroke={colorB} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>}

      {/* data points — larger at peak */}
      {A.values.map((v, i) => <circle key={`a${i}`} cx={A.px(i)} cy={A.py(v)} r={i === A.peakIdx ? 2.5 : 1.5} fill={colorA} stroke="#0C182C" strokeWidth="1"/>)}
      {hasDual && B.values.map((v, i) => <circle key={`b${i}`} cx={B.px(i)} cy={B.py(v)} r={i === B.peakIdx ? 2.5 : 1.5} fill={colorB} stroke="#0C182C" strokeWidth="1"/>)}

      {/* peak value bubble — series A */}
      {(() => {
        const i = A.peakIdx, x = A.px(i), y = A.py(A.values[i]);
        const label = fmt_(A.values[i]) + (unitA ? ' ' + unitA : '');
        const bw = Math.max(20, label.length * 4 + 6);
        const bx = Math.max(m.l + bw / 2, Math.min(x, m.l + iw - bw / 2));
        return (
          <g transform={`translate(${bx} ${y - 6})`}>
            <rect x={-bw / 2} y="-8" width={bw} height="9" rx="2" fill={colorA}/>
            <text x="0" y="-1" fontFamily="DM Mono" fontWeight="600" fontSize="5.5" fill="#0C182C" textAnchor="middle">{label}</text>
          </g>
        );
      })()}

      {/* x-axis labels */}
      {labelsX.length > 0 && labelsX.map((l, i) => (
        <text key={i} x={m.l + (i / Math.max(labelsX.length - 1, 1)) * iw} y={h - 8}
          fontFamily="DM Mono" fontSize="6" fill="#64748B" textAnchor="middle">{l}</text>
      ))}

      {/* hover crosshair + tooltip */}
      {hoverIdx !== null && (() => {
        const hx = A.px(hoverIdx);
        const vA = A.values[hoverIdx];
        const tipRows = hasDual ? 2 : 1;
        const tipH = 10 + tipRows * 14;
        const tipX = Math.max(m.l, Math.min(hx - 62, m.l + iw - 128));
        const tipY = m.t + 2;
        const labelA = fmt_(vA) + (unitA ? ' ' + unitA : '');
        return (
          <>
            <line x1={hx} y1={m.t} x2={hx} y2={m.t + ih} stroke="rgba(255,255,255,.12)" strokeWidth="1" strokeDasharray="3,3"/>
            <circle cx={hx} cy={A.py(vA)} r="3.5" fill={colorA} stroke="#0C182C" strokeWidth="1.2"/>
            {hasDual && <circle cx={hx} cy={B.py(B.values[hoverIdx])} r="3.5" fill={colorB} stroke="#0C182C" strokeWidth="1.2"/>}
            <rect x={tipX} y={tipY} width={124} height={tipH} rx="4" fill="rgba(10,18,34,.92)" stroke="rgba(255,255,255,.08)" strokeWidth="0.8"/>
            <rect x={tipX + 5} y={tipY + 6} width={5} height={5} rx="1" fill={colorA}/>
            <text x={tipX + 12} y={tipY + 13} fontFamily="DM Mono" fontSize="6" fill="#FCFCFC" style={{ fontVariantNumeric: 'tabular-nums' }}>{labelA}</text>
            {hasDual && (() => {
              const vB = B.values[hoverIdx];
              const labelB = fmt_(vB) + (unitB ? ' ' + unitB : '');
              return (<>
                <rect x={tipX + 5} y={tipY + 18} width={5} height={5} rx="1" fill={colorB}/>
                <text x={tipX + 12} y={tipY + 25} fontFamily="DM Mono" fontSize="6" fill="#FCFCFC" style={{ fontVariantNumeric: 'tabular-nums' }}>{labelB}</text>
              </>);
            })()}
            {(tooltipLabels[hoverIdx] || labelsX[hoverIdx]) && (
              <text x={tipX + 62} y={tipY + tipH - 2} fontFamily="DM Mono" fontSize="6" fill="#64748B" textAnchor="middle">{tooltipLabels[hoverIdx] || labelsX[hoverIdx]}</text>
            )}
          </>
        );
      })()}
    </svg>
  );
};

// ─── MultiArea (alias) ────────────────────────────────────────────
// Kept for backwards compatibility — wraps RichAreaChart.
const MultiArea = ({ seriesA, seriesB, labelsX = [], colorA = '#F8B400', colorB = '#00C2B8', w = 520, h = 180 }) => (
  <RichAreaChart seriesA={seriesA} seriesB={seriesB} labelsX={labelsX} colorA={colorA} colorB={colorB} w={w} h={h}/>
);

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

Object.assign(window, { MiniLine, MiniBar, MiniDonut, MultiArea, RichAreaChart, MiniHeatmap, Ring });
