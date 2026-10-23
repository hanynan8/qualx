"use client";

// app/dashboard/auditing-visits/components/AuditCharts.jsx
//
// رسومات خاصة بالتدقيق (SVG/HTML خفيف من غير مكتبة). الرسومات العامة (Gauge, BranchBars, MiniTrend)
// جاية من ../../_shared/Charts. كلها بتتعامل مع القيم الفاضية (شهر من غير زيارات).

const NAVY = "#0B1F3A";
const GREEN = "#1F9D6B";
const RED = "#D64545";
const GOLD = "#C9A227";

const fin = Number.isFinite;

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

/* ───────────── اتجاه الالتزام الشهري + خط الهدف ───────────── */
export function ComplianceTrend({ months, values, target, label, targetLabel, rtl }) {
  const W = 560;
  const H = 260;
  const pad = { l: 42, r: 24, t: 24, b: 36 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = months.length;
  const x = (i) => pad.l + (n > 1 ? (iw * (rtl ? n - 1 - i : i)) / (n - 1) : iw / 2);
  const vs = values.filter(fin);
  const lo = vs.length ? Math.max(0, Math.floor((Math.min(...vs, fin(target) ? target : 100) - 8) / 10) * 10) : 0;
  const y = (v) => pad.t + ih - ((v - lo) / (100 - lo)) * ih;
  const grid = [0, 1, 2, 3].map((i) => Math.round(lo + ((100 - lo) * i) / 3));

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-charcoal/80">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded" style={{ background: NAVY }} /> {label}
        </span>
        {fin(target) && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-5 border-t-2 border-dashed" style={{ borderColor: GOLD }} /> {targetLabel} ({target}%)
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>
        {grid.map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="#EDF0F4" />
            <text x={rtl ? W - pad.r + 6 : pad.l - 8} y={y(g) + 4} textAnchor={rtl ? "start" : "end"} fontSize="11" fill="#8A93A0">
              {g}
            </text>
          </g>
        ))}
        {fin(target) && target >= lo && <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} stroke={GOLD} strokeDasharray="5 4" strokeWidth="1.5" />}
        {months.map((m, i) => (
          <text key={`${m}${i}`} x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#8A93A0">
            {m}
          </text>
        ))}
        <path d={segPath(values, x, y)} fill="none" stroke={NAVY} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {values.map((v, i) =>
          fin(v) ? (
            <g key={i}>
              <circle cx={x(i)} cy={y(v)} r="4" fill="#fff" stroke={NAVY} strokeWidth="2.5" />
              <text x={x(i)} y={y(v) - 11} textAnchor="middle" fontSize="12" fontWeight="700" fill={NAVY}>
                {v}
              </text>
            </g>
          ) : null
        )}
      </svg>
    </div>
  );
}

/* ───────────── ملاحظات اتفتحت مقابل اتقفلت (أعمدة مزدوجة) ───────────── */
export function FindingsFlow({ months, opened, closed, openedLabel, closedLabel, rtl }) {
  const W = 420;
  const H = 220;
  const pad = { l: 30, r: 10, t: 16, b: 30 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const n = months.length;
  const slot = iw / n;
  const bw = Math.min(slot * 0.34, 22);
  const max = Math.max(1, ...opened, ...closed);
  const y = (v) => pad.t + ih - (v / max) * ih;
  const ticks = [0, Math.ceil(max / 2), max].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-charcoal/80">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: RED }} /> {openedLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: GREEN }} /> {closedLabel}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${openedLabel} / ${closedLabel}`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#EDF0F4" />
            <text x={rtl ? W - pad.r + 2 : pad.l - 6} y={y(t) + 4} textAnchor={rtl ? "start" : "end"} fontSize="10" fill="#8A93A0">
              {t}
            </text>
          </g>
        ))}
        {months.map((m, i) => {
          const idx = rtl ? n - 1 - i : i;
          const cx = pad.l + slot * idx + slot / 2;
          return (
            <g key={`${m}${i}`}>
              <rect x={cx - bw - 1} y={y(opened[i])} width={bw} height={Math.max(0, y(0) - y(opened[i]))} rx="2" fill={RED} />
              <rect x={cx + 1} y={y(closed[i])} width={bw} height={Math.max(0, y(0) - y(closed[i]))} rx="2" fill={GREEN} />
              {opened[i] > 0 && (
                <text x={cx - bw / 2 - 1} y={y(opened[i]) - 4} textAnchor="middle" fontSize="10" fill="#5B6471">
                  {opened[i]}
                </text>
              )}
              {closed[i] > 0 && (
                <text x={cx + bw / 2 + 1} y={y(closed[i]) - 4} textAnchor="middle" fontSize="10" fill="#5B6471">
                  {closed[i]}
                </text>
              )}
              <text x={cx} y={H - 10} textAnchor="middle" fontSize="11" fill="#8A93A0">
                {m}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ───────────── أشرطة أفقية لنسبة الالتزام (المجالات) ───────────── */
export function AreaBars({ items, colorOf, emptyLabel = "—" }) {
  return (
    <ul className="space-y-3.5">
      {items.map((it) => (
        <li key={it.key}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-navy">{it.label}</span>
            <span className="flex items-center gap-2 text-charcoal/70">
              {it.sub && <span className="text-xs text-charcoal/50">{it.sub}</span>}
              <span className="font-bold text-navy">{fin(it.value) ? `${it.value}%` : emptyLabel}</span>
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-offwhite">
            {fin(it.value) && <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, it.value)}%`, background: colorOf(it.value) }} />}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ───────────── شريط مقسّم (توزيع) + أسطورة ───────────── */
export function SegmentBar({ segments }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-offwhite">
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => <div key={s.key} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} title={`${s.label}: ${s.value}`} />)}
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-2 text-center">
        {segments.map((s) => (
          <li key={s.key} className="rounded-lg bg-offwhite px-2 py-2">
            <div className="font-display text-xl font-bold" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-[11px] text-charcoal/60">{s.label}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
