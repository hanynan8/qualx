"use client";

// views/JobBoardMapView.jsx — "Job Board (Map)": الوظائف المفتوحة (On-site) على خريطة مصر.
// الوظائف بتظهر بس لما الزوم يوصل لحد معيّن (MIN_JOB_ZOOM)؛ قبل كده بيظهر "ZOOM IN TO SEE JOBS".
// كل ماركر بيفتح بوباب: العنوان، العميل، المدينة، المحافظة، البلد + زر View Job.
// Leaflet + OpenStreetMap (من غير API key). بيتحمّل في المتصفح بس (dynamic import جوه useEffect).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Home, LocateFixed, Plus, Minus } from "lucide-react";
import "leaflet/dist/leaflet.css";
import JobDetail from "../components/JobDetail";
import { distanceKm, formatDistance } from "../geo";
import { EGYPT_BOUNDS, EGYPT_CENTER, insideEgypt, nearestGovernorate } from "../egypt";

const MIN_JOB_ZOOM = 8; // أقل زوم تظهر عنده الوظائف
const START_ZOOM = 6;

const PIN_SVG =
  '<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M17 43C17 43 32 27 32 16A15 15 0 0 0 2 16C2 27 17 43 17 43Z" fill="#C9A227" stroke="#0B1F3A" stroke-width="2"/>' +
  '<circle cx="17" cy="16" r="6" fill="#0B1F3A"/></svg>';

function MapBtn({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-charcoal/80 shadow-[0_1px_5px_rgba(11,31,58,0.35)] transition hover:text-gold"
    >
      {children}
    </button>
  );
}

