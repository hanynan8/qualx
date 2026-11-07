"use client";

// PayPanel.jsx — مستحقات الكارير: بنود لكل شهر + اعتماد/رفض + تحميل شيت الإكسيل الشهري للحسابات.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Wallet, Plus, Download, Trash2 } from "lucide-react";
import { api } from "../../adminUtils";
import PanelFrame from "../PanelFrame";
import { Field, Modal, Loading, ErrorBox, Badge, inputCls, btnPrimary, btnGhost, btnDanger, errText } from "./ui";

const TONE = { pending_review: "amber", pay_approved: "green", rejected: "red" };
const money = (n) => Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const thisMonth = () => new Date().toISOString().slice(0, 7);
const EMPTY = { email: "", jobTitle: "", compensation: "", reimbursement: "0", currency: "EGP", status: "pending_review", note: "" };

export default function PayPanel() {
  const [month, setMonth] = useState(thisMonth());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!/^\d{4}-\d{2}$/.test(month)) return;
    setLoading(true);
    setError("");
    try {
      setItems((await api(`/api/admin/career-pay?month=${month}`)).items || []);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, [month]);
  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => {
    const t = {};
    for (const it of items) {
      const c = (t[it.currency] ||= { approved: 0, pending: 0 });
      if (it.status === "pay_approved") c.approved += it.total;
      else if (it.status === "pending_review") c.pending += it.total;
    }
    return t;
  }, [items]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await api("/api/admin/career-pay", {
        method: "POST",
        body: JSON.stringify({ ...form, month, compensation: Number(form.compensation), reimbursement: Number(form.reimbursement || 0) }),
      });
      setForm(null);
      load();
    } catch (err) {
      setFormError(errText(err));
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(it, status) {
    try {
      await api(`/api/admin/career-pay/${it.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      load();
    } catch (e) {
      setError(errText(e));
    }
  }
  async function remove(it) {
    if (!window.confirm(`Delete this pay item (${it.jobTitle})?`)) return;
    try {
      await api(`/api/admin/career-pay/${it.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(errText(e));
    }
  }

  return (
    <PanelFrame
      icon={Wallet}
      title="Pay"
      actions={
        <>
          <a href={`/api/admin/career-pay/export?month=${month}`} className={btnGhost} download>
            <Download size={14} /> Excel — approved
          </a>
          <a href={`/api/admin/career-pay/export?month=${month}&status=all`} className={btnGhost} download>
            <Download size={14} /> Excel — all
          </a>
          <button type="button" onClick={() => { setFormError(""); setForm({ ...EMPTY }); }} className={btnPrimary}>
            <Plus size={16} /> Add pay item
          </button>
        </>
      }
    >
      <div className="flex flex-wrap items-end gap-4">
        <Field label="Month">
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputCls} />
        </Field>
        {Object.entries(totals).map(([cur, t]) => (
          <div key={cur} className="rounded-lg bg-gray-50 px-4 py-2 text-sm">
            <span className="font-semibold text-emerald-700" dir="ltr">{money(t.approved)} {cur}</span> approved ·{" "}
            <span className="font-semibold text-amber-700" dir="ltr">{money(t.pending)} {cur}</span> pending
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500">
        The Excel sheet is compiled from the database at download time — it has a Details sheet and a per-person Summary sheet for the selected month.
      </p>

      <ErrorBox message={error} />
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-gray-500">No pay items in this month.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pe-3">Freelancer</th>
                <th className="pe-3">Job</th>
                <th className="pe-3">Compensation</th>
                <th className="pe-3">Reimb.</th>
                <th className="pe-3">Total</th>
                <th className="pe-3">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b align-top">
                  <td className="py-3 pe-3 font-semibold text-gray-800">
                    {it.name}
                    <div className="text-xs font-normal text-gray-500" dir="ltr">{it.email}</div>
                  </td>
                  <td className="pe-3">{it.jobTitle}</td>
                  <td className="pe-3" dir="ltr">{money(it.compensation)}</td>
                  <td className="pe-3" dir="ltr">{money(it.reimbursement)}</td>
                  <td className="pe-3 font-semibold" dir="ltr">{money(it.total)} {it.currency}</td>
                  <td className="pe-3"><Badge tone={TONE[it.status]}>{it.status.replace("_", " ")}</Badge></td>
                  <td className="space-x-1 whitespace-nowrap py-2 text-right">
                    {it.status !== "pay_approved" && <button type="button" onClick={() => setStatus(it, "pay_approved")} className={btnGhost}>Approve</button>}
                    {it.status !== "rejected" && <button type="button" onClick={() => setStatus(it, "rejected")} className={btnGhost}>Reject</button>}
                    {it.status !== "pending_review" && <button type="button" onClick={() => setStatus(it, "pending_review")} className={btnGhost}>Reset</button>}
                    <button type="button" onClick={() => remove(it)} className={btnDanger}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal title={`Add pay item — ${month}`} onClose={() => setForm(null)}>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Freelancer email *" className="sm:col-span-2">
              <input required type="email" value={form.email} onChange={set("email")} className={inputCls} dir="ltr" />
            </Field>
            <Field label="Job title *" className="sm:col-span-2">
              <input required maxLength={200} value={form.jobTitle} onChange={set("jobTitle")} className={inputCls} />
            </Field>
            <Field label="Compensation *">
              <input required type="number" min="0" step="0.01" value={form.compensation} onChange={set("compensation")} className={inputCls} />
            </Field>
            <Field label="Reimbursement">
              <input type="number" min="0" step="0.01" value={form.reimbursement} onChange={set("reimbursement")} className={inputCls} />
            </Field>
            <Field label="Currency">
              <input maxLength={3} value={form.currency} onChange={set("currency")} className={inputCls} />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={set("status")} className={inputCls}>
                <option value="pending_review">Pending review</option>
                <option value="pay_approved">Pay approved</option>
              </select>
            </Field>
            <Field label="Note" className="sm:col-span-2">
              <input maxLength={500} value={form.note} onChange={set("note")} className={inputCls} />
            </Field>
            <div className="sm:col-span-2"><ErrorBox message={formError} /></div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setForm(null)} className={btnGhost}>Cancel</button>
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </Modal>
      )}
    </PanelFrame>
  );
}
