"use client";

// CareerAccountsPanel.jsx — إدارة حسابات بوابة الكارير (الفريلانسرز): بحث وفلترة، إنشاء حساب،
// إيقاف/تفعيل، ريسيت باسورد، فك القفل، إبطال الجلسات، تفاصيل النشاط (طلبات/تكليفات/مستحقات/شهادات)، وحذف.
import { useCallback, useEffect, useMemo, useState } from "react";
import { UserRound, Plus, Search, UserCheck, UserX, KeyRound, LogOut, Unlock, Trash2, Settings2, Download } from "lucide-react";
import { api, downloadCsv } from "../../adminUtils";
import PanelFrame, { Banner } from "../PanelFrame";
import { Field, Modal, Loading, ErrorBox, Badge, inputCls, btnPrimary, btnGhost, btnDanger, errText } from "./ui";

const EMPTY_NEW = { name: "", email: "", phone: "", password: "" };
const dateOnly = (d) => (d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const money = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 2 });
const TONE = {
  under_review: "amber", accepted: "green", rejected: "red", withdrawn: "gray",
  assigned: "blue", in_progress: "blue", submitted: "amber", completed: "green", cancelled: "gray",
  pending_review: "amber", pay_approved: "green", in_progress_cert: "blue",
};

function Section({ title, count, children }) {
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-gray-700">
        {title} <span className="font-normal text-gray-400">({count})</span>
      </h4>
      {count === 0 ? <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-400">Nothing yet.</p> : children}
    </div>
  );
}

