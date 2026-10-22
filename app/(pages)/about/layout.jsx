// app/(pages)/about/layout.jsx — ميتاداتا صفحة "من نحن" (الصفحة نفسها client component).
import { pageOpenGraph } from "../../lib/siteConfig";

const DESCRIPTION =
  "Merilex is a company specialized in evaluating customer experience and quality control (Mystery Shopping & QA) for businesses and branches across Egypt, through confidential evaluation visits and documented reports.";

export const metadata = {
  title: "About us",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: pageOpenGraph("/about", "About us", DESCRIPTION),
};

export default function AboutLayout({ children }) {
  return children;
}
