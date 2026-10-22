// app/components/DashboardPreview.jsx
//
// صورة توضيحية لداشبورد الميستري شوبنج (SVG مرسوم بالكود — بدون صور خارجية،
// متوافق مع الـ CSP). الأرقام نفس بيانات الداشبورد الحقيقي في
// app/dashboard/mystery-shopping/data.js. الـ viewBox ثابت 800×500.

const NAVY = "#0B1F3A";
const SKY = "#1E9BC6";
const GOLD = "#C9A227";
const OFFWHITE = "#F5F6F8";
const CHARCOAL = "#2D3436";
const GREEN = "#1F9D6B";

const TXT = {
  en: {
    url: "app.merilex.com/dashboard/mystery-shopping",
    nav: ["Dashboard", "Visits", "Evaluations", "Branches", "Reports", "Analytics", "Settings"],
    welcome: "Welcome back",
    overview: "Here’s your quality performance overview.",
    kpis: ["Total Visits", "Average Rating", "Branches Evaluated", "Improvement Rate"],
    overall: "Overall Quality Score",
    excellent: "Excellent",
    trend: "Monthly Performance Trend",
    months: ["Dec", "Jan", "Feb", "Mar", "Apr", "May"],
    branchTitle: "Branch Score Comparison",
    branches: ["Downtown", "West End", "Northside", "Airport", "East Point"],
    criteriaTitle: "Evaluation Criteria",
    criteria: ["Service", "Cleanliness", "Speed", "Staff Behavior"],
  },
  ar: {
    url: "app.merilex.com/dashboard/mystery-shopping",
    nav: ["لوحة التحكم", "الزيارات", "التقييمات", "الفروع", "التقارير", "التحليلات", "الإعدادات"],
    welcome: "أهلًا بعودتك",
    overview: "نظرة عامة على أداء الجودة لديك.",
    kpis: ["إجمالي الزيارات", "متوسط التقييم", "الفروع المُقيَّمة", "معدل التحسّن"],
    overall: "درجة الجودة الكلية",
    excellent: "ممتاز",
    trend: "اتجاه الأداء الشهري",
    months: ["ديسمبر", "يناير", "فبراير", "مارس", "أبريل", "مايو"],
    branchTitle: "مقارنة درجات الفروع",
    branches: ["وسط البلد", "الغربية", "الشمالية", "المطار", "الشرقية"],
    criteriaTitle: "معايير التقييم",
    criteria: ["الخدمة", "النظافة", "السرعة", "سلوك الموظفين"],
  },
};

const KPI_VALUES = [
  { v: "248", d: "▲ 18.4%", c: SKY },
  { v: "4.6 / 5", d: "▲ 0.3", c: GOLD },
  { v: "32", d: "—", c: "#3B82F6" },
  { v: "18.7%", d: "▲ 5.2%", c: "#F59E0B" },
];
const QUALITY = [78, 82, 85, 88, 90, 92];
const BRANCH_SCORES = [96, 93, 92, 87, 84];
const CRITERIA_VALUES = [4.7, 4.6, 4.4, 4.8];

