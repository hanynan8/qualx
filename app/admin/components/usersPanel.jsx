"use client";

// app/admin/components/usersPanel.jsx
//
// إدارة الحسابات (نفس منطق usersPanel في Edumaster): بحث وفلاتر، تغيير الـ
// role، إيقاف/تفعيل، حذف بتأكيد. كل الإجراءات بتمر على /api/admin/users
// (admin-only + audit log + حماية آخر أدمن).

import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, Search, RefreshCw, Trash2, ShieldCheck, ShieldOff, UserCheck, UserX, Lock } from "lucide-react";
import PanelFrame, { Banner, Spinner } from "./PanelFrame";
import { api } from "../adminUtils";

const ERRORS = {
  last_admin_protection: "ماينفعش — ده آخر أدمن شغّال في النظام.",
  cannot_delete_self: "ماتقدرش تحذف حسابك من هنا.",
  invalid_role: "role غير صالح.",
  invalid_status: "status غير صالح.",
  not_found: "الحساب مش موجود.",
};

function fmt(date) {
  if (!date) return "—";
  const d = new Date(date);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busyId, setBusyId] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await api("/api/admin/users"));
    } catch (err) {
      setError(`تعذّر تحميل المستخدمين: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 3500);
  };

  async function patchUser(user, body, okMsg) {
    setBusyId(user._id);
    setError("");
    try {
      const res = await api(`/api/admin/users/${user._id}`, { method: "PATCH", body: JSON.stringify(body) });
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role: res.role ?? u.role, status: res.status ?? u.status } : u)));
      flash(okMsg);
    } catch (err) {
      setError(ERRORS[err.message] || `فشل التعديل: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(user) {
    setConfirmTarget(null);
    setBusyId(user._id);
    setError("");
    try {
      await api(`/api/admin/users/${user._id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
      flash("اتحذف الحساب.");
    } catch (err) {
      setError(ERRORS[err.message] || `فشل الحذف: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;
      if (!q) return true;
      return [u.name, u.email, u.phone].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [users, query, roleFilter, statusFilter]);

  return (
    <PanelFrame
      icon={Users}
      title="Users"
      subtitle="الحسابات المسجّلة — الصلاحيات والإيقاف والحذف"
      actions={
        <button onClick={load} disabled={loading} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition disabled:opacity-60">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      }
    >
      {error && <Banner type="error">{error}</Banner>}
      {notice && <Banner type="success">{notice}</Banner>}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone..." className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 outline-none" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-3 border border-gray-300 rounded-xl bg-white">
          <option value="all">All roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-3 border border-gray-300 rounded-xl bg-white">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <span className="text-sm text-gray-500">{rows.length} / {users.length}</span>
      </div>

      {loading && users.length === 0 ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <Users size={44} className="mx-auto mb-3 opacity-50" />
          <p>لا يوجد مستخدمون مطابقون.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">MFA</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((u) => {
                const busy = busyId === u._id;
                const suspended = u.status === "suspended";
                const locked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
                return (
                  <tr key={u._id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800" dir="auto">{u.name || "—"}</p>
                      <p className="text-xs text-gray-500" dir="ltr">{u.email || "no email"}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600" dir="ltr">{u.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        disabled={busy}
                        onChange={(e) => patchUser(u, { role: e.target.value }, `اتغيّر الـ role لـ ${e.target.value}.`)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${u.role === "admin" ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${suspended ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>
                        {suspended ? <UserX size={12} /> : <UserCheck size={12} />}
                        {suspended ? "Suspended" : "Active"}
                      </span>
                      {locked && (
                        <span className="ms-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          <Lock size={12} /> Locked
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.mfaEnabled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"><ShieldCheck size={14} /> On</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400"><ShieldOff size={14} /> Off</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmt(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={busy}
                          onClick={() => patchUser(u, { status: suspended ? "active" : "suspended" }, suspended ? "اتفعّل الحساب." : "اتوقف الحساب.")}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50 ${suspended ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}
                        >
                          {suspended ? "Activate" : "Suspend"}
                        </button>
                        <button title="Delete" disabled={busy} onClick={() => setConfirmTarget(u)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmTarget(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600"><Trash2 size={26} /></div>
            <h3 className="text-center text-lg font-semibold text-gray-800">Delete this account?</h3>
            <p className="mt-2 text-center text-sm text-gray-500">
              حساب <strong dir="auto">{confirmTarget.name || confirmTarget.email}</strong> هيتمسح نهائيًا ومفيش تراجع.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setConfirmTarget(null)} className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={() => deleteUser(confirmTarget)} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </PanelFrame>
  );
}
