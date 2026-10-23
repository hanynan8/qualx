"use client";

// الإجراءات التصحيحية: تتبّع من "مفتوح" لحد "تم".

import { useState } from "react";
import { Plus, Pencil, Trash2, ListChecks } from "lucide-react";
import { api, useApi, useMs, errMsg, localDay, formatDay } from "../client";
import { Loading, ErrorBox, Empty, Modal, Field, Btn, IconBtn, Chip, inputCls } from "../components/ui";

const PRIORITY_TONE = { high: "red", medium: "amber", low: "gray" };
const FILTERS = ["", "open", "in_progress", "done"];

export default function ActionsView() {
  const { t, language, branchName, notify } = useMs();
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState(null);
  const { data, error, loading, reload } = useApi("actions", { status: filter });
  const today = localDay();

  async function changeStatus(a, status) {
    try {
      await api(`actions/${a.id}`, {
        method: "PUT",
        body: { title: a.title, description: a.description, priority: a.priority, status, dueDate: a.dueDate, branchId: a.branchId },
      });
      reload();
    } catch (e) {
      notify(errMsg(t, e), "error");
    }
  }

  async function remove(a) {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await api(`actions/${a.id}`, { method: "DELETE" });
      notify(t.deleted);
      reload();
    } catch (e) {
      notify(errMsg(t, e), "error");
    }
  }

  if (!data && error) return <ErrorBox message={errMsg(t, error)} onRetry={reload} retryLabel={t.c.retry} />;
  if (!data) return <Loading text={t.c.loading} />;
  const items = data.items;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((s) => (
            <button
              key={s || "all"}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filter === s ? "bg-navy text-white" : "bg-white text-charcoal/70 hover:bg-sky/10"
              }`}
            >
              {s ? t.actions.statuses[s] : t.c.all}
            </button>
          ))}
        </div>
        <Btn onClick={() => setForm({})}>
          <Plus size={16} />
          {t.actions.add}
        </Btn>
      </div>

      {items.length === 0 ? (
        <Empty icon={ListChecks} text={t.actions.none}>
          <Btn onClick={() => setForm({})}>
            <Plus size={16} />
            {t.actions.add}
          </Btn>
        </Empty>
      ) : (
        <ul className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
          {items.map((a) => {
            const overdue = a.dueDate && a.status !== "done" && a.dueDate < today;
            return (
              <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold text-navy ${a.status === "done" ? "line-through opacity-60" : ""}`}>{a.title}</div>
                  {a.description && <p className="mt-0.5 text-sm text-charcoal/65">{a.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-charcoal/60">
                    <Chip tone={PRIORITY_TONE[a.priority]}>{t.actions.priorities[a.priority]}</Chip>
                    {a.branchId && <span>{branchName(a.branchId)}</span>}
                    {a.dueDate && (
                      <span className={overdue ? "font-semibold text-red-600" : ""}>
                        {t.actions.due_(formatDay(a.dueDate, language))}
                        {overdue && ` · ${t.overdueTag}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <select
                    className="rounded-lg border border-charcoal/15 bg-white px-2 py-1.5 text-sm text-charcoal"
                    value={a.status}
                    aria-label={t.actions.status}
                    onChange={(e) => changeStatus(a, e.target.value)}
                  >
                    {Object.keys(t.actions.statuses).map((s) => (
                      <option key={s} value={s}>
                        {t.actions.statuses[s]}
                      </option>
                    ))}
                  </select>
                  <IconBtn label={t.c.edit} onClick={() => setForm(a)}>
                    <Pencil size={16} />
                  </IconBtn>
                  <IconBtn label={t.c.delete} danger onClick={() => remove(a)}>
                    <Trash2 size={16} />
                  </IconBtn>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {form && (
        <ActionForm
          action={form.id ? form : null}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            reload();
          }}
        />
      )}
    </div>
  );
}

function ActionForm({ action, onClose, onSaved }) {
  const { t, branches, notify } = useMs();
  const [f, setF] = useState({
    title: action?.title || "",
    description: action?.description || "",
    priority: action?.priority || "medium",
    status: action?.status || "open",
    dueDate: action?.dueDate || "",
    branchId: action?.branchId || "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!f.title.trim()) return setErr(t.errors.title_required);
    setBusy(true);
    try {
      await api(action ? `actions/${action.id}` : "actions", { method: action ? "PUT" : "POST", body: f });
      notify(t.saved);
      onSaved();
    } catch (e2) {
      setErr(errMsg(t, e2));
      setBusy(false);
    }
  }

  return (
    <Modal title={action ? t.actions.editTitle : t.actions.addTitle} onClose={onClose} closeLabel={t.c.close}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={t.actions.title}>
          <input className={inputCls} value={f.title} maxLength={120} autoFocus onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label={t.actions.description}>
          <textarea className={inputCls} rows={3} maxLength={1000} value={f.description} onChange={(e) => set("description", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.actions.priority}>
            <select className={inputCls} value={f.priority} onChange={(e) => set("priority", e.target.value)}>
              {Object.keys(t.actions.priorities).map((p) => (
                <option key={p} value={p}>
                  {t.actions.priorities[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.actions.status}>
            <select className={inputCls} value={f.status} onChange={(e) => set("status", e.target.value)}>
              {Object.keys(t.actions.statuses).map((s) => (
                <option key={s} value={s}>
                  {t.actions.statuses[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.actions.due}>
            <input type="date" className={inputCls} value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </Field>
          <Field label={t.actions.branch}>
            <select className={inputCls} value={f.branchId} onChange={(e) => set("branchId", e.target.value)}>
              <option value="">{t.actions.noBranch}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
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
