"use client";

// LocationPicker.jsx — اختيار موقع الوظيفة بالضغط على خريطة مصر (Leaflet + OpenStreetMap).
// بيحدّث lat/lng؛ الإحداثيات برضه ينفع تتكتب يدوي في الفورم.
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { EGYPT_BOUNDS, EGYPT_CENTER, insideEgypt } from "../../../career-dashboard/egypt";

const PIN =
  '<svg width="30" height="40" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg"><path d="M17 43C17 43 32 27 32 16A15 15 0 0 0 2 16C2 27 17 43 17 43Z" fill="#C9A227" stroke="#0B1F3A" stroke-width="2"/><circle cx="17" cy="16" r="6" fill="#0B1F3A"/></svg>';

export default function LocationPicker({ lat, lng, onChange }) {
  const el = useRef(null);
  const state = useRef({ map: null, marker: null, L: null });
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    let dead = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (dead || !el.current || state.current.map) return;
      const has = insideEgypt(lat, lng);
      const map = L.map(el.current, {
        center: has ? [lat, lng] : EGYPT_CENTER,
        zoom: has ? 11 : 6,
        minZoom: 5,
        maxBounds: L.latLngBounds(EGYPT_BOUNDS).pad(0.35),
      });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const icon = L.divIcon({ className: "", html: PIN, iconSize: [30, 40], iconAnchor: [15, 39] });
      state.current = { map, L, marker: has ? L.marker([lat, lng], { icon }).addTo(map) : null, icon };
      map.on("click", (e) => {
        const la = Number(e.latlng.lat.toFixed(6));
        const ln = Number(e.latlng.lng.toFixed(6));
        if (!insideEgypt(la, ln)) return;
        cb.current(la, ln);
      });
    })();
    return () => {
      dead = true;
      state.current.map?.remove();
      state.current = { map: null, marker: null, L: null };
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // تزامن الماركر مع القيم (من الضغط أو من الكتابة اليدوية).
  useEffect(() => {
    const { map, L, icon } = state.current;
    if (!map || !L) return;
    if (!insideEgypt(lat, lng)) {
      state.current.marker?.remove();
      state.current.marker = null;
      return;
    }
    if (state.current.marker) state.current.marker.setLatLng([lat, lng]);
    else state.current.marker = L.marker([lat, lng], { icon }).addTo(map);
  }, [lat, lng]);

  return <div ref={el} className="z-0 h-64 w-full rounded-lg border border-gray-300" dir="ltr" />;
}
