"use client";

// views/MyPayView.jsx — "My Pay": مستحقات المهام المنفذة لكل شهر (Pending Review / Pay Approved).
// جدول بصفوف قابلة للتوسيع + فلتر شهر + إجماليات (معتمد / قيد المراجعة) + بانل Help Documents.
// شيت الإكسيل الشهري بيتجمّع للحسابات من لوحة الأدمن (api/admin/career-pay/export).
import { useCallback, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import HelpDocsPanel from "../components/HelpDocsPanel";

const DOT = { pay_approved: "bg-emerald-500", pending_review: "bg-charcoal/35", rejected: "bg-red-500" };
const money = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function MyPayView({ t, language }) {
  const [month, setMonth] = useState("");
  const [state, setState] = useState({ loading: true, error: false, items: [], totals: {}, months: [] });
  const [open, setOpen] = useState(null);

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: false }));
    fetch(`/api/career/pay${month ? `?month=${month}` : ""}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setState({ loading: false, error: false, items: d.items || [], totals: d.totals || {}, months: d.months || [] }))
      .catch(() => setState((s) => ({ ...s, loading: false, error: true })));
  }, [month]);
  useEffect(load, [load]);

  const monthLabel = (m) => {
    const [y, mo] = m.split("-").map(Number);
    return new Date(Date.UTC(y, mo - 1, 1)).toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  };

  const { loading, error, items, totals, months } = state;
  const currencies = Object.keys(totals);

  return (
    <div className="px-4 py-5 sm:px-8">
      <h1 className="font-display text-xl font-bold text-charcoal/85">{t.nav.pay}</h1>

      <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                aria-label={t.month}
                className="h-10 appearance-none rounded-md bg-white ps-3 pe-8 text-sm font-bold text-charcoal/85 shadow-[0_1px_3px_rgba(11,31,58,0.18)] outline-none focus:ring-2 focus:ring-gold/50"
              >
                <option value="">{t.allMonths}</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-charcoal/45" />
            </div>
            <span className="text-sm text-charcoal/60">
              <strong className="text-base font-extrabold text-charcoal/90">{loading ? "…" : items.length}</strong> {t.payItems}
            </span>
          </div>

          {/* إجماليات */}
          {!loading && currencies.length > 0 && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {currencies.map((cur) => (
                <div key={cur} className="contents">
                  <div className="rounded-md bg-white p-4 shadow-[0_1px_4px_rgba(11,31,58,0.14)]">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">{t.payStatus.pay_approved}</div>
                    <div className="mt-1 text-2xl font-extrabold text-emerald-700" dir="ltr">
                      {money(totals[cur].approved)} <span className="text-sm font-bold">{cur}</span>
                    </div>
                  </div>
                  <div className="rounded-md bg-white p-4 shadow-[0_1px_4px_rgba(11,31,58,0.14)]">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">{t.payStatus.pending_review}</div>
                    <div className="mt-1 text-2xl font-extrabold text-charcoal/70" dir="ltr">
                      {money(totals[cur].pending)} <span className="text-sm font-bold">{cur}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 overflow-x-auto rounded-md bg-white shadow-[0_1px_4px_rgba(11,31,58,0.14)]">
            {loading ? (
              <div className="space-y-3 p-5" aria-busy>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-charcoal/5" />
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-charcoal/70">{t.loadFailed}</p>
                <button type="button" onClick={load} className="mt-3 rounded-full bg-gold px-5 py-2 text-sm font-bold text-navy hover:bg-[#b3901f]">
                  {t.retry}
                </button>
              </div>
            ) : items.length === 0 ? (
              <p className="p-10 text-center text-sm text-charcoal/60">{t.noPay}</p>
            ) : (
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-charcoal/10 text-start text-xs font-extrabold text-charcoal/85">
                    <th className="w-10 px-3 py-4" />
                    <th className="px-2 py-4 text-start">{t.payCols.title}</th>
                    <th className="px-2 py-4 text-start">{t.payCols.total}</th>
                    <th className="px-2 py-4 text-start">{t.payCols.currency}</th>
                    <th className="px-2 py-4 text-start">{t.payCols.status}</th>
                    <th className="px-2 py-4 text-start">{t.payCols.comp}</th>
                    <th className="px-2 py-4 text-start">{t.payCols.reimb}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <PayRow key={it.id} it={it} t={t} open={open === it.id} toggle={() => setOpen(open === it.id ? null : it.id)} monthLabel={monthLabel} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <aside>
          <HelpDocsPanel t={t} />
        </aside>
      </div>
    </div>
  );
}

function PayRow({ it, t, open, toggle, monthLabel }) {
  return (
    <>
      <tr className="border-b border-charcoal/10 align-top">
        <td className="px-3 py-3">
          <button type="button" onClick={toggle} aria-expanded={open} aria-label="Details" className="text-charcoal/45 hover:text-gold">
            <ChevronDown size={18} className={`transition ${open ? "rotate-180" : ""}`} />
          </button>
        </td>
        <td className="px-2 py-3 font-semibold text-charcoal/80">
          <span className={`me-2 inline-block h-2 w-2 rounded-full ${DOT[it.status] || "bg-charcoal/35"}`} />
          {it.jobTitle}
        </td>
        <td className="px-2 py-3" dir="ltr">{money(it.total)}</td>
        <td className="px-2 py-3">{it.currency}</td>
        <td className="px-2 py-3">{t.payStatus[it.status]}</td>
        <td className="px-2 py-3" dir="ltr">{money(it.compensation)}</td>
        <td className="px-2 py-3" dir="ltr">{money(it.reimbursement)}</td>
      </tr>
      {open && (
        <tr className="border-b border-charcoal/10 bg-[#F7F7F8] text-xs text-charcoal/70">
          <td />
          <td colSpan={6} className="px-2 py-3">
            <span className="me-6">{t.month}: <b className="text-charcoal/85">{monthLabel(it.month)}</b></span>
            {it.note && <span>{t.applyNote}: <b className="text-charcoal/85">{it.note}</b></span>}
          </td>
        </tr>
      )}
    </>
  );
}
