"use client";

// app/admin/components/usersPanel.jsx
//
// Users — نفس شكل وترتيب usersPanel في Edumaster: كارت "Registered Users" بجدول
// (#، الاسم، الإيميل، التليفون، الـ role، الإجراءات) + نافذة تأكيد الحذف، وتحته
// بانل الـ MFA. كل الإجراءات بتمر على /api/admin/users (admin-only + audit log
// + حماية آخر أدمن).

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Users, Loader, AlertCircle, Trash2, UserCheck, UserX } from "lucide-react";
import MfaPanel from "./mfaPanel";
import { api } from "../adminUtils";

const ERRORS = {
  last_admin_protection: "Can't change or remove the last remaining admin.",
  cannot_delete_self: "You can't delete your own account from here.",
};

export default function UsersPanel({ mfaEnabled }) {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const myId = session?.user?.id;

  useEffect(() => {
    api("/api/admin/users")
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setError("Error fetching users"))
      .finally(() => setLoading(false));
  }, []);

  async function patchUser(user, body, failMsg) {
    setActionError("");
    setSavingId(user._id);
    try {
      const res = await api(`/api/admin/users/${user._id}`, { method: "PATCH", body: JSON.stringify(body) });
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role: res.role ?? u.role, status: res.status ?? u.status } : u)));
    } catch (err) {
      setActionError(ERRORS[err.message] || failMsg);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(userId) {
    setConfirmDelete(null);
    setActionError("");
    setSavingId(userId);
    try {
      await api(`/api/admin/users/${userId}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      setActionError(ERRORS[err.message] || "Failed to delete user, please try again.");
    } finally {
      setSavingId(null);
    }
  }

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
        <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-2xl font-semibold flex items-center gap-3 text-blue-900">
            <Users size={28} /> Registered Users
            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{users.length}</span>
          </h2>
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
                {users.map((user, idx) => {
                  const suspended = user.status === "suspended";
                  const isMe = user._id === myId;
                  return (
                    <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                            {user.name?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                          <span dir="auto">{user.name || "—"}</span>
                          {suspended && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">Suspended</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-blue-600" dir="ltr">{user.email || "—"}</td>
                      <td className="py-3 px-4 text-gray-600" dir="ltr">{user.phone || "—"}</td>
                      <td className="py-3 px-4">
                        <select
                          value={user.role}
                          disabled={savingId === user._id}
                          onChange={(e) => e.target.value !== user.role && patchUser(user, { role: e.target.value }, "Failed to update role, please try again.")}
                          className={`px-2 py-1 rounded-lg text-xs font-semibold border-2 outline-none disabled:opacity-50 ${
                            user.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => patchUser(user, { status: suspended ? "active" : "suspended" }, "Failed to update status, please try again.")}
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
            {users.length === 0 && <div className="text-center py-12 text-gray-400">No users registered yet</div>}
          </div>
        </div>
      </div>

      <MfaPanel mfaEnabled={mfaEnabled} />

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