export default function DashboardPreview({ language = "en", className = "" }) {
  const t = TXT[language] || TXT.en;

  // Trend chart geometry
  const px0 = 372, px1 = 744, py0 = 200, py1 = 292;
  const pts = QUALITY.map((v, i) => [
    px0 + (i * (px1 - px0)) / (QUALITY.length - 1),
    py1 - ((v - 70) / 30) * (py1 - py0),
  ]);
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${px1} ${py1} L${px0} ${py1} Z`;

  const R = 40;
  const C = 2 * Math.PI * R;

  return (
    <svg
      viewBox="0 0 800 500"
      role="img"
      aria-label={t.overall}
      className={className}
      dir="ltr"
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <defs>
        <linearGradient id="dp-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SKY} stopOpacity="0.35" />
          <stop offset="1" stopColor={SKY} stopOpacity="0" />
        </linearGradient>
        <clipPath id="dp-clip">
          <rect width="800" height="500" rx="14" />
        </clipPath>
      </defs>

      <g clipPath="url(#dp-clip)" fontFamily="inherit">
        {/* browser chrome */}
        <rect width="800" height="500" fill="#fff" />
        <rect width="800" height="30" fill="#E6E9EE" />
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={18 + i * 15} cy="15" r="4.5" fill={["#F26B5E", "#F5BE4F", "#5FC36B"][i]} />
        ))}
        <rect x="230" y="6" width="340" height="18" rx="9" fill="#fff" />
        <text x="400" y="18.5" fontSize="9" fill={CHARCOAL} opacity="0.65" textAnchor="middle">{t.url}</text>

        {/* sidebar */}
        <rect y="30" width="140" height="470" fill={NAVY} />
        <rect x="16" y="46" width="22" height="22" rx="6" fill={GOLD} />
        <text x="46" y="62" fontSize="14" fontWeight="700" fill="#fff">Merilex</text>
        {t.nav.map((label, i) => (
          <g key={i}>
            {i === 0 && <rect x="8" y={84 + i * 34} width="124" height="28" rx="8" fill={GOLD} opacity="0.95" />}
            <rect x="20" y={93 + i * 34} width="10" height="10" rx="3" fill={i === 0 ? NAVY : "#fff"} opacity={i === 0 ? 1 : 0.55} />
            <text x="40" y={102 + i * 34} fontSize="10" fontWeight={i === 0 ? 700 : 500} fill={i === 0 ? NAVY : "#fff"} opacity={i === 0 ? 1 : 0.75}>
              {label}
            </text>
          </g>
        ))}

        {/* main bg */}
        <rect x="140" y="30" width="660" height="470" fill={OFFWHITE} />
        <text x="158" y="60" fontSize="15" fontWeight="700" fill={NAVY}>{t.welcome}</text>
        <text x="158" y="75" fontSize="9" fill={CHARCOAL} opacity="0.65">{t.overview}</text>
        <circle cx="768" cy="56" r="11" fill={NAVY} />
        <circle cx="768" cy="53" r="3.6" fill="#fff" opacity="0.9" />
        <path d="M761 62 C762 57 774 57 775 62Z" fill="#fff" opacity="0.9" />

        {/* KPI cards */}
        {KPI_VALUES.map((k, i) => {
          const x = 158 + i * 156;
          return (
            <g key={i}>
              <rect x={x} y="88" width="146" height="62" rx="10" fill="#fff" stroke="#E3E6EB" />
              <circle cx={x + 24} cy="119" r="15" fill={k.c} opacity="0.18" />
              <rect x={x + 18} y="113" width="12" height="12" rx="3" fill={k.c} />
              <text x={x + 48} y="106" fontSize="8" fill={CHARCOAL} opacity="0.7">{t.kpis[i]}</text>
              <text x={x + 48} y="127" fontSize="17" fontWeight="700" fill={NAVY}>{k.v}</text>
              <text x={x + 48} y="141" fontSize="8" fontWeight="600" fill={k.d === "—" ? CHARCOAL : GREEN}>{k.d}</text>
            </g>
          );
        })}

        {/* overall gauge */}
        <rect x="158" y="162" width="170" height="150" rx="10" fill="#fff" stroke="#E3E6EB" />
        <text x="173" y="182" fontSize="10" fontWeight="700" fill={NAVY}>{t.overall}</text>
        <g transform="translate(243 246) rotate(-90)">
          <circle r={R} fill="none" stroke="#E6EBF1" strokeWidth="10" />
          <circle r={R} fill="none" stroke={SKY} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${C * 0.92} ${C}`} />
        </g>
        <text x="243" y="253" fontSize="22" fontWeight="800" fill={NAVY} textAnchor="middle">92%</text>
        <rect x="213" y="293" width="60" height="14" rx="7" fill={GREEN} opacity="0.15" />
        <text x="243" y="303" fontSize="8" fontWeight="700" fill={GREEN} textAnchor="middle">{t.excellent}</text>

        {/* trend chart */}
        <rect x="338" y="162" width="434" height="150" rx="10" fill="#fff" stroke="#E3E6EB" />
        <text x="354" y="182" fontSize="10" fontWeight="700" fill={NAVY}>{t.trend}</text>
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1={px0 - 10} x2={px1 + 10} y1={py0 + (i * (py1 - py0)) / 3} y2={py0 + (i * (py1 - py0)) / 3} stroke="#E8EBF0" />
        ))}
        <path d={area} fill="url(#dp-area)" />
        <path d={line} fill="none" stroke={SKY} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="3.6" fill="#fff" stroke={SKY} strokeWidth="2" />
        ))}
        {t.months.map((m, i) => (
          <text key={i} x={pts[i][0]} y="306" fontSize="8" fill={CHARCOAL} opacity="0.65" textAnchor="middle">{m}</text>
        ))}

        {/* branch bars */}
        <rect x="158" y="324" width="318" height="168" rx="10" fill="#fff" stroke="#E3E6EB" />
        <text x="173" y="344" fontSize="10" fontWeight="700" fill={NAVY}>{t.branchTitle}</text>
        {t.branches.map((b, i) => {
          const y = 358 + i * 26;
          const w = (BRANCH_SCORES[i] / 100) * 170;
          return (
            <g key={i}>
              <text x="173" y={y + 10} fontSize="8.5" fill={CHARCOAL}>{b}</text>
              <rect x="240" y={y} width="170" height="12" rx="6" fill="#EDF0F4" />
              <rect x="240" y={y} width={w} height="12" rx="6" fill={i === 2 ? GOLD : SKY} />
              <text x="420" y={y + 10} fontSize="9" fontWeight="700" fill={NAVY}>{BRANCH_SCORES[i]}%</text>
            </g>
          );
        })}

        {/* criteria */}
        <rect x="486" y="324" width="286" height="168" rx="10" fill="#fff" stroke="#E3E6EB" />
        <text x="501" y="344" fontSize="10" fontWeight="700" fill={NAVY}>{t.criteriaTitle}</text>
        {t.criteria.map((c, i) => {
          const y = 362 + i * 31;
          const w = (CRITERIA_VALUES[i] / 5) * 250;
          return (
            <g key={i}>
              <text x="501" y={y} fontSize="8.5" fill={CHARCOAL}>{c}</text>
              <text x="757" y={y} fontSize="9" fontWeight="700" fill={NAVY} textAnchor="end">{CRITERIA_VALUES[i]}</text>
              <rect x="501" y={y + 6} width="256" height="8" rx="4" fill="#EDF0F4" />
              <rect x="501" y={y + 6} width={w} height="8" rx="4" fill={[SKY, GOLD, "#3B82F6", GREEN][i]} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
