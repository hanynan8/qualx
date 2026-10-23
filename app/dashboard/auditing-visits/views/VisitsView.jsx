"use client";

// تسجيل ومراجعة زيارات التدقيق: مجدولة / مكتملة بقايمة فحص (مطابق / غير مطابق / لا ينطبق لكل بند) / ملغية.
// كل بند غير مطابق بيتحوّل تلقائيًا لملاحظة (Finding) في صفحة الملاحظات.

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, ClipboardList, Eye, Check, X, Minus, CheckCheck } from "lucide-react";
import { api, useApi, useAu, errMsg, localDay, formatDay, levelStyle, severityStyle, AREAS, SEVERITIES } from "../client";
import { Loading, ErrorBox, Empty, Modal, Field, Btn, IconBtn, Chip, inputCls } from "../../_shared/ui";
import { checklistFor } from "../checklist";

const STATUS_TONE = { completed: "green", scheduled: "sky", cancelled: "gray" };
const LIMIT = 15;

const levelOf = (score, s) => (score == null ? null : score >= s.compliantFrom ? "compliant" : score >= s.partialFrom ? "partial" : "non_compliant");
const scoreOf = (results) => {
  const p = results.filter((r) => r.result === "pass").length;
  const f = results.filter((r) => r.result === "fail").length;
  return p + f ? Math.round((p / (p + f)) * 100) : null;
};

