"use client";

// app/dashboard/mystery-shopping/components/Charts.jsx
//
// رسومات SVG خفيفة (من غير مكتبة charts). كلها responsive عن طريق viewBox،
// وبتتعامل مع القيم الفاضية (null) — شهر من غير زيارات مثلًا.

const NAVY = "#0B1F3A";
const GOLD = "#C9A227";
const SKY = "#1E9BC6";
const BLUE = "#2F80ED";

const fin = Number.isFinite;
const nums = (a) => a.filter(fin);

// خط بيتقطع عند أي قيمة فاضية.
function segPath(values, x, y) {
  let d = "";
  let pen = false;
  values.forEach((v, i) => {
    if (!fin(v)) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"} ${x(i)} ${y(v)} `;
    pen = true;
  });
  return d.trim();
}

/* ───────────── Gauge: درجة الجودة ───────────── */
export function Gauge({ value, label, color = GOLD }) {
  const has = fin(value);
  const v = has ? Math.min(100, Math.max(0, value)) : 0;
  const r = 78;
  const cx = 110;
  const cy = 105;
  const start = (-225 * Math.PI) / 180;
  const total = (270 * Math.PI) / 180;
  const point = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [sx, sy] = point(start);
  const [ex, ey] = point(start + total);
  const [vx, vy] = point(start + (total * v) / 100);
  const largeVal = (total * v) / 100 > Math.PI ? 1 : 0;
  const filled = has ? Math.round(v / 20) : 0;

  return (
    <svg viewBox="0 0 220 200" className="mx-auto w-full max-w-[260px]" role="img" aria-label={has ? `${value}% ${label}` : "—"}>
      <path d={`M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`} fill="none" stroke="#E9ECF1" strokeWidth="16" strokeLinecap="round" />
      {v > 0 && (
        <path d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeVal} 1 ${vx} ${vy}`} fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" />
      )}
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="44" fontWeight="700" fill={has ? color : "#B8BFC9"}>
        {has ? `${Math.round(value)}%` : "—"}
      </text>
      <text x={cx} y={cy + 32} textAnchor="middle" fontSize="17" fontWeight="600" fill={NAVY}>
        {has ? label : ""}
      </text>
      <text x={cx} y={cy + 56} textAnchor="middle" fontSize="18" letterSpacing="3">
        <tspan fill={color}>{"★".repeat(filled)}</tspan>
        <tspan fill="#D5DAE1">{"★".repeat(5 - filled)}</tspan>
      </text>
    </svg>
  );
}

/* ───────────── Line chart: درجة الجودة + متوسط التقييم ───────────── */
export function TrendChart({ months, quality, rating, qualityLabel, ratingLabel, rtl }) {
  const W = 560;
  const H = 280;
  const pad = { l: 42, r: 24, t: 24, b: 36 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = months.length;
  const x = (i) => pad.l + (n > 1 ? (iw * (rtl ? n - 1 - i : i)) / (n - 1) : iw / 2);

  const qv = nums(quality);
  const qMin = qv.length ? Math.max(0, Math.floor((Math.min(...qv) - 5) / 10) * 10) : 0;
  const qMax = 100;
  const yQ = (v) => pad.t + ih - ((v - qMin) / (qMax - qMin)) * ih;

  const rv = nums(rating);
  const rMin = rv.length ? Math.max(1, Math.min(...rv) - 0.5) : 1;
  const rMax = 5;
  const yR = (v) => pad.t + ih - ((v - rMin) / (rMax - rMin)) * ih;

  const grid = [0, 1, 2, 3].map((i) => Math.round(qMin + ((qMax - qMin) * i) / 3));

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-charcoal/80">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded" style={{ background: NAVY }} /> {qualityLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded" style={{ background: SKY }} /> {ratingLabel}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${qualityLabel}, ${ratingLabel}`}>
        {grid.map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={yQ(g)} y2={yQ(g)} stroke="#EDF0F4" />
            <text x={rtl ? W - pad.r + 6 : pad.l - 8} y={yQ(g) + 4} textAnchor={rtl ? "start" : "end"} fontSize="11" fill="#8A93A0">
              {g}
            </text>
          </g>
        ))}
        {months.map((m, i) => (
          <text key={`${m}${i}`} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#8A93A0">
            {m}
          </text>
        ))}

        <path d={segPath(quality, x, yQ)} fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <path d={segPath(rating, x, yR)} fill="none" stroke={SKY} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {quality.map((v, i) =>
          fin(v) ? (
            <g key={`q${i}`}>
              <circle cx={x(i)} cy={yQ(v)} r="4" fill="#fff" stroke={NAVY} strokeWidth="2.5" />
              <text x={x(i)} y={yQ(v) - 11} textAnchor="middle" fontSize="12" fontWeight="700" fill={NAVY}>
                {v}
              </text>
            </g>
          ) : null
        )}
        {rating.map((v, i) =>
          fin(v) ? (
            <g key={`r${i}`}>
              <circle cx={x(i)} cy={yR(v)} r="4" fill="#fff" stroke={SKY} strokeWidth="2.5" />
              <text x={x(i)} y={yR(v) + 20} textAnchor="middle" fontSize="12" fontWeight="700" fill={SKY}>
                {v.toFixed(1)}
              </text>
            </g>
          ) : null
        )}
      </svg>
    </div>
  );
}

