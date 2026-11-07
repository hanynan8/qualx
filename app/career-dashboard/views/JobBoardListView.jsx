"use client";

// views/JobBoardListView.jsx — "Job Board (List)": الوظائف المفتوحة في الموقع (On-site).
// عدّاد الوظائف + فلتر المسافة (100/125/150/150+) + وحدة Km/Mi + "from" (نقطة البداية)
// + Sort & Filter + بانر وظائف الويب والهاتف + كروت الوظائف + بانل Help Documents.
// المسافة بتتحسب في المتصفح من إحداثيات الوظيفة (لو موجودة) ومكان المستخدم الحالي.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, SlidersHorizontal, Search, X } from "lucide-react";
import JobCard from "../components/JobCard";
import JobDetail from "../components/JobDetail";
import HelpDocsPanel from "../components/HelpDocsPanel";
import { distanceKm, toUnit, formatDistance } from "../geo";

const LIMITS = ["10", "25", "50", "100", "125", "150", "any"];

function Pill({ value, onChange, children, label, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-9 appearance-none rounded-md bg-white ps-3 pe-8 text-sm font-semibold text-charcoal/80 shadow-[0_1px_3px_rgba(11,31,58,0.18)] outline-none focus:ring-2 focus:ring-gold/50"
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-charcoal/45" />
    </div>
  );
}

