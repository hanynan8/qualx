// app/sitemap.js
import { SITE_URL } from "./lib/siteConfig";

// slugs الخدمات الأربعة (نفس اللي في app/lib/servicesFallback.js)
const SERVICE_SLUGS = ["mystery-shopping", "managed-services", "auditing-visits", "customer-experience"];

export default function sitemap() {
  const now = new Date();
  const pages = [
    { path: "", priority: 1 },
    { path: "/about", priority: 0.8 },
    { path: "/solutions", priority: 0.9 },
    ...SERVICE_SLUGS.map((s) => ({ path: `/solutions/${s}`, priority: 0.7 })),
    { path: "/careers", priority: 0.6 },
  ];
  return pages.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority,
  }));
}
