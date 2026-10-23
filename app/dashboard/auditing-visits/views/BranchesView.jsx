"use client";

// إدارة الفروع. القايمة (بإحصائياتها: آخر زيارة ونتيجتها والملاحظات المفتوحة) جاية من الـ context
// ومشتركة مع الزيارات والملاحظات. الحذف: لو الفرع عليه زيارات بيطلب تأكيد حذف كامل (cascade).

import { useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Search, Download } from "lucide-react";
import { api, useAu, errMsg, formatDay, levelStyle } from "../client";
import { Loading, ErrorBox, Empty, Modal, Field, Btn, IconBtn, Chip, inputCls } from "../../_shared/ui";

const levelOf = (score, s) => (score == null ? null : score >= s.compliantFrom ? "compliant" : score >= s.partialFrom ? "partial" : "non_compliant");

export default function BranchesView() {
  const { t, language, branches, branchesLoading, branchesError, reloadBranches, notify, settings } = useAu();
  const [form, setForm] = useState(null); // null | {} (جديد) | branch (تعديل)
  const [q, setQ] = useState("");
  const [importing, setImporting] = useState(false);
  const S = settings || { compliantFrom: 90, partialFrom: 75 };

  async function remove(b) {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await api(`branches/${b.id}`, { method: "DELETE" });
    } catch (e) {
      if (e.code !== "branch_has_visits") return notify(errMsg(t, e), "error");
      if (!window.confirm(t.branches.deleteWithVisits(e.extra?.visits ?? b.visits))) return;
      try {
        await api(`branches/${b.id}`, { method: "DELETE", query: { cascade: 1 } });
      } catch (e2) {
        return notify(errMsg(t, e2), "error");
      }
    }
    notify(t.deleted);
    reloadBranches();
  }

  async function importFromMystery() {
    setImporting(true);
    try {
      const r = await api("branches/import", { method: "POST" });
      notify(t.branches.imported(r.imported || 0));
      if (r.imported) reloadBranches();
    } catch (e) {
      notify(errMsg(t, e), "error");
    }
    setImporting(false);
  }

  if (branchesLoading && !branches.length) return <Loading text={t.c.loading} />;
  if (branchesError && !branches.length) return <ErrorBox message={errMsg(t, branchesError)} onRetry={reloadBranches} retryLabel={t.c.retry} />;

  const needle = q.trim().toLowerCase();
  const list = needle ? branches.filter((b) => `${b.name} ${b.city}`.toLowerCase().includes(needle)) : branches;

  const importBtn = (
    <Btn variant="secondary" onClick={importFromMystery} disabled={importing}>
      <Download size={16} />
      {t.branches.importMs}
    </Btn>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input className={`${inputCls} ps-9`} placeholder={t.branches.search} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {importBtn}
        <Btn onClick={() => setForm({})}>
          <Plus size={16} />
          {t.branches.add}
        </Btn>
      </div>

      {branches.length === 0 ? (
        <Empty icon={MapPin} text={t.branches.none}>
          <Btn onClick={() => setForm({})}>
            <Plus size={16} />
            {t.branches.add}
          </Btn>
          {importBtn}
        </Empty>
      ) : list.length === 0 ? (
        <Empty icon={MapPin} text={t.branches.noMatch} />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 text-xs text-charcoal/60">
                <th className="px-4 py-3 text-start font-semibold">{t.branches.name}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.branches.city}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.branches.status}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.branches.visits}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.branches.lastAudit}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.branches.lastScore}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.branches.openFindings}</th>
                <th className="w-24 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((b) => {
                const lv = levelOf(b.lastScore, S);
                return (
                  <tr key={b.id} className="border-b border-charcoal/5 last:border-0">
                    <td className="px-4 py-3 font-semibold text-navy">{b.name}</td>
                    <td className="px-4 py-3 text-charcoal/70">{b.city || "—"}</td>
                    <td className="px-4 py-3">
                      <Chip tone={b.status === "active" ? "green" : "gray"}>{t.branches.statuses[b.status]}</Chip>
                    </td>
                    <td className="px-4 py-3 text-charcoal/70">{b.visits}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-charcoal/70">{b.lastAudit ? formatDay(b.lastAudit, language) : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {b.lastScore != null ? <Chip tone={levelStyle[lv].tone}>{Math.round(b.lastScore)}%</Chip> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {b.openFindings > 0 ? <Chip tone="red">{b.openFindings}</Chip> : <span className="text-charcoal/50">0</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <IconBtn label={t.c.edit} onClick={() => setForm(b)}>
                          <Pencil size={16} />
                        </IconBtn>
                        <IconBtn label={t.c.delete} danger onClick={() => remove(b)}>
                          <Trash2 size={16} />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <BranchForm
          branch={form.id ? form : null}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            reloadBranches();
          }}
        />
      )}
    </div>
  );
}

function BranchForm({ branch, onClose, onSaved }) {
  const { t, notify } = useAu();
  const [f, setF] = useState({ name: branch?.name || "", city: branch?.city || "", status: branch?.status || "active" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!f.name.trim()) return setErr(t.errors.name_required);
    setBusy(true);
    try {
      await api(branch ? `branches/${branch.id}` : "branches", { method: branch ? "PUT" : "POST", body: f });
      notify(t.saved);
      onSaved();
    } catch (e2) {
      setErr(errMsg(t, e2));
      setBusy(false);
    }
  }

  return (
    <Modal title={branch ? t.branches.editTitle : t.branches.addTitle} onClose={onClose} closeLabel={t.c.close}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t.branches.name}>
          <input className={inputCls} value={f.name} maxLength={80} autoFocus onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label={t.branches.city}>
          <input className={inputCls} value={f.city} maxLength={80} onChange={(e) => setF({ ...f, city: e.target.value })} />
        </Field>
        <Field label={t.branches.status}>
          <select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="active">{t.branches.statuses.active}</option>
            <option value="inactive">{t.branches.statuses.inactive}</option>
          </select>
        </Field>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Btn variant="secondary" onClick={onClose}>
            {t.c.cancel}
          </Btn>
          <Btn type="submit" disabled={busy}>
            {busy ? t.c.saving : t.c.save}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