// خلفية البانر: شبكة دوائر وخطوط بلون Sky (زي رسمة الشبكة في المرجع).
function NetworkArt() {
  return (
    <svg viewBox="0 0 360 140" className="h-full w-full" aria-hidden fill="none" preserveAspectRatio="xMidYMid slice">
      <ellipse cx="170" cy="86" rx="130" ry="56" stroke="#1E9BC6" strokeOpacity=".35" />
      <ellipse cx="170" cy="86" rx="86" ry="36" stroke="#1E9BC6" strokeOpacity=".5" />
      <ellipse cx="170" cy="86" rx="38" ry="16" stroke="#1E9BC6" strokeWidth="2" />
      <circle cx="170" cy="62" r="7" fill="#1E9BC6" />
      <path d="M170 70v14" stroke="#1E9BC6" strokeWidth="3" />
      <path d="M170 56C200 20 240 24 262 40" stroke="#1E9BC6" strokeOpacity=".6" />
      <path d="M170 56C130 24 96 28 72 52" stroke="#1E9BC6" strokeOpacity=".6" />
      <rect x="250" y="30" width="26" height="18" rx="2" stroke="#1E9BC6" strokeWidth="2" />
      <circle cx="80" cy="66" r="6" fill="#1E9BC6" />
      <circle cx="230" cy="116" r="5" fill="#1E9BC6" />
      <path d="M118 34c8-12 22-12 28 0" stroke="#1E9BC6" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function JobBoardListView({ t, go }) {
  const [state, setState] = useState({ loading: true, error: false, items: [], webPhone: 0 });
  const [limit, setLimit] = useState("any");
  const [unit, setUnit] = useState("km");
  const [from, setFrom] = useState("");
  const [origin, setOrigin] = useState(null); // { lat, lng } من الجهاز
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(false);
  const [sort, setSort] = useState("newest");
  const [query, setQuery] = useState("");
  const [panel, setPanel] = useState(false);
  const [openJob, setOpenJob] = useState(null);
  const panelRef = useRef(null);

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: false }));
    fetch("/api/career/jobs?type=onsite", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) =>
        setState({ loading: false, error: false, items: d.items || [], webPhone: d.counts?.webPhone || 0 })
      )
      .catch(() => setState({ loading: false, error: true, items: [], webPhone: 0 }));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!panel) return;
    const onDown = (e) => panelRef.current && !panelRef.current.contains(e.target) && setPanel(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [panel]);

  function pickFrom(value) {
    setFrom(value);
    setLocError(false);
    if (value !== "device" || origin) return;
    if (!navigator.geolocation) return setLocError(true);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError(true);
        setLocating(false);
        setFrom("");
        setSort((cur) => (cur === "nearest" || cur === "farthest" ? "newest" : cur));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  const activeOrigin = from === "device" ? origin : null;
  const unitLabel = unit === "mi" ? t.mi : t.km;

  // كل وظيفة + مسافتها (كم) من نقطة البداية (null لو مش معروفة).
  const withDistance = useMemo(
    () => state.items.map((job) => ({ job, km: distanceKm(activeOrigin, job) })),
    [state.items, activeOrigin]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = withDistance.filter(({ job, km }) => {
      if (q && !`${job.title} ${job.client} ${job.city}`.toLowerCase().includes(q)) return false;
      // فلتر المسافة بيشتغل بس لما نقطة البداية معروفة؛ وقتها الوظيفة اللي بعدها مجهول (من غير إحداثيات) بتتخفى.
      if (limit !== "any" && activeOrigin) {
        const v = toUnit(km, unit);
        if (v == null || v > Number(limit)) return false;
      }
      return true;
    });

    const cmpStr = (a, b) => (a || "").localeCompare(b || "");
    list = [...list].sort((a, b) => {
      if (sort === "ending") {
        // اللي من غير تاريخ نهاية في الآخر.
        if (!a.job.lastDate) return b.job.lastDate ? 1 : 0;
        if (!b.job.lastDate) return -1;
        return cmpStr(a.job.lastDate, b.job.lastDate);
      }
      if (sort === "nearest") {
        if (a.km == null) return b.km == null ? 0 : 1;
        if (b.km == null) return -1;
        return a.km - b.km;
      }
      if (sort === "farthest") {
        if (a.km == null) return b.km == null ? 0 : 1;
        if (b.km == null) return -1;
        return b.km - a.km;
      }
      if (sort === "title") return cmpStr(a.job.title, b.job.title);
      return 0; // newest = ترتيب الـ API
    });
    return list;
  }, [withDistance, query, limit, unit, sort, activeOrigin]);

  const filtersActive = sort !== "newest" || query.trim() !== "";
  const resetFilters = () => {
    setSort("newest");
    setQuery("");
  };

  if (openJob) {
    const km = distanceKm(activeOrigin, openJob);
    return (
      <JobDetail
        job={openJob}
        t={t}
        backLabel={t.jobBoard}
        onBack={() => setOpenJob(null)}
        distanceText={formatDistance(km, unit, unitLabel)}
        showApply
      />
    );
  }

  const { loading, error, webPhone } = state;

  return (
    <div className="px-4 py-5 sm:px-8">
      <h1 className="font-display text-xl font-bold text-charcoal/85">{t.jobBoard}</h1>

      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          {/* بانر وظائف الويب والهاتف */}
          <button
            type="button"
            onClick={() => go("webPhone")}
            className="relative flex h-28 w-full items-center justify-end overflow-hidden rounded-md bg-white px-6 text-start shadow-[0_1px_4px_rgba(11,31,58,0.14)] transition hover:shadow-md sm:h-32"
          >
            <div className="absolute inset-y-0 start-0 w-1/2 opacity-90 rtl:-scale-x-100">
              <NetworkArt />
            </div>
            <p className="relative z-10 max-w-[52%] text-sm leading-relaxed text-charcoal/75">
              {t.didYouKnow} <strong className="font-extrabold text-sky">{webPhone}</strong>{" "}
              <strong className="font-extrabold text-charcoal/90">{t.webPhoneJobsShort}</strong> {t.didYouKnowTail}
            </p>
          </button>

          {/* شريط الأدوات */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <span className="text-sm text-charcoal/65">
              <strong className="text-base font-extrabold text-charcoal/90">{loading ? "…" : rows.length}</strong>{" "}
              {t.jobsWord}
            </span>
            <Pill value={limit} onChange={setLimit} label={t.distance}>
              {LIMITS.map((l) => (
                <option key={l} value={l}>
                  {l === "any" ? t.anyDistance : l}
                </option>
              ))}
            </Pill>
            <Pill value={unit} onChange={setUnit} label="Unit">
              <option value="km">{t.km}</option>
              <option value="mi">{t.mi}</option>
            </Pill>
            <span className="text-sm text-charcoal/50">{t.from}</span>
            <Pill value={from} onChange={pickFrom} label={t.from}>
              <option value="" disabled>
                {t.selectLocation}
              </option>
              <option value="device">{locating ? t.locating : t.myLocation}</option>
            </Pill>

            <div className="relative ms-auto" ref={panelRef}>
              <button
                type="button"
                onClick={() => setPanel((v) => !v)}
                aria-expanded={panel}
                className={`inline-flex h-9 items-center gap-2 rounded-md bg-white px-3.5 text-sm font-semibold shadow-[0_1px_3px_rgba(11,31,58,0.18)] transition hover:text-gold ${
                  filtersActive ? "text-gold" : "text-charcoal/80"
                }`}
              >
                {t.sortFilter}
                <SlidersHorizontal size={15} />
              </button>
              {panel && (
                <div className="absolute end-0 top-11 z-20 w-72 rounded-lg border border-navy/10 bg-white p-4 shadow-xl">
                  <div className="relative">
                    <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t.searchJobs}
                      maxLength={100}
                      className="h-9 w-full rounded-md border border-charcoal/15 ps-9 pe-8 text-sm outline-none focus:border-gold"
                    />
                    {query && (
                      <button type="button" onClick={() => setQuery("")} aria-label={t.reset} className="absolute end-2.5 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal">
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <p className="mb-1.5 mt-4 text-xs font-bold uppercase tracking-wide text-charcoal/45">{t.sortBy}</p>
                  {[
                    ["newest", t.sortNewest],
                    ["ending", t.sortEnding],
                    ["nearest", t.sortNearest],
                    ["farthest", t.sortFarthest],
                    ["title", t.sortTitle],
                  ].map(([key, label]) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2.5 rounded px-1.5 py-1.5 text-sm hover:bg-offwhite">
                      <input
                        type="radio"
                        name="job-sort"
                        checked={sort === key}
                        onChange={() => {
                          setSort(key);
                          // الترتيب بالمسافة محتاج مكان الفريلانسر: نطلبه أوتوماتيك لو لسه ما اتحددش.
                          if ((key === "nearest" || key === "farthest") && !activeOrigin) pickFrom("device");
                        }}
                        className="accent-[#C9A227]"
                      />
                      {label}
                    </label>
                  ))}

                  <button type="button" onClick={resetFilters} className="mt-3 text-xs font-semibold text-sky hover:text-gold">
                    {t.reset}
                  </button>
                </div>
              )}
            </div>
          </div>

          {(locError || (!activeOrigin && !locating)) && !loading && !error && state.items.length > 0 && (
            <p className="mt-2 text-xs text-charcoal/50">{locError ? t.locationDenied : t.distanceHint}</p>
          )}

          {/* القائمة */}
          <div className="mt-4 space-y-4">
            {loading ? (
              [0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-md bg-white/70" />)
            ) : error ? (
              <div className="rounded-md bg-white p-8 text-center shadow-sm">
                <p className="text-charcoal/70">{t.loadFailed}</p>
                <button type="button" onClick={load} className="mt-3 rounded-full bg-gold px-5 py-2 text-sm font-bold text-navy hover:bg-[#b3901f]">
                  {t.retry}
                </button>
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-md bg-white p-10 text-center text-sm text-charcoal/60 shadow-sm">
                {state.items.length === 0 ? t.noOpenJobs : t.noMatch}
              </div>
            ) : (
              rows.map(({ job, km }) => (
                <JobCard
                  key={job.id}
                  job={job}
                  t={t}
                  distanceText={formatDistance(km, unit, unitLabel)}
                  onView={setOpenJob}
                />
              ))
            )}
          </div>
        </div>

        <aside>
          <HelpDocsPanel t={t} />
        </aside>
      </div>
    </div>
  );
}
