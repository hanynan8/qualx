"use client";

// تسجيل ومراجعة الزيارات (مجدولة / مكتملة بتقييم المعايير الأربعة / ملغية).

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, ClipboardList } from "lucide-react";
import { api, useApi, useMs, errMsg, localDay, formatDay } from "../client";
import { Loading, ErrorBox, Empty, Modal, Field, Btn, IconBtn, Chip, inputCls } from "../components/ui";

const CRITERIA = ["service", "cleanliness", "speed", "staff"];
const STATUS_TONE = { completed: "green", scheduled: "sky", cancelled: "gray" };
const LIMIT = 15;

export default function VisitsView() {
  const { t, language, branches, branchName, notify, go } = useMs();
  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null); // null | {} (جديد) | visit (تعديل)

  useEffect(() => {
    const id = setTimeout(() => {
      setQApplied(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const { data, error, loading, reload } = useApi("visits", { status, branchId, q: qApplied, page, limit: LIMIT });
  const items = data?.items || [];
  const total = data?.total || 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));

  // لو مسحنا آخر عنصر في صفحة، نرجع صفحة.
  useEffect(() => {
    if (data && !data.items.length && page > 1) setPage(page - 1);
  }, [data, page]);

  async function remove(v) {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await api(`visits/${v.id}`, { method: "DELETE" });
      notify(t.deleted);
      reload();
    } catch (e) {
      notify(errMsg(t, e), "error");
    }
  }

  const filtered = Boolean(status || branchId || qApplied);

  if (!data && error) return <ErrorBox message={errMsg(t, error)} onRetry={reload} retryLabel={t.c.retry} />;
  if (!data) return <Loading text={t.c.loading} />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input className={`${inputCls} ps-9`} placeholder={t.visits.search} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${inputCls} !w-auto`} value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))}>
          <option value="">{t.visits.allStatuses}</option>
          {Object.keys(t.visits.statuses).map((s) => (
            <option key={s} value={s}>
              {t.visits.statuses[s]}
            </option>
          ))}
        </select>
        <select className={`${inputCls} !w-auto`} value={branchId} onChange={(e) => (setBranchId(e.target.value), setPage(1))}>
          <option value="">{t.visits.allBranches}</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <Btn onClick={() => setForm({})} disabled={branches.length === 0}>
          <Plus size={16} />
          {t.visits.add}
        </Btn>
      </div>

      {branches.length === 0 ? (
        <Empty icon={ClipboardList} text={t.visits.needBranch}>
          <Btn onClick={() => go("branches")}>{t.branches.add}</Btn>
        </Empty>
      ) : items.length === 0 ? (
        <Empty icon={ClipboardList} text={filtered ? t.visits.none : t.visits.noneAtAll}>
          {!filtered && (
            <Btn onClick={() => setForm({})}>
              <Plus size={16} />
              {t.visits.add}
            </Btn>
          )}
        </Empty>
      ) : (
        <div className={`overflow-x-auto rounded-2xl bg-white shadow-sm ${loading ? "opacity-60" : ""}`}>
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 text-xs text-charcoal/60">
                <th className="px-4 py-3 text-start font-semibold">{t.visits.date}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.visits.branch}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.visits.evaluator}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.visits.status}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.visits.rating}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.visits.notes}</th>
                <th className="w-24 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id} className="border-b border-charcoal/5 align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-charcoal/80">{formatDay(v.date, language)}</td>
                  <td className="px-4 py-3 font-semibold text-navy">{branchName(v.branchId)}</td>
                  <td className="px-4 py-3 text-charcoal/70">{v.evaluator || "—"}</td>
                  <td className="px-4 py-3">
                    <Chip tone={STATUS_TONE[v.status]}>{t.visits.statuses[v.status]}</Chip>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-charcoal/80">
                    {v.rating != null ? (
                      <>
                        <span className="font-semibold text-navy">{v.rating.toFixed(1)}</span>/5 · {Math.round((v.rating / 5) * 100)}%
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-charcoal/60" title={v.notes}>
                    {v.notes || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <IconBtn label={t.c.edit} onClick={() => setForm(v)}>
                        <Pencil size={16} />
                      </IconBtn>
                      <IconBtn label={t.c.delete} danger onClick={() => remove(v)}>
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

      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-charcoal/60">
          <span>{t.c.total(total)}</span>
          <div className="flex items-center gap-2">
            <Btn variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              {t.c.prev}
            </Btn>
            <span>{t.c.page(page, pages)}</span>
            <Btn variant="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>
              {t.c.next}
            </Btn>
          </div>
        </div>
      )}

      {form && (
        <VisitForm
          visit={form.id ? form : null}
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

function VisitForm({ visit, onClose, onSaved }) {
  const { t, branches, notify } = useMs();
  const choices = branches.filter((b) => b.status === "active" || b.id === visit?.branchId);
  const [f, setF] = useState(() => ({
    branchId: visit?.branchId || choices[0]?.id || "",
    date: visit?.date || localDay(),
    status: visit?.status || "completed",
    evaluator: visit?.evaluator || "",
    notes: visit?.notes || "",
    scores: Object.fromEntries(CRITERIA.map((c) => [c, visit?.scores?.[c] || 0])),
  }));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const completed = f.status === "completed";

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!f.branchId) return setErr(t.errors.branch_required);
    if (!f.date) return setErr(t.errors.date_invalid);
    if (completed && CRITERIA.some((c) => !f.scores[c])) return setErr(t.errors.scores_invalid);
    setBusy(true);
    try {
      const body = { ...f };
      if (!completed) delete body.scores;
      await api(visit ? `visits/${visit.id}` : "visits", { method: visit ? "PUT" : "POST", body });
      notify(t.saved);
      onSaved();
    } catch (e2) {
      setErr(errMsg(t, e2));
      setBusy(false);
    }
  }

  return (
    <Modal title={visit ? t.visits.editTitle : t.visits.addTitle} onClose={onClose} closeLabel={t.c.close}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.visits.branch}>
            <select className={inputCls} value={f.branchId} onChange={(e) => set("branchId", e.target.value)}>
              {choices.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.visits.date}>
            <input type="date" className={inputCls} value={f.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
          <Field label={t.visits.status}>
            <select className={inputCls} value={f.status} onChange={(e) => set("status", e.target.value)}>
              {Object.keys(t.visits.statuses).map((s) => (
                <option key={s} value={s}>
                  {t.visits.statuses[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.visits.evaluator}>
            <input className={inputCls} value={f.evaluator} maxLength={80} onChange={(e) => set("evaluator", e.target.value)} />
          </Field>
        </div>

        {completed && (
          <div className="rounded-xl bg-offwhite p-3">
            <div className="mb-2 text-xs font-semibold text-charcoal/70">{t.visits.scores}</div>
            <div className="space-y-2">
              {CRITERIA.map((c) => (
                <div key={c} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-charcoal/80">{t.criteria[c]}</span>
                  <div className="flex gap-1" role="radiogroup" aria-label={t.criteria[c]}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={f.scores[c] === n}
                        onClick={() => set("scores", { ...f.scores, [c]: n })}
                        className={`h-8 w-8 rounded-lg text-sm font-semibold transition-colors ${
                          f.scores[c] === n ? "bg-sky text-white" : "bg-white text-charcoal/70 hover:bg-sky/15"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Field label={t.visits.notes}>
          <textarea className={inputCls} rows={3} maxLength={2000} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
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
