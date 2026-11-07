// app/career-dashboard/egypt.js — حدود مصر + مراكز المحافظات (لتحديد المحافظة من الإحداثيات بدون أي API خارجي).

// [جنوب-غرب، شمال-شرق] — حدود مصر التقريبية؛ الخريطة مقفولة عليها.
export const EGYPT_BOUNDS = [
  [21.5, 24.5],
  [32.0, 37.0],
];
export const EGYPT_CENTER = [26.8, 30.0];

// مركز تقريبي لكل محافظة [lat, lng].
export const GOVERNORATES = [
  { en: "Cairo", ar: "القاهرة", lat: 30.0444, lng: 31.2357 },
  { en: "Giza", ar: "الجيزة", lat: 30.0131, lng: 31.2089 },
  { en: "Alexandria", ar: "الإسكندرية", lat: 31.2001, lng: 29.9187 },
  { en: "Qalyubia", ar: "القليوبية", lat: 30.4, lng: 31.2 },
  { en: "Port Said", ar: "بورسعيد", lat: 31.2653, lng: 32.3019 },
  { en: "Suez", ar: "السويس", lat: 29.9668, lng: 32.5498 },
  { en: "Damietta", ar: "دمياط", lat: 31.4165, lng: 31.8133 },
  { en: "Dakahlia", ar: "الدقهلية", lat: 31.0409, lng: 31.3785 },
  { en: "Sharqia", ar: "الشرقية", lat: 30.5877, lng: 31.502 },
  { en: "Gharbia", ar: "الغربية", lat: 30.8754, lng: 31.0335 },
  { en: "Monufia", ar: "المنوفية", lat: 30.5972, lng: 30.9876 },
  { en: "Kafr El Sheikh", ar: "كفر الشيخ", lat: 31.1107, lng: 30.9388 },
  { en: "Beheira", ar: "البحيرة", lat: 30.8481, lng: 30.3436 },
  { en: "Ismailia", ar: "الإسماعيلية", lat: 30.5965, lng: 32.2715 },
  { en: "North Sinai", ar: "شمال سيناء", lat: 31.1, lng: 33.8 },
  { en: "South Sinai", ar: "جنوب سيناء", lat: 28.2, lng: 33.6 },
  { en: "Fayoum", ar: "الفيوم", lat: 29.3084, lng: 30.8428 },
  { en: "Beni Suef", ar: "بني سويف", lat: 29.0661, lng: 31.0994 },
  { en: "Minya", ar: "المنيا", lat: 28.1099, lng: 30.7503 },
  { en: "Asyut", ar: "أسيوط", lat: 27.1809, lng: 31.1837 },
  { en: "Sohag", ar: "سوهاج", lat: 26.5591, lng: 31.6957 },
  { en: "Qena", ar: "قنا", lat: 26.1551, lng: 32.7160 },
  { en: "Luxor", ar: "الأقصر", lat: 25.6872, lng: 32.6396 },
  { en: "Aswan", ar: "أسوان", lat: 24.0889, lng: 32.8998 },
  { en: "Red Sea", ar: "البحر الأحمر", lat: 26.7, lng: 33.9 },
  { en: "New Valley", ar: "الوادي الجديد", lat: 25.45, lng: 30.55 },
  { en: "Matrouh", ar: "مطروح", lat: 31.3543, lng: 27.2373 },
];

const R = 6371;
const rad = (d) => (d * Math.PI) / 180;
function km(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** أقرب محافظة لنقطة (تقريبي: أقرب مركز). */
export function nearestGovernorate(lat, lng) {
  let best = null;
  let bestD = Infinity;
  for (const g of GOVERNORATES) {
    const d = km({ lat, lng }, g);
    if (d < bestD) {
      best = g;
      bestD = d;
    }
  }
  return best;
}

export const insideEgypt = (lat, lng) =>
  typeof lat === "number" &&
  typeof lng === "number" &&
  lat >= EGYPT_BOUNDS[0][0] &&
  lat <= EGYPT_BOUNDS[1][0] &&
  lng >= EGYPT_BOUNDS[0][1] &&
  lng <= EGYPT_BOUNDS[1][1];
