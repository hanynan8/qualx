// app/career-dashboard/geo.js — حساب المسافة (Haversine) وتنسيقها.

const R_KM = 6371;
const toRad = (d) => (d * Math.PI) / 180;

export function distanceKm(a, b) {
  if (!a || !b || [a.lat, a.lng, b.lat, b.lng].some((v) => typeof v !== "number")) return null;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export const toUnit = (km, unit) => (km == null ? null : unit === "mi" ? km * 0.621371 : km);

export function formatDistance(km, unit, label) {
  const v = toUnit(km, unit);
  if (v == null) return "-";
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${label}`;
}
