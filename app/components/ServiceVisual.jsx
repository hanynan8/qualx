// app/components/ServiceVisual.jsx
//
// صورة/رسمة لكل خدمة. بدون أي صور خارجية (متوافق مع الـ CSP الحالي):
//  - لو الخدمة فيها حقل `image` (مسار محلي زي "/services/mystery.jpg" من مجلد
//    public/، أو رابط من cdn.jsdelivr.net المسموح في الـ CSP) بنعرض الصورة دي.
//  - غير كده بنرسم مشهد SVG مخصص للخدمة بألوان البراند (Navy / Sky / Gold).
// نسبة العرض للطول ثابتة 4:3 (viewBox 400×300).

const NAVY = "#0B1F3A";
const SKY = "#1E9BC6";
const GOLD = "#C9A227";
const OFFWHITE = "#F5F6F8";
const SKIN = "#F2C9A0";

// نجمة خماسية: بترجّع points جاهزة لـ <polygon>.
const star = (cx, cy, r) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

function Background({ id }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={NAVY} />
          <stop offset="1" stopColor="#15406E" />
        </linearGradient>
        <pattern id={`${id}-dots`} width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="#fff" opacity="0.10" />
        </pattern>
      </defs>
      <rect width="400" height="300" fill={`url(#${id}-bg)`} />
      <rect width="400" height="300" fill={`url(#${id}-dots)`} />
      <circle cx="330" cy="40" r="120" fill={SKY} opacity="0.16" />
      <circle cx="40" cy="290" r="110" fill={GOLD} opacity="0.12" />
    </>
  );
}

/* ───────────── 1) Mystery Shopping: واجهة محل + زبون بنظارة + عدسة مكبّرة ───────────── */
function MysteryShoppingScene() {
  return (
    <g>
      {/* ground */}
      <rect x="0" y="272" width="400" height="28" fill="#000" opacity="0.18" />

      {/* store */}
      <rect x="62" y="118" width="196" height="154" rx="6" fill={OFFWHITE} />
      {/* awning */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={56 + i * 35} y="90" width="35" height="34" fill={i % 2 ? OFFWHITE : GOLD} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx={73.5 + i * 35} cy="124" r="17.5" fill={i % 2 ? OFFWHITE : GOLD} />
      ))}
      <rect x="56" y="84" width="210" height="8" rx="4" fill={NAVY} opacity="0.55" />
      {/* windows + door */}
      <rect x="80" y="158" width="52" height="62" rx="4" fill={SKY} opacity="0.35" />
      <rect x="188" y="158" width="52" height="62" rx="4" fill={SKY} opacity="0.35" />
      <rect x="86" y="164" width="14" height="50" rx="3" fill="#fff" opacity="0.35" />
      <rect x="146" y="164" width="30" height="108" rx="4" fill={NAVY} />
      <circle cx="170" cy="222" r="2.6" fill={GOLD} />

      {/* customer */}
      <rect x="296" y="242" width="13" height="32" rx="5" fill={NAVY} />
      <rect x="316" y="242" width="13" height="32" rx="5" fill={NAVY} />
      <rect x="290" y="176" width="46" height="72" rx="18" fill={GOLD} />
      <circle cx="313" cy="152" r="21" fill={SKIN} />
      <path d="M292 148 C292 128 334 128 334 148 C328 140 298 140 292 148Z" fill={NAVY} />
      <rect x="298" y="148" width="30" height="9" rx="4.5" fill={NAVY} />
      <path d="M298 200 L282 224" stroke={SKIN} strokeWidth="9" strokeLinecap="round" />

      {/* magnifier */}
      <g className="svc-float">
        <circle cx="338" cy="82" r="27" fill={SKY} fillOpacity="0.25" stroke={GOLD} strokeWidth="6" />
        <line x1="319" y1="101" x2="304" y2="118" stroke={GOLD} strokeWidth="9" strokeLinecap="round" />
        <path d="M326 76 C330 68 342 66 348 74" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
      </g>

      {/* checklist card */}
      <g className="svc-float svc-float-slow">
        <rect x="24" y="26" width="98" height="60" rx="11" fill="#fff" opacity="0.96" />
        {[0, 1, 2].map((i) => (
          <g key={i}>
            <circle cx="42" cy={44 + i * 17} r="6" fill={i === 2 ? "#DCE3EC" : SKY} />
            {i < 2 && (
              <path d={`M39 ${44 + i * 17} l2.4 2.6 l4.2 -4.6`} stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            )}
            <rect x="54" y={41 + i * 17} width={i === 1 ? 46 : 58} height="6" rx="3" fill="#CFD8E3" />
          </g>
        ))}
      </g>
    </g>
  );
}

