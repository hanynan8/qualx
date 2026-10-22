// app/manifest.js
import { SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION, SITE_THEME_COLOR } from "./lib/siteConfig";

export default function manifest() {
  return {
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#F5F6F8",
    theme_color: SITE_THEME_COLOR,
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
