// app/(pages)/careers/layout.jsx — ميتاداتا صفحة الوظائف.
import { pageOpenGraph } from "../../lib/siteConfig";

const DESCRIPTION =
  "Join Merilex and help businesses see themselves the way their customers do. Explore open roles in mystery shopping, quality assurance, and customer experience across Egypt.";

export const metadata = {
  title: "Careers",
  description: DESCRIPTION,
  alternates: { canonical: "/careers" },
  openGraph: pageOpenGraph("/careers", "Careers", DESCRIPTION),
};

export default function CareersLayout({ children }) {
  return children;
}
