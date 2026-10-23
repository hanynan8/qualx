"use client";

// متابعة الملاحظات (عدم المطابقة): جاية تلقائيًا من البنود الفاشلة في زيارات التدقيق، أو بتتضاف يدويًا.
// تغيير الحالة سريع من الكارت، والتعديل (المسؤول / المهلة / الحل) من المودال.
// الملاحظة الجاية من زيارة: عنوانها ومجالها وخطورتها بتتعدّل من الزيارة نفسها.

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, ShieldAlert, ClipboardCheck } from "lucide-react";
import { api, useApi, useAu, errMsg, localDay, formatDay, severityStyle, AREAS, SEVERITIES } from "../client";
import { Loading, ErrorBox, Empty, Modal, Field, Btn, IconBtn, Chip, inputCls } from "../../_shared/ui";

const STATUSES = ["open", "in_progress", "closed"];
const LIMIT = 20;

// الجسم الكامل للـ PUT: السيرفر بيمسح أي نص ما اتبعتش، فلازم نبعت كل الحقول الحالية.
const putBody = (f, over = {}) => ({
  title: f.title,
  area: f.area,
  severity: f.severity,
  branchId: f.branchId || "",
  note: f.note,
  assignee: f.assignee,
  resolution: f.resolution,
  dueDate: f.dueDate || "",
  status: f.status,
  ...over,
});