/* ───────────── 2) Managed Services: فريق + داشبورد + درع ───────────── */
function ManagedServicesScene() {
  return (
    <g>
      <rect x="0" y="278" width="400" height="22" fill="#000" opacity="0.18" />

      {/* dashboard */}
      <g className="svc-float svc-float-slow">
        <rect x="96" y="44" width="208" height="128" rx="14" fill={OFFWHITE} />
        <rect x="96" y="44" width="208" height="24" rx="14" fill="#DCE3EC" />
        <rect x="96" y="56" width="208" height="12" fill="#DCE3EC" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={112 + i * 14} cy="56" r="3.6" fill={[GOLD, SKY, NAVY][i]} />
        ))}
        {[
          [122, 128, 26, SKY],
          [154, 112, 42, SKY],
          [186, 96, 58, GOLD],
          [218, 108, 46, SKY],
          [250, 86, 68, SKY],
        ].map(([x, y, h, c]) => (
          <rect key={x} x={x} y={y + 6} width="22" height={h} rx="5" fill={c} />
        ))}
        <polyline points="128,124 160,108 194,90 226,102 262,80" fill="none" stroke={NAVY} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {[[128, 124], [160, 108], [194, 90], [226, 102], [262, 80]].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="4" fill="#fff" stroke={NAVY} strokeWidth="2.4" />
        ))}
      </g>

      {/* shield */}
      <g className="svc-float">
        <path d="M322 30 l30 11 v24 c0 19 -13 32 -30 40 c-17 -8 -30 -21 -30 -40 v-24 z" fill={GOLD} />
        <path d="M322 40 l20 7 v17 c0 13 -9 22 -20 28 c-11 -6 -20 -15 -20 -28 v-17 z" fill="#E0BC3E" />
        <polyline points="311,68 319,76 334,58" fill="none" stroke={NAVY} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* team */}
      {[
        [112, SKY, 0.9],
        [200, GOLD, 1],
        [288, OFFWHITE, 0.9],
      ].map(([cx, color, s], i) => (
        <g key={i} transform={`translate(${cx} 278) scale(${s}) translate(${-cx} -278)`}>
          <rect x={cx - 22} y="222" width="44" height="56" rx="18" fill={color} />
          <circle cx={cx} cy="204" r="16" fill={SKIN} />
          <path d={`M${cx - 16} 202 C${cx - 16} 184 ${cx + 16} 184 ${cx + 16} 202 C${cx + 10} 194 ${cx - 10} 194 ${cx - 16} 202Z`} fill={i === 1 ? NAVY : "#4A3A2A"} />
          <rect x={cx - 8} y="240" width="16" height="4" rx="2" fill={NAVY} opacity="0.25" />
        </g>
      ))}
      {/* links */}
      <path d="M112 188 C112 178 140 182 150 172" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="4 5" fill="none" />
      <path d="M200 184 L200 172" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="4 5" fill="none" />
      <path d="M288 188 C288 178 260 182 250 172" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeDasharray="4 5" fill="none" />
    </g>
  );
}

/* ───────────── 3) Auditing Visits: كليببورد + عدسة + صناديق منتجات ───────────── */
function AuditingScene() {
  const rows = [86, 124, 162, 200];
  return (
    <g>
      <rect x="0" y="274" width="400" height="26" fill="#000" opacity="0.18" />

      {/* boxes */}
      <rect x="20" y="230" width="48" height="44" rx="4" fill={GOLD} />
      <rect x="20" y="230" width="48" height="10" fill="#E0BC3E" />
      <rect x="40" y="230" width="8" height="44" fill="#fff" opacity="0.35" />
      <rect x="72" y="242" width="38" height="32" rx="4" fill={SKY} />
      <rect x="72" y="242" width="38" height="8" fill="#4DB6DA" />
      <rect x="30" y="196" width="42" height="34" rx="4" fill={OFFWHITE} />
      <rect x="47" y="196" width="8" height="34" fill={SKY} opacity="0.5" />

      {/* clipboard */}
      <g className="svc-float svc-float-slow">
        <rect x="122" y="36" width="156" height="214" rx="14" fill={OFFWHITE} />
        <rect x="172" y="26" width="56" height="26" rx="9" fill={GOLD} />
        <circle cx="200" cy="34" r="4" fill={NAVY} />
        {rows.map((y, i) => (
          <g key={y}>
            <rect x="142" y={y} width="24" height="24" rx="6" fill={i === 2 ? GOLD : i === 3 ? "none" : SKY} stroke={i === 3 ? SKY : "none"} strokeWidth="2.4" />
            {i < 2 && (
              <path d={`M148 ${y + 12} l5 5.5 l9 -10`} stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            )}
            {i === 2 && (
              <>
                <line x1="154" y1={y + 6} x2="154" y2={y + 14} stroke={NAVY} strokeWidth="3" strokeLinecap="round" />
                <circle cx="154" cy={y + 19} r="1.8" fill={NAVY} />
              </>
            )}
            <rect x="176" y={y + 3} width={[84, 70, 78, 62][i]} height="7" rx="3.5" fill="#CFD8E3" />
            <rect x="176" y={y + 14} width={[52, 44, 56, 40][i]} height="6" rx="3" fill="#E4EAF1" />
          </g>
        ))}
      </g>

      {/* magnifier */}
      <g className="svc-float">
        <circle cx="304" cy="176" r="38" fill="#fff" fillOpacity="0.14" stroke={GOLD} strokeWidth="9" />
        <line x1="331" y1="204" x2="366" y2="242" stroke={GOLD} strokeWidth="13" strokeLinecap="round" />
        <path d="M282 164 C288 148 310 144 322 156" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.6" />
        <polyline points="290,178 300,188 320,164" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <polygon points={star(350, 70, 12)} fill={GOLD} />
      <polygon points={star(86, 60, 8)} fill="#fff" opacity="0.6" />
    </g>
  );
}