function ManageModal({ summary, onClose, onChanged, onDeleted }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [profile, setProfile] = useState({ name: summary.name, phone: summary.phone });
  const [newPassword, setNewPassword] = useState("");
  const [account, setAccount] = useState(summary);

  const load = useCallback(async () => {
    try {
      const d = await api(`/api/admin/career-accounts/${summary.id}`);
      setDetail(d);
      setAccount((a) => ({ ...a, ...d.account }));
    } catch (e) {
      setError(errText(e));
    }
  }, [summary.id]);
  useEffect(() => {
    load();
  }, [load]);

  async function patch(body, okMsg) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await api(`/api/admin/career-accounts/${summary.id}`, { method: "PATCH", body: JSON.stringify(body) });
      setAccount((a) => ({ ...a, ...res.account }));
      setNotice(okMsg);
      onChanged(res.account);
      return true;
    } catch (e) {
      setError(errText(e));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    if (!window.confirm("Set this new password and sign the freelancer out of all devices?")) return;
    if (await patch({ newPassword }, "Password updated — all sessions were signed out.")) setNewPassword("");
  }

  async function remove() {
    const tail = "Their applications, assignments and certification progress will be deleted too. This cannot be undone.";
    if (!window.confirm(`Delete ${account.name} (${account.email})?\n\n${tail}`)) return;
    setBusy(true);
    setError("");
    try {
      try {
        await api(`/api/admin/career-accounts/${summary.id}`, { method: "DELETE" });
      } catch (e) {
        if (e.message !== "has_pay_records") throw e;
        if (!window.confirm("⚠️ This account has PAY RECORDS. Deleting it will also delete all their pay items permanently. Delete anyway?")) {
          setBusy(false);
          return;
        }
        await api(`/api/admin/career-accounts/${summary.id}?force=1`, { method: "DELETE" });
      }
      onDeleted(summary.id);
    } catch (e) {
      setError(errText(e));
      setBusy(false);
    }
  }

  const suspended = account.status === "suspended";
  return (
    <Modal title={`${account.name} — ${account.email}`} onClose={onClose} wide>
      <div className="space-y-5">
        <ErrorBox message={error} />
        {notice && <Banner type="success">{notice}</Banner>}

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={suspended ? "red" : "green"}>{suspended ? "Suspended" : "Active"}</Badge>
          {account.lockedUntil && <Badge tone="amber">Locked until {new Date(account.lockedUntil).toLocaleTimeString()}</Badge>}
          <span className="text-xs text-gray-500">Joined {dateOnly(account.createdAt)}</span>
        </div>

        <div className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
          <Field label="Name">
            <input value={profile.name} maxLength={100} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Phone">
            <input value={profile.phone} maxLength={20} dir="ltr" onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <button type="button" disabled={busy} onClick={() => patch(profile, "Profile saved.")} className={btnGhost}>Save profile</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ status: suspended ? "active" : "suspended" }, suspended ? "Account re-activated." : "Account suspended and signed out.")}
            className={suspended ? btnGhost : btnDanger}
          >
            {suspended ? <><UserCheck size={14} /> Activate</> : <><UserX size={14} /> Suspend</>}
          </button>
          <button type="button" disabled={busy} onClick={() => patch({ revokeSessions: true }, "All sessions were signed out.")} className={btnGhost}>
            <LogOut size={14} /> Sign out everywhere
          </button>
          {account.lockedUntil && (
            <button type="button" disabled={busy} onClick={() => patch({ unlock: true }, "Account unlocked.")} className={btnGhost}>
              <Unlock size={14} /> Unlock
            </button>
          )}
          <button type="button" disabled={busy} onClick={remove} className={btnDanger}>
            <Trash2 size={14} /> Delete account
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <Field label="Reset password (min 8 characters)">
            <div className="flex gap-2">
              <input type="text" dir="ltr" autoComplete="off" value={newPassword} maxLength={128} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
              <button type="button" disabled={busy || !newPassword} onClick={resetPassword} className={btnGhost}>
                <KeyRound size={14} /> Set
              </button>
            </div>
          </Field>
          <p className="mt-2 text-xs text-gray-500">Share the new password with the freelancer yourself — it isn&apos;t stored in plain text anywhere.</p>
        </div>

        {!detail ? (
          <Loading />
        ) : (
          <div className="space-y-4">
            <Section title="Applications" count={detail.applications.length}>
              <ul className="divide-y rounded-lg border text-sm">
                {detail.applications.map((a) => (
                  <li key={a.jobId} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate">{a.jobTitle}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-gray-500">{dateOnly(a.appliedAt)} <Badge tone={TONE[a.status]}>{a.status.replace("_", " ")}</Badge></span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Assignments" count={detail.assignments.length}>
              <ul className="divide-y rounded-lg border text-sm">
                {detail.assignments.map((a) => (
                  <li key={a.jobId} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate">{a.jobTitle}{a.client && <span className="text-gray-400"> · {a.client}</span>}</span>
                    <Badge tone={TONE[a.status]}>{a.status.replace("_", " ")}</Badge>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Pay items" count={detail.pay.length}>
              <ul className="divide-y rounded-lg border text-sm">
                {detail.pay.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate">{p.month} · {p.jobTitle}</span>
                    <span className="flex shrink-0 items-center gap-2" dir="ltr">
                      <span className="font-semibold">{money(p.total)} {p.currency}</span>
                      <Badge tone={TONE[p.status]}>{p.status.replace("_", " ")}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Certifications" count={detail.certifications.length}>
              <ul className="divide-y rounded-lg border text-sm">
                {detail.certifications.map((c) => (
                  <li key={c.certId} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="min-w-0 truncate">{c.title}</span>
                    <Badge tone={c.status === "completed" ? "green" : "blue"}>{c.status.replace("_", " ")}</Badge>
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function CareerAccountsPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [managing, setManaging] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems((await api("/api/admin/career-accounts")).items || []);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (!needle) return true;
      return [a.name, a.email, a.phone].some((v) => String(v || "").toLowerCase().includes(needle));
    });
  }, [items, q, statusFilter]);

  async function create(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const created = await api("/api/admin/career-accounts", { method: "POST", body: JSON.stringify(form) });
      setItems((prev) => [created, ...prev]);
      setForm(null);
    } catch (err) {
      setFormError(errText(err));
    } finally {
      setSaving(false);
    }
  }

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const suspendedCount = items.filter((a) => a.status === "suspended").length;

  return (
    <PanelFrame
      icon={UserRound}
      title="Career Accounts"
      subtitle={`${items.length} freelancer account${items.length === 1 ? "" : "s"}${suspendedCount ? ` · ${suspendedCount} suspended` : ""}`}
      actions={
        <>
          <button
            type="button"
            disabled={rows.length === 0}
            onClick={() =>
              downloadCsv(
                `career-accounts-${new Date().toISOString().slice(0, 10)}.csv`,
                ["Name", "Email", "Phone", "Status", "Applications", "Active jobs", "Completed jobs", "Pay pending", "Certifications completed", "Joined"],
                rows.map((a) => [a.name, a.email, a.phone, a.status, a.applications, a.activeJobs, a.completedJobs, a.pendingPay, a.certificationsCompleted, a.createdAt ? String(a.createdAt).slice(0, 10) : ""])
              )
            }
            className={btnGhost}
          >
            <Download size={14} /> Export CSV
          </button>
          <button type="button" onClick={() => { setFormError(""); setForm({ ...EMPTY_NEW }); }} className={btnPrimary}>
            <Plus size={16} /> New account
          </button>
        </>
      }
    >
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Search" className="min-w-[220px] flex-1">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email or phone" className={`${inputCls} ps-9`} />
          </div>
        </Field>
        <Field label="Status">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </Field>
      </div>

      <ErrorBox message={error} />
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-gray-500">No accounts match.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pe-3">Freelancer</th>
                <th className="pe-3">Phone</th>
                <th className="pe-3">Apps</th>
                <th className="pe-3">Active jobs</th>
                <th className="pe-3">Done</th>
                <th className="pe-3">Pay pending</th>
                <th className="pe-3">Certs</th>
                <th className="pe-3">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b align-top hover:bg-gray-50">
                  <td className="py-3 pe-3 font-semibold text-gray-800">
                    <span dir="auto">{a.name}</span>
                    <div className="text-xs font-normal text-gray-500" dir="ltr">{a.email}</div>
                  </td>
                  <td className="pe-3 text-gray-600" dir="ltr">{a.phone || "—"}</td>
                  <td className="pe-3">
                    {a.applications}
                    {a.pendingApplications > 0 && <span className="ms-1"><Badge tone="amber">{a.pendingApplications} new</Badge></span>}
                  </td>
                  <td className="pe-3">{a.activeJobs}</td>
                  <td className="pe-3">{a.completedJobs}</td>
                  <td className="pe-3">{a.pendingPay > 0 ? <Badge tone="amber">{a.pendingPay}</Badge> : "—"}</td>
                  <td className="pe-3">{a.certificationsCompleted}</td>
                  <td className="pe-3">
                    <Badge tone={a.status === "suspended" ? "red" : "green"}>{a.status}</Badge>
                    {a.lockedUntil && <span className="ms-1"><Badge tone="amber">locked</Badge></span>}
                  </td>
                  <td className="whitespace-nowrap py-2 text-right">
                    <button type="button" onClick={() => setManaging(a)} className={btnGhost}>
                      <Settings2 size={13} /> Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {managing && (
        <ManageModal
          key={managing.id}
          summary={managing}
          onClose={() => setManaging(null)}
          onChanged={(acc) => setItems((prev) => prev.map((x) => (x.id === acc.id ? { ...x, ...acc } : x)))}
          onDeleted={(id) => {
            setItems((prev) => prev.filter((x) => x.id !== id));
            setManaging(null);
          }}
        />
      )}

      {form && (
        <Modal title="New career account" onClose={() => setForm(null)}>
          <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
            <Field label="Name *" className="sm:col-span-2">
              <input required minLength={2} maxLength={100} value={form.name} onChange={setF("name")} className={inputCls} />
            </Field>
            <Field label="Email *" className="sm:col-span-2">
              <input required type="email" dir="ltr" maxLength={254} value={form.email} onChange={setF("email")} className={inputCls} />
            </Field>
            <Field label="Phone *">
              <input required dir="ltr" maxLength={20} value={form.phone} onChange={setF("phone")} className={inputCls} />
            </Field>
            <Field label="Password * (min 8)">
              <input required type="text" dir="ltr" autoComplete="off" minLength={8} maxLength={128} value={form.password} onChange={setF("password")} className={inputCls} />
            </Field>
            <div className="sm:col-span-2"><ErrorBox message={formError} /></div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setForm(null)} className={btnGhost}>Cancel</button>
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? "Creating…" : "Create"}</button>
            </div>
          </form>
        </Modal>
      )}
    </PanelFrame>
  );
}
