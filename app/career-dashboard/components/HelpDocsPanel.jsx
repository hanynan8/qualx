"use client";

// components/HelpDocsPanel.jsx — بانل "HELP DOCUMENTS" الجانبي (لسه من غير مستندات).
export default function HelpDocsPanel({ t }) {
  return (
    <div className="rounded-md bg-white p-5 shadow-[0_1px_4px_rgba(11,31,58,0.14)]">
      <h2 className="text-center text-sm font-extrabold uppercase tracking-wide text-charcoal">{t.helpDocs}</h2>
      <p className="mt-4 text-center text-xs text-charcoal/45">{t.noHelpDocs}</p>
    </div>
  );
}