export default function JobBoardMapView({ t, language }) {
  const ar = language === "ar";
  const [state, setState] = useState({ loading: true, error: false, items: [] });
  const [zoom, setZoom] = useState(START_ZOOM);
  const [inView, setInView] = useState(0);
  const [openJob, setOpenJob] = useState(null);
  const [origin, setOrigin] = useState(null);

  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const layerRef = useRef(null);
  const onViewRef = useRef(null);
  onViewRef.current = setOpenJob;

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: false }));
    fetch("/api/career/jobs?type=onsite", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setState({ loading: false, error: false, items: d.items || [] }))
      .catch(() => setState({ loading: false, error: true, items: [] }));
  }, []);
  useEffect(load, [load]);

  // الوظائف اللي ليها إحداثيات داخل مصر + المحافظة المحسوبة.
  const jobs = useMemo(
    () =>
      state.items
        .filter((j) => insideEgypt(j.lat, j.lng))
        .map((j) => ({ ...j, gov: nearestGovernorate(j.lat, j.lng) })),
    [state.items]
  );
  const unplaced = state.items.length - jobs.length;

  // إنشاء الخريطة مرة واحدة.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(mapEl.current, {
        center: EGYPT_CENTER,
        zoom: START_ZOOM,
        minZoom: 5,
        maxZoom: 18,
        maxBounds: L.latLngBounds(EGYPT_BOUNDS).pad(0.35),
        maxBoundsViscosity: 0.9,
        zoomControl: false,
        attributionControl: true,
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      map.on("zoomend moveend", () => setZoom(map.getZoom()));
      mapRef.current = map;
      setZoom(map.getZoom());
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // رسم الماركرز: بس لما الزوم >= MIN_JOB_ZOOM، وبس اللي جوه الشاشة.
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    const layer = layerRef.current;
    if (!map || !L || !layer) return;
    layer.clearLayers();
    if (zoom < MIN_JOB_ZOOM) return setInView(0);

    const bounds = map.getBounds().pad(0.1);
    let n = 0;
    for (const job of jobs) {
      if (!bounds.contains([job.lat, job.lng])) continue;
      n++;
      const marker = L.marker([job.lat, job.lng], {
        title: job.title,
        icon: L.divIcon({ className: "", html: PIN_SVG, iconSize: [34, 44], iconAnchor: [17, 43], popupAnchor: [0, -40] }),
      });

      // البوباب بـ DOM nodes (textContent) — مفيش innerHTML لبيانات الوظيفة.
      const box = document.createElement("div");
      box.dir = ar ? "rtl" : "ltr";
      box.style.cssText = "min-width:210px;max-width:260px;font-family:inherit";
      const h = document.createElement("div");
      h.textContent = job.title;
      h.style.cssText = "font-weight:800;font-size:13px;color:#0B1F3A;text-transform:uppercase;line-height:1.35";
      box.appendChild(h);
      const rows = [
        [t.client, job.client],
        [t.cityLabel, job.city],
        [t.governorate, ar ? job.gov?.ar : job.gov?.en],
        [t.country, t.egypt],
        [t.compensation, job.compensation],
      ];
      for (const [k, v] of rows) {
        if (!v) continue;
        const r = document.createElement("div");
        r.style.cssText = "margin-top:4px;font-size:12px;color:#2D3436";
        const kk = document.createElement("span");
        kk.textContent = `${k}: `;
        kk.style.cssText = "color:#2D343699;font-weight:600";
        r.appendChild(kk);
        r.appendChild(document.createTextNode(v));
        box.appendChild(r);
      }
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = t.viewJob;
      btn.style.cssText =
        "margin-top:10px;border:1px solid #0B1F3A;border-radius:999px;padding:4px 16px;font-size:12px;font-weight:700;color:#0B1F3A;background:#fff;cursor:pointer";
      btn.onclick = () => onViewRef.current(job);
      box.appendChild(btn);

      marker.bindPopup(box, { closeButton: true, autoPanPadding: [30, 30] });
      marker.addTo(layer);
    }
    setInView(n);
  }, [zoom, jobs, ar, t]);

  const goHome = () => mapRef.current?.setView(EGYPT_CENTER, START_ZOOM);
  const locate = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(p);
        if (insideEgypt(p.lat, p.lng)) mapRef.current.setView([p.lat, p.lng], Math.max(MIN_JOB_ZOOM, 10));
      },
      () => {},
      { timeout: 10000, maximumAge: 300000 }
    );
  };

  if (openJob) {
    return (
      <JobDetail
        job={openJob}
        t={t}
        backLabel={t.nav.jobMap}
        onBack={() => setOpenJob(null)}
        distanceText={formatDistance(distanceKm(origin, openJob), "km", t.km)}
        showApply
      />
    );
  }

  const tooFar = zoom < MIN_JOB_ZOOM;

  return (
    <div className="relative h-[calc(100vh-4rem)] min-h-[420px] w-full">
      <div ref={mapEl} className="absolute inset-0 z-0 bg-[#AAC8E6]" dir="ltr" />

      <div className="absolute end-4 top-4 z-[500] flex flex-col gap-3">
        <MapBtn onClick={goHome} label={t.resetMap}>
          <Home size={20} />
        </MapBtn>
        <MapBtn onClick={locate} label={t.myLocation}>
          <LocateFixed size={20} />
        </MapBtn>
        <MapBtn onClick={() => mapRef.current?.zoomIn()} label="Zoom in">
          <Plus size={22} />
        </MapBtn>
        <MapBtn onClick={() => mapRef.current?.zoomOut()} label="Zoom out">
          <Minus size={22} />
        </MapBtn>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 z-[500] flex justify-center px-4">
        {state.loading ? (
          <span className="rounded-full bg-white px-5 py-2 text-sm font-bold text-charcoal/80 shadow-lg">{t.loading}</span>
        ) : state.error ? (
          <button
            type="button"
            onClick={load}
            className="pointer-events-auto rounded-full bg-white px-5 py-2 text-sm font-bold text-red-700 shadow-lg"
          >
            {t.loadFailed} — {t.retry}
          </button>
        ) : tooFar ? (
          <span className="rounded-full bg-white px-5 py-2 text-sm font-extrabold uppercase tracking-wide text-charcoal/85 shadow-lg">
            {t.zoomToSee}
          </span>
        ) : (
          <span className="rounded-full bg-white px-5 py-2 text-sm font-bold text-charcoal/80 shadow-lg">
            {inView} {t.jobsWord}
            {unplaced > 0 ? ` · ${unplaced} ${t.noCoords}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}