/* ───────────── 4) Customer Experience: وش مبتسم + نجوم + رحلة العميل ───────────── */
function CustomerExperienceScene() {
  return (
    <g>
      {/* journey path */}
      <path d="M26 268 C100 236 150 282 220 254 S330 240 376 256" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="3" strokeDasharray="6 8" strokeLinecap="round" />
      {[[26, 268, OFFWHITE], [150, 262, SKY], [268, 246, GOLD], [376, 256, OFFWHITE]].map(([x, y, c]) => (
        <circle key={x} cx={x} cy={y} r="8" fill={c} stroke={NAVY} strokeWidth="3" />
      ))}

      {/* face */}
      <g className="svc-float svc-float-slow">
        <circle cx="200" cy="120" r="70" fill={GOLD} />
        <circle cx="200" cy="120" r="70" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="6" />
        <ellipse cx="172" cy="140" rx="11" ry="7" fill="#B3901F" opacity="0.5" />
        <ellipse cx="228" cy="140" rx="11" ry="7" fill="#B3901F" opacity="0.5" />
        <ellipse cx="178" cy="106" rx="7" ry="9" fill={NAVY} />
        <ellipse cx="222" cy="106" rx="7" ry="9" fill={NAVY} />
        <circle cx="180" cy="102" r="2.4" fill="#fff" />
        <circle cx="224" cy="102" r="2.4" fill="#fff" />
        <path d="M168 138 Q200 176 232 138" fill="none" stroke={NAVY} strokeWidth="7" strokeLinecap="round" />
      </g>

      {/* heart */}
      <g className="svc-float">
        <path d="M314 98 C290 80 282 62 296 53 C305 47 313 52 314 59 C315 52 323 47 332 53 C346 62 338 80 314 98Z" fill={SKY} />
        <path d="M301 62 C303 58 308 57 311 60" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
      </g>

      {/* rating card */}
      <g className="svc-float svc-float-slow">
        <rect x="42" y="52" width="86" height="46" rx="11" fill="#fff" opacity="0.96" />
        {[0, 1, 2, 3, 4].map((i) => (
          <polygon key={i} points={star(58 + i * 15, 68, 6.4)} fill={i < 4 ? GOLD : "#DCE3EC"} />
        ))}
        <rect x="54" y="82" width="62" height="6" rx="3" fill="#CFD8E3" />
      </g>

      {/* big stars row */}
      {[0, 1, 2, 3, 4].map((i) => (
        <polygon key={i} points={star(140 + i * 30, 218, 13)} fill={GOLD} opacity={i === 4 ? 0.45 : 1} />
      ))}
      <polygon points={star(360, 150, 8)} fill="#fff" opacity="0.55" />
      <polygon points={star(46, 170, 6)} fill="#fff" opacity="0.5" />
    </g>
  );
}

/* ───────────── مشهد افتراضي لأي خدمة جديدة تتضاف من الأدمن ───────────── */
function GenericScene() {
  return (
    <g>
      <g className="svc-float svc-float-slow">
        <circle cx="200" cy="140" r="78" fill={GOLD} />
        <polygon points={star(200, 140, 46)} fill={NAVY} />
      </g>
      <circle cx="98" cy="84" r="10" fill={SKY} />
      <circle cx="312" cy="212" r="14" fill="#fff" opacity="0.5" />
      <polygon points={star(322, 72, 10)} fill="#fff" opacity="0.6" />
    </g>
  );
}

const SCENES = {
  "mystery-shopping": MysteryShoppingScene,
  "managed-services": ManagedServicesScene,
  "auditing-visits": AuditingScene,
  "customer-experience": CustomerExperienceScene,
};

export default function ServiceVisual({ slug, image, alt = "", className = "" }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={alt} loading="lazy" className={`object-cover ${className}`} />
    );
  }

  const Scene = SCENES[slug] || GenericScene;
  const id = `sv-${slug || "generic"}`;

  return (
    <svg
      viewBox="0 0 400 300"
      xmlns="http://www.w3.org/2000/svg"
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <Background id={id} />
      <Scene />
    </svg>
  );
}