/* ───────────── Bar chart: مقارنة الفروع ───────────── */
export function BranchBars({ items, rtl }) {
  if (!items.length) return null;
  const W = 420;
  const H = 300;
  const pad = { l: 34, r: 12, t: 22, b: 62 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = items.length;
  const slot = iw / n;
  const bw = Math.min(slot * 0.62, 44);
  const y = (v) => pad.t + ih - (v / 100) * ih;
  const ticks = [0, 20, 40, 60, 80, 100];
  const short = (s) => (s.length > 14 ? `${s.slice(0, 13)}…` : s);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#EDF0F4" />
          <text x={rtl ? W - pad.r + 2 : pad.l - 8} y={y(t) + 4} textAnchor={rtl ? "start" : "end"} fontSize="10" fill="#8A93A0">
            {t}
          </text>
        </g>
      ))}
      {items.map((it, i) => {
        const idx = rtl ? n - 1 - i : i;
        const bx = pad.l + slot * idx + (slot - bw) / 2;
        const cx = bx + bw / 2;
        const top = y(it.score);
        return (
          <g key={`${it.label}${i}`}>
            <rect x={bx} y={top} width={bw} height={Math.max(0, y(0) - top)} rx="3" fill={it.highlight ? BLUE : NAVY} />
            <text x={cx} y={top - 7} textAnchor="middle" fontSize="12" fontWeight="700" fill={NAVY}>
              {it.score}
            </text>
            <text
              transform={`translate(${cx + 4} ${y(0) + 12}) rotate(${rtl ? 40 : -40})`}
              textAnchor={rtl ? "start" : "end"}
              fontSize="10.5"
              fill={it.highlight ? BLUE : "#5B6471"}
              fontWeight={it.highlight ? 700 : 400}
            >
              {short(it.label)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ───────────── Radar: معايير التقييم (من 5) ───────────── */
export function RadarChart({ items }) {
  const size = 300;
  const c = size / 2;
  const R = 95;
  const n = items.length;
  const angle = (i) => -Math.PI / 2 + (2 * Math.PI * i) / n;
  const val = (it) => (fin(it.value) ? it.value : 0);
  const pt = (i, frac) => [c + R * frac * Math.cos(angle(i)), c + R * frac * Math.sin(angle(i))];
  const ring = (f) => items.map((_, i) => pt(i, f).join(",")).join(" ");
  const shape = items.map((it, i) => pt(i, val(it) / 5).join(",")).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[340px]" role="img">
      {[0.2, 0.4, 0.6, 0.8, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="#DCE3EC" />
      ))}
      {items.map((_, i) => {
        const [px, py] = pt(i, 1);
        return <line key={i} x1={c} y1={c} x2={px} y2={py} stroke="#DCE3EC" />;
      })}
      <polygon points={shape} fill="rgba(47,128,237,0.28)" stroke={NAVY} strokeWidth="2" strokeLinejoin="round" />
      {items.map((it, i) => {
        const [px, py] = pt(i, val(it) / 5);
        const [lx, ly] = pt(i, 1.2);
        const a = angle(i);
        const anchor = Math.abs(Math.cos(a)) < 0.2 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        return (
          <g key={it.label}>
            <circle cx={px} cy={py} r="4" fill={NAVY} />
            <text x={lx} y={ly - 2} textAnchor={anchor} fontSize="12" fontWeight="600" fill={NAVY}>
              {it.label}
            </text>
            <text x={lx} y={ly + 13} textAnchor={anchor} fontSize="11" fill="#5B6471">
              {fin(it.value) ? `${it.value.toFixed(1)} / 5` : "—"}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ───────────── Mini line: خط الاتجاه داخل التقرير ───────────── */
export function MiniTrend({ values, months, rtl }) {
  const W = 300;
  const H = 90;
  const pad = { l: 14, r: 14, t: 22, b: 8 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const vs = nums(values);
  const min = (vs.length ? Math.min(...vs) : 0) - 2;
  const max = (vs.length ? Math.max(...vs) : 100) + 1;
  const n = values.length;
  const x = (i) => pad.l + (n > 1 ? (iw * (rtl ? n - 1 - i : i)) / (n - 1) : iw / 2);
  const y = (v) => pad.t + ih - ((v - min) / (max - min)) * ih;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={months?.join(", ")}>
      <path d={segPath(values, x, y)} fill="none" stroke={NAVY} strokeWidth="1.8" strokeLinejoin="round" />
      {values.map((v, i) =>
        fin(v) ? (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r="2.6" fill="#fff" stroke={NAVY} strokeWidth="1.6" />
            <text x={x(i)} y={y(v) - 7} textAnchor="middle" fontSize="8.5" fill="#5B6471">
              {v}%
            </text>
          </g>
        ) : null
      )}
    </svg>
  );
}
