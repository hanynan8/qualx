// app/(pages)/solutions/layout.jsx — ميتاداتا صفحة الخدمات (وكمان /solutions/[slug]).
import { pageOpenGraph } from "../../lib/siteConfig";

const DESCRIPTION =
  "Mystery Shopping Visits, Auditing Visits, Managed Services, and Customer Experience (CX) solutions that keep quality consistent across every branch and turn documented findings into real improvements.";

export const metadata = {
  title: "Our Solutions",
  description: DESCRIPTION,
  alternates: { canonical: "/solutions" },
  openGraph: pageOpenGraph("/solutions", "Our Solutions", DESCRIPTION),
};

export default function SolutionsLayout({ children }) {
  return children;
}