export default function FindingsView() {
  const { t, language, branches, branchName, notify, reloadBranches } = useAu();
  const [status, setStatus] = useState("");
  const [severity, setSeverity] = useState("");
  const [area, setArea] = useState("");
  const [branchId, setBranchId] = useState("");
  const [overdue, setOverdue] = useState(false);
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null); // null | {} (جديدة) | finding (تعديل)
  const today = localDay();

  useEffect(() => {
    const id = setTimeout(() => {
      setQApplied(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const { data, error, loading, reload } = useApi("findings", {
    status,
    severity,
    area,
    branchId,
    overdue: overdue ? 1 : "",
    q: qApplied,
    today,
    page,
    limit: LIMIT,
  });
  const items = data?.items || [];
  const total = data?.total || 0;
  const counts = data?.counts || { open: 0, in_progress: 0, closed: 0, overdue: 0 };
  const pages = Math.max(1, Math.ceil(total / LIMIT));

  useEffect(() => {
    if (data && !data.items.length && page > 1) setPage(page - 1);
  }, [data, page]);

  const refresh = () => {
    reload();
    reloadBranches();
  };

  async function changeStatus(f, next) {
    try {
      await api(`findings/${f.id}`, { method: "PUT", body: putBody(f, { status: next }) });
      refresh();
    } catch (e) {
      notify(errMsg(t, e), "error");
    }
  }

  async function remove(f) {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await api(`findings/${f.id}`, { method: "DELETE" });
      notify(t.deleted);
      refresh();
    } catch (e) {
      notify(errMsg(t, e), "error");
    }
  }

  const filtered = Boolean(status || severity || area || branchId || overdue || qApplied);

  if (!data && error) return <ErrorBox message={errMsg(t, error)} onRetry={reload} retryLabel={t.c.retry} />;
  if (!data) return <Loading text={t.c.loading} />;

  const reset = (fn) => (e) => (fn(e.target.value), setPage(1));
  const allCount = counts.open + counts.in_progress + counts.closed;
  const tabs = [
    { key: "", label: t.c.all, count: allCount },
    ...STATUSES.map((s) => ({ key: s, label: t.findings.statuses[s], count: counts[s] })),
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.key || "all"}
              type="button"
              onClick={() => (setStatus(tab.key), setPage(1))}
              aria-pressed={status === tab.key}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                status === tab.key ? "bg-navy text-white" : "bg-white text-charcoal/70 hover:bg-sky/10"
              }`}
            >
              {tab.label} <span className="opacity-70">({tab.count})</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => (setOverdue((v) => !v), setPage(1))}
            aria-pressed={overdue}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              overdue ? "bg-red-600 text-white" : "bg-white text-red-600 hover:bg-red-50"
            }`}
          >
            {t.findings.overdueOnly} <span className="opacity-80">({counts.overdue})</span>
          </button>
        </div>
        <Btn onClick={() => setForm({})}>
          <Plus size={16} />
          {t.findings.add}
        </Btn>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input className={`${inputCls} ps-9`} placeholder={t.findings.search} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${inputCls} !w-auto`} value={severity} onChange={reset(setSeverity)} aria-label={t.findings.severity}>
          <option value="">{t.findings.allSeverities}</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {t.severities[s]}
            </option>
          ))}
        </select>
        <select className={`${inputCls} !w-auto`} value={area} onChange={reset(setArea)} aria-label={t.findings.area}>
          <option value="">{t.findings.allAreas}</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {t.areas[a]}
            </option>
          ))}
        </select>
        <select className={`${inputCls} !w-auto`} value={branchId} onChange={reset(setBranchId)} aria-label={t.findings.branch}>
          <option value="">{t.findings.allBranches}</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {items.length === 0 ? (
        <Empty icon={ShieldAlert} text={t.findings.none}>
          {!filtered && (
            <Btn onClick={() => setForm({})}>
              <Plus size={16} />
              {t.findings.add}
            </Btn>
          )}
        </Empty>
      ) : (
        <ul className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
          {items.map((f) => {
            const closed = f.status === "closed";
            const late = !closed && f.dueDate && f.dueDate < today;
            const fromAudit = f.source === "audit";
            return (
              <li key={f.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold text-navy ${closed ? "line-through opacity-60" : ""}`}>{f.title}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Chip tone={severityStyle[f.severity].tone}>{t.severities[f.severity]}</Chip>
                    <Chip tone="gray">{t.areas[f.area] || f.area}</Chip>
                    <Chip tone={fromAudit ? "sky" : "gold"}>
                      {fromAudit && <ClipboardCheck size={12} className="me-1" />}
                      {fromAudit ? t.findings.fromAudit : t.findings.manual}
                    </Chip>
                    {late && <Chip tone="red">{t.findings.overdue}</Chip>}
                  </div>
                  {f.note && <p className="mt-2 text-sm text-charcoal/70">{f.note}</p>}
                  {f.resolution && (
                    <p className="mt-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800">
                      <span className="font-semibold">{t.findings.resolution}: </span>
                      {f.resolution}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-charcoal/60">
                    {f.branchId && <span className="font-semibold text-navy/80">{branchName(f.branchId)}</span>}
                    {f.assignee && (
                      <span>
                        {t.findings.assignee}: {f.assignee}
                      </span>
                    )}
                    <span>{t.findings.opened_(formatDay(f.openedAt, language))}</span>
                    {f.dueDate && <span className={late ? "font-semibold text-red-600" : ""}>{t.findings.due_(formatDay(f.dueDate, language))}</span>}
                    {f.closedAt && <span>{t.findings.closed_(formatDay(f.closedAt, language))}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <select
                    className="rounded-lg border border-charcoal/15 bg-white px-2 py-1.5 text-sm text-charcoal"
                    value={f.status}
                    aria-label={t.findings.status}
                    onChange={(e) => changeStatus(f, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t.findings.statuses[s]}
                      </option>
                    ))}
                  </select>
                  <IconBtn label={t.c.edit} onClick={() => setForm(f)}>
                    <Pencil size={16} />
                  </IconBtn>
                  {!fromAudit && (
                    <IconBtn label={t.c.delete} danger onClick={() => remove(f)}>
                      <Trash2 size={16} />
                    </IconBtn>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
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
        <FindingForm
          finding={form.id ? form : null}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function FindingForm({ finding, onClose, onSaved }) {
  const { t, branches, notify } = useAu();
  const locked = finding?.source === "audit";
  const [f, setF] = useState({
    title: finding?.title || "",
    area: finding?.area || AREAS[0],
    severity: finding?.severity || "major",
    branchId: finding?.branchId || "",
    status: finding?.status || "open",
    assignee: finding?.assignee || "",
    dueDate: finding?.dueDate || "",
    resolution: finding?.resolution || "",
    note: finding?.note || "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!locked && !f.title.trim()) return setErr(t.errors.title_required);
    setBusy(true);
    try {
      await api(finding ? `findings/${finding.id}` : "findings", { method: finding ? "PUT" : "POST", body: f });
      notify(t.saved);
      onSaved();
    } catch (e2) {
      setErr(errMsg(t, e2));
      setBusy(false);
    }
  }

  return (
    <Modal title={finding ? t.findings.editTitle : t.findings.addTitle} onClose={onClose} closeLabel={t.c.close}>
      <form onSubmit={submit} className="space-y-4">
        {locked ? (
          <div className="rounded-xl bg-offwhite px-4 py-3">
            <div className="font-semibold text-navy">{finding.title}</div>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Chip tone={severityStyle[finding.severity].tone}>{t.severities[finding.severity]}</Chip>
              <Chip tone="gray">{t.areas[finding.area] || finding.area}</Chip>
            </div>
            {finding.note && <p className="mt-2 text-sm text-charcoal/70">{finding.note}</p>}
            <p className="mt-2 text-xs text-charcoal/55">{t.findings.lockedHint}</p>
          </div>
        ) : (
          <>
            <Field label={t.findings.title}>
              <input className={inputCls} value={f.title} maxLength={160} autoFocus onChange={(e) => set("title", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.findings.area}>
                <select className={inputCls} value={f.area} onChange={(e) => set("area", e.target.value)}>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {t.areas[a]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t.findings.severity}>
                <select className={inputCls} value={f.severity} onChange={(e) => set("severity", e.target.value)}>
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {t.severities[s]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label={t.findings.branch}>
              <select className={inputCls} value={f.branchId} onChange={(e) => set("branchId", e.target.value)}>
                <option value="">{t.findings.noBranch}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.findings.note}>
              <textarea className={inputCls} rows={3} maxLength={1000} value={f.note} onChange={(e) => set("note", e.target.value)} />
            </Field>
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.findings.status}>
            <select className={inputCls} value={f.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t.findings.statuses[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.findings.due}>
            <input type="date" className={inputCls} value={f.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </Field>
        </div>
        <Field label={t.findings.assignee}>
          <input className={inputCls} value={f.assignee} maxLength={80} onChange={(e) => set("assignee", e.target.value)} />
        </Field>
        <Field label={t.findings.resolution}>
          <textarea className={inputCls} rows={3} maxLength={1000} value={f.resolution} onChange={(e) => set("resolution", e.target.value)} />
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
