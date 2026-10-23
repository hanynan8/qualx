"use client";

// إدارة الفروع. القايمة بتيجي من الـ context (مشتركة مع الزيارات والإجراءات).

import { useState } from "react";
import { Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { api, useMs, errMsg } from "../client";
import { Loading, ErrorBox, Empty, Modal, Field, Btn, IconBtn, Chip, inputCls } from "../components/ui";

export default function BranchesView() {
  const { t, branches, branchesLoading, branchesError, reloadBranches, notify } = useMs();
  const [form, setForm] = useState(null); // null | {} (جديد) | branch (تعديل)

  async function remove(b) {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await api(`branches/${b.id}`, { method: "DELETE" });
    } catch (e) {
      if (e.code === "branch_has_visits") {
        if (!window.confirm(t.branches.deleteWithVisits(e.extra?.visits ?? b.visits))) return;
        try {
          await api(`branches/${b.id}`, { method: "DELETE", query: { cascade: 1 } });
        } catch (e2) {
          return notify(errMsg(t, e2), "error");
        }
      } else {
        return notify(errMsg(t, e), "error");
      }
    }
    notify(t.deleted);
    reloadBranches();
  }

  if (branchesLoading && !branches.length) return <Loading text={t.c.loading} />;
  if (branchesError && !branches.length) return <ErrorBox message={errMsg(t, branchesError)} onRetry={reloadBranches} retryLabel={t.c.retry} />;

  return (
    <div>
      <div className="mb-4 flex justify-end">
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
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 text-start text-xs text-charcoal/60">
                <th className="px-4 py-3 text-start font-semibold">{t.branches.name}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.branches.city}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.branches.status}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.branches.visits}</th>
                <th className="w-24 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className="border-b border-charcoal/5 last:border-0">
                  <td className="px-4 py-3 font-semibold text-navy">{b.name}</td>
                  <td className="px-4 py-3 text-charcoal/70">{b.city || "—"}</td>
                  <td className="px-4 py-3">
                    <Chip tone={b.status === "active" ? "green" : "gray"}>{t.branches.statuses[b.status]}</Chip>
                  </td>
                  <td className="px-4 py-3 text-charcoal/70">{b.visits}</td>
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
              ))}
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
  const { t, notify } = useMs();
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
