// app/components/AboutVisual.jsx
//
// رسمة قسم "Who we are": درع جودة في النص، حواليه مدار فيه 3 أيقونات
// (تسوق سري / فريق / تقارير)، وفي الخلفية أهرامات كإشارة للسوق المصري.
// SVG بس — بدون صور خارجية (متوافق مع الـ CSP).

const NAVY = "#0B1F3A";
const SKY = "#1E9BC6";
const GOLD = "#C9A227";

export default function AboutVisual({ className = "", alt = "" }) {
  return (
    <svg
      viewBox="0 0 400 320"
      xmlns="http://www.w3.org/2000/svg"
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      preserveAspectRatio="xMidYMid slice"
      className={className}
    >
      <defs>
        <linearGradient id="about-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={NAVY} />
          <stop offset="1" stopColor="#15406E" />
        </linearGradient>
        <pattern id="about-dots" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="#fff" opacity="0.10" />
        </pattern>
        <radialGradient id="about-glow" cx="0.5" cy="0.45" r="0.5">
          <stop offset="0" stopColor={GOLD} stopOpacity="0.35" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="400" height="320" fill="url(#about-bg)" />
      <rect width="400" height="320" fill="url(#about-dots)" />
      <circle cx="200" cy="150" r="150" fill="url(#about-glow)" />
      <circle cx="350" cy="40" r="110" fill={SKY} opacity="0.14" />

      {/* pyramids */}
      <polygon points="30,320 128,226 226,320" fill="#1B4A7A" opacity="0.75" />
      <polygon points="150,320 262,210 374,320" fill="#226089" opacity="0.75" />
      <polygon points="300,320 356,266 412,320" fill="#2B76A3" opacity="0.7" />

      {/* orbit */}
      <circle cx="200" cy="150" r="125" fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="5 8" />

      {/* shield */}
      <g className="svc-float svc-float-slow">
        <path d="M200 58 l72 27 v58 c0 45 -31 76 -72 94 c-41 -18 -72 -49 -72 -94 v-58 z" fill={GOLD} />
        <path d="M200 78 l54 20 v44 c0 33 -23 56 -54 70 c-31 -14 -54 -37 -54 -70 v-44 z" fill="#E0BC3E" />
        <polyline points="172,148 195,171 233,124" fill="none" stroke={NAVY} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* node: eye (mystery shopping) */}
      <g className="svc-float">
        <circle cx="92" cy="88" r="25" fill="#fff" />
        <path d="M76 88 C83 78 101 78 108 88 C101 98 83 98 76 88Z" fill="none" stroke={SKY} strokeWidth="3" strokeLinejoin="round" />
        <circle cx="92" cy="88" r="4.5" fill={NAVY} />
      </g>

      {/* node: team */}
      <g className="svc-float svc-float-slow">
        <circle cx="308" cy="88" r="25" fill="#fff" />
        <circle cx="300" cy="82" r="5.5" fill={SKY} />
        <circle cx="317" cy="82" r="5.5" fill={GOLD} />
        <path d="M290 102 C290 92 310 92 310 102Z" fill={SKY} />
        <path d="M307 102 C307 92 327 92 327 102Z" fill={GOLD} />
      </g>

      {/* node: report */}
      <g className="svc-float">
        <circle cx="200" cy="277" r="25" fill="#fff" />
        <rect x="188" y="264" width="24" height="28" rx="4" fill="none" stroke={SKY} strokeWidth="3" />
        <line x1="193" y1="273" x2="207" y2="273" stroke={NAVY} strokeWidth="2.6" strokeLinecap="round" />
        <line x1="193" y1="279" x2="207" y2="279" stroke={NAVY} strokeWidth="2.6" strokeLinecap="round" />
        <line x1="193" y1="285" x2="201" y2="285" stroke={GOLD} strokeWidth="2.6" strokeLinecap="round" />
      </g>

      <circle cx="46" cy="190" r="6" fill="#fff" opacity="0.5" />
      <circle cx="356" cy="200" r="8" fill={GOLD} opacity="0.8" />
    </svg>
  );
}