export default function VisitsView() {
  const { t, language, branches, branchName, notify, go, reloadBranches, settings } = useAu();
  const [status, setStatus] = useState("");
  const [branchId, setBranchId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null); // null | {} (جديد) | visit (تعديل)
  const [details, setDetails] = useState(null);
  const S = settings || { compliantFrom: 90, partialFrom: 75 };

  useEffect(() => {
    const id = setTimeout(() => {
      setQApplied(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [q]);

  const { data, error, loading, reload } = useApi("visits", { status, branchId, from, to, q: qApplied, page, limit: LIMIT });
  const items = data?.items || [];
  const total = data?.total || 0;
  const pages = Math.max(1, Math.ceil(total / LIMIT));

  useEffect(() => {
    if (data && !data.items.length && page > 1) setPage(page - 1);
  }, [data, page]);

  async function remove(v) {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await api(`visits/${v.id}`, { method: "DELETE" });
      notify(t.deleted);
      reload();
      reloadBranches();
    } catch (e) {
      notify(errMsg(t, e), "error");
    }
  }

  const filtered = Boolean(status || branchId || from || to || qApplied);

  if (!data && error) return <ErrorBox message={errMsg(t, error)} onRetry={reload} retryLabel={t.c.retry} />;
  if (!data) return <Loading text={t.c.loading} />;

  const reset = (fn) => (e) => (fn(e.target.value), setPage(1));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-charcoal/40" />
          <input className={`${inputCls} ps-9`} placeholder={t.visits.search} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${inputCls} !w-auto`} value={status} onChange={reset(setStatus)}>
          <option value="">{t.visits.allStatuses}</option>
          {Object.keys(t.visits.statuses).map((s) => (
            <option key={s} value={s}>
              {t.visits.statuses[s]}
            </option>
          ))}
        </select>
        <select className={`${inputCls} !w-auto`} value={branchId} onChange={reset(setBranchId)}>
          <option value="">{t.visits.allBranches}</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input type="date" aria-label={t.visits.fromDate} title={t.visits.fromDate} className={`${inputCls} !w-auto`} value={from} max={to || undefined} onChange={reset(setFrom)} />
        <input type="date" aria-label={t.visits.toDate} title={t.visits.toDate} className={`${inputCls} !w-auto`} value={to} min={from || undefined} onChange={reset(setTo)} />
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
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-charcoal/10 text-xs text-charcoal/60">
                <th className="px-4 py-3 text-start font-semibold">{t.visits.date}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.visits.branch}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.visits.auditor}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.visits.status}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.visits.compliance}</th>
                <th className="px-4 py-3 text-start font-semibold">{t.analytics.fails}</th>
                <th className="w-32 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((v) => {
                const lv = levelOf(v.compliance, S);
                return (
                  <tr key={v.id} className="border-b border-charcoal/5 align-top last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-charcoal/80">{formatDay(v.date, language)}</td>
                    <td className="px-4 py-3 font-semibold text-navy">{branchName(v.branchId)}</td>
                    <td className="px-4 py-3 text-charcoal/70">{v.auditor || "—"}</td>
                    <td className="px-4 py-3">
                      <Chip tone={STATUS_TONE[v.status]}>{t.visits.statuses[v.status]}</Chip>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{v.compliance != null ? <Chip tone={levelStyle[lv].tone}>{Math.round(v.compliance)}%</Chip> : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-charcoal/70">
                      {v.status === "completed" ? (
                        <span className="inline-flex items-center gap-1.5">
                          {v.counts.fail}
                          {v.counts.critical > 0 && <Chip tone="red">{t.criticalOpen(v.counts.critical)}</Chip>}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {v.status === "completed" && (
                          <IconBtn label={t.c.view} onClick={() => setDetails(v)}>
                            <Eye size={16} />
                          </IconBtn>
                        )}
                        <IconBtn label={v.status === "scheduled" ? t.visits.completeNow : t.c.edit} onClick={() => setForm(v.status === "scheduled" ? { ...v, status: "completed" } : v)}>
                          {v.status === "scheduled" ? <CheckCheck size={16} /> : <Pencil size={16} />}
                        </IconBtn>
                        <IconBtn label={t.c.delete} danger onClick={() => remove(v)}>
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

      {details && (
        <VisitDetails
          visit={details}
          settings={S}
          onClose={() => setDetails(null)}
          onEdit={() => {
            setForm(details);
            setDetails(null);
          }}
        />
      )}

      {form && (
        <VisitForm
          visit={form.id ? form : null}
          onClose={() => setForm(null)}
          onSaved={() => {
            setForm(null);
            reload();
            reloadBranches();
          }}
        />
      )}
    </div>
  );
}

/* ───────────── تفاصيل زيارة مكتملة (قراءة فقط) ───────────── */
function VisitDetails({ visit, settings, onClose, onEdit }) {
  const { t, language, branchName } = useAu();
  const lv = levelOf(visit.compliance, settings);
  const icon = { pass: <Check size={14} />, fail: <X size={14} />, na: <Minus size={14} /> };
  const cls = { pass: "bg-emerald-50 text-emerald-700", fail: "bg-red-50 text-red-600", na: "bg-charcoal/10 text-charcoal/60" };

  return (
    <Modal title={t.visits.detailsTitle} onClose={onClose} closeLabel={t.c.close}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-navy">{branchName(visit.branchId)}</div>
          <div className="text-xs text-charcoal/60">
            {formatDay(visit.date, language)}
            {visit.auditor ? ` · ${visit.auditor}` : ""}
          </div>
        </div>
        <div className="text-end">
          {visit.compliance != null && <Chip tone={levelStyle[lv].tone}>{Math.round(visit.compliance)}% · {t.levels[lv]}</Chip>}
          <div className="mt-1 text-xs text-charcoal/55">{t.visits.summary(visit.counts.pass, visit.counts.fail, visit.counts.na)}</div>
        </div>
      </div>

      {AREAS.map((area) => {
        const rows = visit.results.filter((r) => r.area === area);
        if (!rows.length) return null;
        const s = scoreOf(rows);
        return (
          <div key={area} className="mb-4">
            <div className="mb-1.5 flex items-center justify-between text-sm font-bold text-navy">
              <span>{t.areas[area]}</span>
              {s != null && <span className="text-xs font-semibold text-charcoal/60">{s}%</span>}
            </div>
            <ul className="space-y-1.5">
              {rows.map((r) => (
                <li key={r.item} className="rounded-lg bg-offwhite px-3 py-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${cls[r.result]}`}>{icon[r.result]}</span>
                    <span className="flex-1 text-charcoal/85">{r.item}</span>
                    {r.result === "fail" && <Chip tone={severityStyle[r.severity].tone}>{t.severities[r.severity]}</Chip>}
                  </div>
                  {r.result === "fail" && r.note && <p className="mt-1 ps-7 text-xs text-charcoal/65">{r.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {visit.notes && (
        <div className="mb-4">
          <div className="mb-1 text-xs font-semibold text-charcoal/60">{t.visits.notes}</div>
          <p className="whitespace-pre-wrap rounded-lg bg-offwhite px-3 py-2 text-sm text-charcoal/80">{visit.notes}</p>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Btn variant="secondary" onClick={onClose}>
          {t.c.close}
        </Btn>
        <Btn onClick={onEdit}>
          <Pencil size={16} />
          {t.c.edit}
        </Btn>
      </div>
    </Modal>
  );
}

/* ───────────── نموذج الزيارة + قايمة الفحص ───────────── */
function buildSections(visit, settings, language) {
  const template = checklistFor(settings, language);
  const sections = {};
  for (const area of AREAS) {
    const saved = (visit?.results || []).filter((r) => r.area === area);
    const byItem = new Map(saved.map((r) => [r.item, r]));
    // بنود القايمة الحالية، وبعدين أي بنود محفوظة في الزيارة وملهاش وجود في القايمة (مخصّصة أو من نسخة قديمة).
    const items = [...template[area], ...saved.map((r) => r.item).filter((i) => !template[area].includes(i))];
    sections[area] = items.map((item) => {
      const r = byItem.get(item);
      return { item, result: r?.result || null, severity: r?.severity || "major", note: r?.note || "" };
    });
  }
  return sections;
}

function VisitForm({ visit, onClose, onSaved }) {
  const { t, language, branches, notify, settings } = useAu();
  const S = settings || { compliantFrom: 90, partialFrom: 75 };
  const choices = branches.filter((b) => b.status === "active" || b.id === visit?.branchId);
  const [f, setF] = useState(() => ({
    branchId: visit?.branchId || choices[0]?.id || "",
    date: visit?.date || localDay(),
    status: visit?.status || "completed",
    auditor: visit?.auditor || "",
    notes: visit?.notes || "",
  }));
  const [sections, setSections] = useState(() => buildSections(visit, settings, language));
  const [custom, setCustom] = useState({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const completed = f.status === "completed";

  const patch = (area, item, change) =>
    setSections((s) => ({ ...s, [area]: s[area].map((r) => (r.item === item ? { ...r, ...change } : r)) }));

  const flat = AREAS.flatMap((a) => sections[a].map((r) => ({ ...r, area: a })));
  const answered = flat.filter((r) => r.result);
  const live = scoreOf(answered);
  const liveLevel = levelOf(live, S);
  const counts = { pass: answered.filter((r) => r.result === "pass").length, fail: answered.filter((r) => r.result === "fail").length, na: answered.filter((r) => r.result === "na").length };

  function markAllPass() {
    setSections((s) => Object.fromEntries(AREAS.map((a) => [a, s[a].map((r) => (r.result ? r : { ...r, result: "pass" }))])));
  }

  function addCustom(area) {
    const text = (custom[area] || "").trim().slice(0, 160);
    if (!text || sections[area].some((r) => r.item === text)) return;
    setSections((s) => ({ ...s, [area]: [...s[area], { item: text, result: null, severity: "major", note: "" }] }));
    setCustom((c) => ({ ...c, [area]: "" }));
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (!f.branchId) return setErr(t.errors.branch_required);
    if (!f.date) return setErr(t.errors.date_invalid);
    if (completed && !answered.some((r) => r.result !== "na")) return setErr(t.errors.results_required);
    setBusy(true);
    try {
      const body = { ...f };
      if (completed) {
        body.results = answered.map((r) => ({
          area: r.area,
          item: r.item,
          result: r.result,
          ...(r.result === "fail" ? { severity: r.severity, note: r.note } : {}),
        }));
      }
      await api(visit ? `visits/${visit.id}` : "visits", { method: visit ? "PUT" : "POST", body });
      notify(t.saved);
      onSaved();
    } catch (e2) {
      setErr(errMsg(t, e2));
      setBusy(false);
    }
  }

  const resultBtn = {
    pass: { on: "bg-emerald-600 text-white", icon: <Check size={14} /> },
    fail: { on: "bg-red-600 text-white", icon: <X size={14} /> },
    na: { on: "bg-charcoal/70 text-white", icon: <Minus size={14} /> },
  };

  return (
    <Modal title={visit ? t.visits.editTitle : t.visits.addTitle} onClose={onClose} closeLabel={t.c.close} wide>
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
          <Field label={t.visits.auditor}>
            <input className={inputCls} value={f.auditor} maxLength={80} onChange={(e) => set("auditor", e.target.value)} />
          </Field>
        </div>

        {completed && (
          <div className="rounded-xl border border-charcoal/10">
            <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-t-xl border-b border-charcoal/10 bg-white px-3 py-2.5">
              <div className="text-xs font-semibold text-charcoal/70">{t.visits.checklist}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-charcoal/60">{t.visits.summary(counts.pass, counts.fail, counts.na)}</span>
                {live != null && <Chip tone={levelStyle[liveLevel].tone}>{live}%</Chip>}
                <button type="button" onClick={markAllPass} className="rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 hover:bg-emerald-100">
                  {t.visits.markAllPass}
                </button>
              </div>
            </div>

            <div className="space-y-5 p-3">
              {AREAS.map((area) => (
                <section key={area}>
                  <h3 className="mb-2 text-sm font-bold text-navy">{t.areas[area]}</h3>
                  <ul className="space-y-2">
                    {sections[area].map((r) => (
                      <li key={r.item} className="rounded-lg bg-offwhite p-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="min-w-0 flex-1 text-sm text-charcoal/85">{r.item}</span>
                          <div className="flex gap-1" role="radiogroup" aria-label={r.item}>
                            {["pass", "fail", "na"].map((k) => (
                              <button
                                key={k}
                                type="button"
                                role="radio"
                                aria-checked={r.result === k}
                                onClick={() => patch(area, r.item, { result: r.result === k ? null : k })}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                                  r.result === k ? resultBtn[k].on : "bg-white text-charcoal/65 hover:bg-sky/15"
                                }`}
                              >
                                {resultBtn[k].icon}
                                {t.visits.results[k]}
                              </button>
                            ))}
                          </div>
                        </div>
                        {r.result === "fail" && (
                          <div className="mt-2 space-y-2 rounded-lg bg-white p-2.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="me-1 text-xs font-semibold text-charcoal/60">{t.visits.severity}</span>
                              {SEVERITIES.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => patch(area, r.item, { severity: s })}
                                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${r.severity === s ? "text-white" : "bg-offwhite text-charcoal/65 hover:bg-sky/15"}`}
                                  style={r.severity === s ? { background: severityStyle[s].color } : undefined}
                                >
                                  {t.severities[s]}
                                </button>
                              ))}
                            </div>
                            <input className={inputCls} maxLength={500} placeholder={t.visits.findingNote} value={r.note} onChange={(e) => patch(area, r.item, { note: e.target.value })} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex gap-2">
                    <input
                      className={inputCls}
                      maxLength={160}
                      placeholder={t.visits.itemPlaceholder}
                      value={custom[area] || ""}
                      onChange={(e) => setCustom((c) => ({ ...c, [area]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom(area))}
                    />
                    <Btn variant="secondary" onClick={() => addCustom(area)}>
                      <Plus size={16} />
                      {t.visits.addItem}
                    </Btn>
                  </div>
                </section>
              ))}
            </div>
            <p className="border-t border-charcoal/10 px-3 py-2 text-xs text-charcoal/55">{t.visits.findingsNote}</p>
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
