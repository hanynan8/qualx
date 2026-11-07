"use client";

// app/admin/components/usersPanel.jsx
//
// Users — جدول "Registered Users" (بحث + فلترة بالـ role والحالة) مع:
//   • إنشاء حساب جديد من الأدمن.
//   • Manage لكل حساب: تعديل الاسم/التليفون، الـ role، إيقاف/تفعيل، ريسيت باسورد، فك القفل،
//     إبطال الجلسات، ريسيت MFA، والتحكم في الداشبوردات المسموحة (Mystery Shopping / Auditing).
//   • حذف مع نافذة تأكيد.
// وتحته بانل الـ MFA الخاص بالأدمن. كل الإجراءات بتمر على /api/admin/users (admin-only + audit log + حماية آخر أدمن).

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Loader, AlertCircle, Trash2, UserCheck, UserX, Plus, Search, Settings2, Download, KeyRound, LogOut, Unlock, ShieldOff } from "lucide-react";
import MfaPanel from "./mfaPanel";
import { Modal, Field, ErrorBox, inputCls, btnPrimary, btnGhost, btnDanger } from "./career/ui";
import { Banner } from "./PanelFrame";
import { api, downloadCsv } from "../adminUtils";

const ERRORS = {
  last_admin_protection: "Can't change or remove the last remaining admin.",
  cannot_delete_self: "You can't delete your own account from here.",
  cannot_target_self: "You can't reset your own password/sessions/MFA from here.",
  email_taken: "That email is already registered.",
  name_taken: "That name is already taken.",
  weak_password: "Password must be 8–128 characters.",
  invalid_phone: "Invalid phone number.",
  invalid_name: "Invalid name.",
  invalid_email: "Invalid email.",
  missing_fields: "Please fill all required fields.",
};
const errMsg = (err, fallback) => ERRORS[err?.message] || fallback;

const DASHBOARDS = [
  { key: "mystery", label: "Mystery Shopping dashboard" },
  { key: "audit", label: "Operational Auditing dashboard" },
];

const EMPTY_NEW = { name: "", email: "", phone: "", password: "", role: "user" };

