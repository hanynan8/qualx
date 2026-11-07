"use client";

// CertsPanel.jsx — إدارة الشهادات/التدريب + اعتماد إكمال شخص (بالإيميل).
import { useCallback, useEffect, useState } from "react";
import { Award, Plus, Pencil, Trash2, BadgeCheck } from "lucide-react";
import { api } from "../../adminUtils";
import PanelFrame from "../PanelFrame";
import { Field, Modal, Loading, ErrorBox, Badge, inputCls, btnPrimary, btnGhost, btnDanger, errText } from "./ui";

const EMPTY = { title: "", description: "", materialsUrl: "", status: "active" };

export default function CertsPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [grant, setGrant] = useState(null); // { cert, email, status }
  const [grantMsg, setGrantMsg] = useState({ error: "", ok: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems((await api("/api/admin/career-certifications")).items || []);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const { id, ...body } = form;
    try {
      await api(id ? `/api/admin/career-certifications/${id}` : "/api/admin/career-certifications", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      setForm(null);
      load();
    } catch (err) {
      setFormError(errText(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove(c) {
    if (!window.confirm(`Delete "${c.title}" and everyone's progress in it?`)) return;
    try {
      await api(`/api/admin/career-certifications/${c.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(errText(e));
    }
  }

  async function submitGrant(e) {
    e.preventDefault();
    setGrantMsg({ error: "", ok: "" });
    try {
      await api(`/api/admin/career-certifications/${grant.cert.id}/progress`, {
        method: "PATCH",
        body: JSON.stringify({ email: grant.email, status: grant.status }),
      });
      setGrantMsg({ error: "", ok: "Saved." });
    } catch (err) {
      setGrantMsg({ error: errText(err), ok: "" });
    }
  }

  return (
    <PanelFrame
      icon={Award}
      title="Training & Certifications"
      actions={
        <button type="button" onClick={() => { setFormError(""); setForm({ ...EMPTY }); }} className={btnPrimary}>
          <Plus size={16} /> New certification
        </button>
      }
    >
      <ErrorBox message={error} />
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-gray-500">No certifications yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((c) => (
            <div key={c.id} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-gray-800">{c.title}</h3>
                <Badge tone={c.status === "active" ? "green" : "gray"}>{c.status}</Badge>
              </div>
              <p className="mt-1 line-clamp-3 text-xs text-gray-500">{c.description || "No description."}</p>
              {c.materialsUrl && (
                <a href={c.materialsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-xs text-blue-600 underline" dir="ltr">
                  {c.materialsUrl}
                </a>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => { setGrantMsg({ error: "", ok: "" }); setGrant({ cert: c, email: "", status: "completed" }); }} className={btnGhost}>
                  <BadgeCheck size={13} /> Certify someone
                </button>
                <button type="button" onClick={() => { setFormError(""); setForm({ ...EMPTY, ...c }); }} className={btnGhost}>
                  <Pencil size={13} /> Edit
                </button>
                <button type="button" onClick={() => remove(c)} className={btnDanger}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal title={form.id ? "Edit certification" : "New certification"} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-4">
            <Field label="Title *">
              <input required maxLength={200} value={form.title} onChange={set("title")} className={inputCls} />
            </Field>
            <Field label="Description">
              <textarea rows={5} maxLength={8000} value={form.description} onChange={set("description")} className={inputCls} />
            </Field>
            <Field label="Materials URL (https)">
              <input value={form.materialsUrl} onChange={set("materialsUrl")} placeholder="https://…" className={inputCls} dir="ltr" />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={set("status")} className={inputCls}>
                <option value="active">Active (visible to freelancers)</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
            <ErrorBox message={formError} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setForm(null)} className={btnGhost}>Cancel</button>
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </Modal>
      )}

      {grant && (
        <Modal title={`Certify — ${grant.cert.title}`} onClose={() => setGrant(null)}>
          <form onSubmit={submitGrant} className="space-y-4">
            <Field label="Freelancer email (must be registered in the career portal)">
              <input required type="email" value={grant.email} onChange={(e) => setGrant((g) => ({ ...g, email: e.target.value }))} className={inputCls} dir="ltr" />
            </Field>
            <Field label="Result">
              <select value={grant.status} onChange={(e) => setGrant((g) => ({ ...g, status: e.target.value }))} className={inputCls}>
                <option value="completed">Completed (certified)</option>
                <option value="in_progress">In progress</option>
              </select>
            </Field>
            <ErrorBox message={grantMsg.error} />
            {grantMsg.ok && <p className="text-sm font-semibold text-emerald-700">{grantMsg.ok}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setGrant(null)} className={btnGhost}>Close</button>
              <button type="submit" className={btnPrimary}>Save</button>
            </div>
          </form>
        </Modal>
      )}
    </PanelFrame>
  );
}