function ManageUserModal({ user, isMe, onClose, onUpdated, onDelete }) {
  const [u, setU] = useState(user);
  const [profile, setProfile] = useState({ name: user.name || "", phone: user.phone || "" });
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function patch(body, okMsg) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const res = await api(`/api/admin/users/${user._id}`, { method: "PATCH", body: JSON.stringify(body) });
      const next = {
        ...u,
        role: res.role ?? u.role,
        status: res.status ?? u.status,
        name: res.name ?? u.name,
        phone: res.phone ?? u.phone,
        mfaEnabled: res.mfaEnabled ?? u.mfaEnabled,
        lockedUntil: res.lockedUntil !== undefined ? res.lockedUntil : u.lockedUntil,
        blockedDashboards: res.blockedDashboards ?? u.blockedDashboards,
      };
      setU(next);
      onUpdated(next);
      setNotice(okMsg);
      return true;
    } catch (err) {
      setError(errMsg(err, "Action failed, please try again."));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (newPassword.length < 8) return setError(ERRORS.weak_password);
    if (!window.confirm("Set this new password and sign the user out of all devices?")) return;
    if (await patch({ newPassword }, "Password updated — all sessions were signed out.")) setNewPassword("");
  }

  const locked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
  const suspended = u.status === "suspended";
  const blocked = u.blockedDashboards || [];
  const toggleDashboard = (key) => {
    const next = blocked.includes(key) ? blocked.filter((k) => k !== key) : [...blocked, key];
    patch({ blockedDashboards: next }, "Dashboard access updated (applies within ~1 minute).");
  };

  return (
    <Modal title={`${u.name || "User"} — ${u.email}`} onClose={onClose} wide>
      <div className="space-y-5">
        <ErrorBox message={error} />
        {notice && <Banner type="success">{notice}</Banner>}

        <div className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
          <Field label="Name">
            <input value={profile.name} maxLength={100} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Phone">
            <input value={profile.phone} maxLength={20} dir="ltr" onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} className={inputCls} />
          </Field>
          <Field label="Role">
            <select
              value={u.role}
              disabled={busy}
              onChange={(e) => e.target.value !== u.role && patch({ role: e.target.value }, "Role updated.")}
              className={inputCls}
            >
              <option value="user">user</option>
              <option value="hr">hr (career portal)</option>
              <option value="editor">editor (site content)</option>
              <option value="admin">admin</option>
            </select>
          </Field>
          <div className="flex items-end">
            <button type="button" disabled={busy} onClick={() => patch(profile, "Profile saved.")} className={btnGhost}>Save profile</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || isMe}
            title={isMe ? "You can't suspend your own account" : undefined}
            onClick={() => patch({ status: suspended ? "active" : "suspended" }, suspended ? "Account re-activated." : "Account suspended and signed out.")}
            className={suspended ? btnGhost : btnDanger}
          >
            {suspended ? <><UserCheck size={14} /> Activate</> : <><UserX size={14} /> Suspend</>}
          </button>
          <button type="button" disabled={busy || isMe} onClick={() => patch({ revokeSessions: true }, "All sessions were signed out.")} className={btnGhost}>
            <LogOut size={14} /> Sign out everywhere
          </button>
          {locked && (
            <button type="button" disabled={busy} onClick={() => patch({ unlock: true }, "Account unlocked.")} className={btnGhost}>
              <Unlock size={14} /> Unlock (failed logins)
            </button>
          )}
          {u.mfaEnabled && (
            <button
              type="button"
              disabled={busy || isMe}
              onClick={() => window.confirm("Disable MFA for this account? They'll be able to sign in with just a password until they set it up again.") && patch({ resetMfa: true }, "MFA disabled for this account.")}
              className={btnGhost}
            >
              <ShieldOff size={14} /> Reset MFA
            </button>
          )}
          <button type="button" disabled={busy || isMe} onClick={() => onDelete(u)} className={btnDanger}>
            <Trash2 size={14} /> Delete
          </button>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <Field label="Reset password (min 8 characters)">
            <div className="flex gap-2">
              <input type="text" dir="ltr" autoComplete="off" value={newPassword} maxLength={128} disabled={isMe} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
              <button type="button" disabled={busy || isMe || !newPassword} onClick={resetPassword} className={btnGhost}>
                <KeyRound size={14} /> Set
              </button>
            </div>
          </Field>
          <p className="mt-2 text-xs text-gray-500">Share the new password with the user yourself — it isn&apos;t stored in plain text anywhere.</p>
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <h4 className="mb-1 text-sm font-semibold text-gray-700">Dashboard access</h4>
          <p className="mb-3 text-xs text-gray-500">
            شيل العلامة لحجب الداشبورد عن الحساب ده. الحسابات الإدارية (admin / hr / editor) مش بتتحجب.
          </p>
          <div className="space-y-2">
            {DASHBOARDS.map((d) => (
              <label key={d.key} className="flex cursor-pointer items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  disabled={busy || u.role !== "user"}
                  checked={!blocked.includes(d.key)}
                  onChange={() => toggleDashboard(d.key)}
                />
                {d.label}
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function UsersPanel({ mfaEnabled }) {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [managing, setManaging] = useState(null);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [creating, setCreating] = useState(false);

  const myId = session?.user?.id;

  useEffect(() => {
    api("/api/admin/users")
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setError("Error fetching users"))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && (u.status || "active") !== statusFilter) return false;
      if (!needle) return true;
      return [u.name, u.email, u.phone].some((v) => String(v || "").toLowerCase().includes(needle));
    });
  }, [users, q, roleFilter, statusFilter]);

  async function quickToggleStatus(user) {
    setActionError("");
    setSavingId(user._id);
    try {
      const res = await api(`/api/admin/users/${user._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: user.status === "suspended" ? "active" : "suspended" }),
      });
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, status: res.status ?? u.status } : u)));
    } catch (err) {
      setActionError(errMsg(err, "Failed to update status, please try again."));
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(userId) {
    setConfirmDelete(null);
    setManaging(null);
    setActionError("");
    setSavingId(userId);
    try {
      await api(`/api/admin/users/${userId}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      setActionError(errMsg(err, "Failed to delete user, please try again."));
    } finally {
      setSavingId(null);
    }
  }

  async function createUser(e) {
    e.preventDefault();
    setCreating(true);
    setFormError("");
    try {
      const created = await api("/api/admin/users", { method: "POST", body: JSON.stringify(form) });
      setUsers((prev) => [created, ...prev]);
      setForm(null);
    } catch (err) {
      setFormError(errMsg(err, "Failed to create user, please try again."));
    } finally {
      setCreating(false);
    }
  }

  const setF = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
        <Loader className="animate-spin mx-auto" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-100">
        <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-2xl font-semibold flex items-center gap-3 text-blue-900">
            <Users size={28} /> Registered Users
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{users.length}</span>
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={rows.length === 0}
              onClick={() =>
                downloadCsv(
                  `users-${new Date().toISOString().slice(0, 10)}.csv`,
                  ["Name", "Email", "Phone", "Role", "Status", "MFA", "Joined"],
                  rows.map((u) => [u.name, u.email, u.phone, u.role, u.status || "active", u.mfaEnabled ? "yes" : "no", u.createdAt ? String(u.createdAt).slice(0, 10) : ""])
                )
              }
              className={btnGhost}
            >
              <Download size={14} /> Export CSV
            </button>
            <button type="button" onClick={() => { setFormError(""); setForm({ ...EMPTY_NEW }); }} className={btnPrimary}>
              <Plus size={16} /> New user
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 px-6 py-4 rounded-xl bg-red-500 text-white flex items-center gap-3">
            <AlertCircle size={20} /> {error}
          </div>
        )}
        {actionError && (
          <div className="mx-6 mt-4 px-6 py-4 rounded-xl bg-amber-50 border-2 border-amber-200 text-amber-800 flex items-center gap-3">
            <AlertCircle size={20} /> {actionError}
          </div>
        )}

        <div className="p-6">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <Field label="Search" className="min-w-[220px] flex-1">
              <div className="relative">
                <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email or phone" className={`${inputCls} ps-9`} />
              </div>
            </Field>
            <Field label="Role">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={inputCls}>
                <option value="all">All</option>
                <option value="user">user</option>
                <option value="hr">hr (career portal)</option>
                <option value="editor">editor (site content)</option>
                <option value="admin">admin</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputCls}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </Field>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-3 px-4 font-semibold text-gray-500">#</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user, idx) => {
                  const suspended = user.status === "suspended";
                  const isMe = user._id === myId;
                  const locked = user.lockedUntil && new Date(user.lockedUntil) > new Date();
                  return (
                    <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <span dir="auto">{user.name || "—"}</span>
                          {suspended && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">Suspended</span>}
                          {locked && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">Locked</span>}
                          {(user.blockedDashboards || []).length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                              {(user.blockedDashboards || []).length} dashboard{user.blockedDashboards.length > 1 ? "s" : ""} blocked
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-blue-600" dir="ltr">{user.email || "—"}</td>
                      <td className="py-3 px-4 text-gray-600" dir="ltr">{user.phone || "—"}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-semibold border-2 ${
                            user.role === "admin"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : user.role === "user"
                                ? "bg-gray-50 text-gray-600 border-gray-200"
                                : "bg-sky-50 text-sky-700 border-sky-200"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setManaging(user)}
                            title="Manage user"
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                          >
                            <Settings2 size={16} />
                          </button>
                          <button
                            onClick={() => quickToggleStatus(user)}
                            disabled={savingId === user._id || isMe}
                            title={isMe ? "You can't suspend your own account" : suspended ? "Activate account" : "Suspend account"}
                            className={`p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed ${
                              suspended ? "text-green-600 hover:bg-green-50" : "text-amber-600 hover:bg-amber-50"
                            }`}
                          >
                            {suspended ? <UserCheck size={16} /> : <UserX size={16} />}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(user)}
                            disabled={savingId === user._id || isMe}
                            title={isMe ? "You can't delete your own account" : "Delete user"}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="text-center py-12 text-gray-400">{users.length === 0 ? "No users registered yet" : "No users match the filters"}</div>
            )}
          </div>
        </div>
      </div>

      <MfaPanel mfaEnabled={mfaEnabled} />

      {managing && (
        <ManageUserModal
          key={managing._id}
          user={managing}
          isMe={managing._id === myId}
          onClose={() => setManaging(null)}
          onUpdated={(next) => setUsers((prev) => prev.map((x) => (x._id === next._id ? { ...x, ...next } : x)))}
          onDelete={(u) => setConfirmDelete(u)}
        />
      )}

      {form && (
        <Modal title="New user" onClose={() => setForm(null)}>
          <form onSubmit={createUser} className="grid gap-4 sm:grid-cols-2">
            <Field label="Name *" className="sm:col-span-2">
              <input required minLength={2} maxLength={100} value={form.name} onChange={setF("name")} className={inputCls} />
            </Field>
            <Field label="Email *" className="sm:col-span-2">
              <input required type="email" dir="ltr" maxLength={254} value={form.email} onChange={setF("email")} className={inputCls} />
            </Field>
            <Field label="Phone *">
              <input required dir="ltr" maxLength={20} value={form.phone} onChange={setF("phone")} className={inputCls} />
            </Field>
            <Field label="Role">
              <select value={form.role} onChange={setF("role")} className={inputCls}>
                <option value="user">user</option>
                <option value="hr">hr (career portal)</option>
                <option value="editor">editor (site content)</option>
                <option value="admin">admin</option>
              </select>
            </Field>
            <Field label="Password * (min 8)" className="sm:col-span-2">
              <input required type="text" dir="ltr" autoComplete="off" minLength={8} maxLength={128} value={form.password} onChange={setF("password")} className={inputCls} />
            </Field>
            <div className="sm:col-span-2"><ErrorBox message={formError} /></div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setForm(null)} className={btnGhost}>Cancel</button>
              <button type="submit" disabled={creating} className={btnPrimary}>{creating ? "Creating…" : "Create"}</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete this user?</h3>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-semibold">{confirmDelete.name}</span> ({confirmDelete.email}) will be permanently deleted. This action is logged and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete._id)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
