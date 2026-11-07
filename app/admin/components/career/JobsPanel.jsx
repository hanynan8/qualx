"use client";

// JobsPanel.jsx — إدارة وظائف بوابة الكارير: إضافة/تعديل/فتح-قفل/حذف + اختيار الموقع من الخريطة.
import { useCallback, useEffect, useState } from "react";
import { Briefcase, Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "../../adminUtils";
import PanelFrame from "../PanelFrame";
import LocationPicker from "./LocationPicker";
import { Field, Modal, Loading, ErrorBox, Badge, inputCls, btnPrimary, btnGhost, btnDanger, errText } from "./ui";

const EMPTY = {
  title: "", client: "", type: "onsite", status: "open", city: "", address: "", lat: "", lng: "",
  compensation: "", reimbursement: "", firstDate: "", lastDate: "", logoUrl: "", description: "",
};

export default function JobsPanel() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null); // { id?, ...fields }
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems((await api("/api/admin/career-jobs")).items || []);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setFormError("");
    setForm({ ...EMPTY });
  };
  const openEdit = (j) => {
    setFormError("");
    setForm({ ...EMPTY, ...j, lat: j.lat ?? "", lng: j.lng ?? "" });
  };
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const { id, assignedCount, ...rest } = form;
    const body = { ...rest, lat: rest.lat === "" ? null : Number(rest.lat), lng: rest.lng === "" ? null : Number(rest.lng) };
    delete body.id;
    try {
      await api(id ? `/api/admin/career-jobs/${id}` : "/api/admin/career-jobs", {
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

  async function toggle(j) {
    try {
      await api(`/api/admin/career-jobs/${j.id}`, { method: "PATCH", body: JSON.stringify({ status: j.status === "open" ? "closed" : "open" }) });
      load();
    } catch (e) {
      setError(errText(e));
    }
  }
  async function remove(j) {
    if (!window.confirm(`Delete "${j.title}"? Related assignments stay in the database.`)) return;
    try {
      await api(`/api/admin/career-jobs/${j.id}`, { method: "DELETE" });
      load();
    } catch (e) {
      setError(errText(e));
    }
  }

  return (
    <PanelFrame
      icon={Briefcase}
      title="Career Jobs"
      actions={
        <button type="button" onClick={openNew} className={btnPrimary}>
          <Plus size={16} /> New job
        </button>
      }
    >
      <ErrorBox message={error} />
      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-gray-500">No jobs yet. Create the first one.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pe-3">Title</th>
                <th className="pe-3">Type</th>
                <th className="pe-3">City</th>
                <th className="pe-3">Map</th>
                <th className="pe-3">Dates</th>
                <th className="pe-3">Assigned</th>
                <th className="pe-3">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((j) => (
                <tr key={j.id} className="border-b align-top">
                  <td className="py-3 pe-3 font-semibold text-gray-800">
                    {j.title}
                    <div className="text-xs font-normal text-gray-500">{j.client}</div>
                  </td>
                  <td className="pe-3">{j.type === "web_phone" ? "Web / Phone" : "On-site"}</td>
                  <td className="pe-3">{j.city || "—"}</td>
                  <td className="pe-3">{j.type === "web_phone" ? "—" : j.lat != null ? <Badge tone="green">set</Badge> : <Badge tone="amber">missing</Badge>}</td>
                  <td className="pe-3 text-xs text-gray-600">{[j.firstDate, j.lastDate].filter(Boolean).join(" → ") || "—"}</td>
                  <td className="pe-3">{j.assignedCount}</td>
                  <td className="pe-3">
                    <Badge tone={j.status === "open" ? "green" : "gray"}>{j.status}</Badge>
                  </td>
                  <td className="space-x-1 whitespace-nowrap py-2 text-right">
                    <button type="button" onClick={() => openEdit(j)} className={btnGhost}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button type="button" onClick={() => toggle(j)} className={btnGhost}>
                      {j.status === "open" ? "Close" : "Reopen"}
                    </button>
                    <button type="button" onClick={() => remove(j)} className={btnDanger}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal title={form.id ? "Edit job" : "New job"} onClose={() => setForm(null)} wide>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <Field label="Title *" className="sm:col-span-2">
              <input required maxLength={200} value={form.title} onChange={set("title")} className={inputCls} />
            </Field>
            <Field label="Client">
              <input maxLength={120} value={form.client} onChange={set("client")} className={inputCls} />
            </Field>
            <Field label="Logo URL (https)">
              <input value={form.logoUrl} onChange={set("logoUrl")} placeholder="https://…" className={inputCls} />
            </Field>
            <Field label="Type">
              <select value={form.type} onChange={set("type")} className={inputCls}>
                <option value="onsite">On-site (list + map)</option>
                <option value="web_phone">Web / Phone (remote)</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={set("status")} className={inputCls}>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </Field>
            <Field label="Compensation (e.g. 200 EGP)">
              <input maxLength={80} value={form.compensation} onChange={set("compensation")} className={inputCls} />
            </Field>
            <Field label="Reimbursement">
              <input maxLength={80} value={form.reimbursement} onChange={set("reimbursement")} className={inputCls} />
            </Field>
            <Field label="First date">
              <input type="date" value={form.firstDate} onChange={set("firstDate")} className={inputCls} />
            </Field>
            <Field label="Last date">
              <input type="date" value={form.lastDate} onChange={set("lastDate")} className={inputCls} />
            </Field>

            {form.type === "onsite" && (
              <>
                <Field label="City">
                  <input maxLength={120} value={form.city} onChange={set("city")} className={inputCls} />
                </Field>
                <Field label="Address">
                  <input maxLength={300} value={form.address} onChange={set("address")} className={inputCls} />
                </Field>
                <div className="sm:col-span-2">
                  <p className="mb-1 text-xs font-semibold text-gray-600">Location — click the map to place the job (Egypt only)</p>
                  <LocationPicker
                    lat={form.lat === "" ? null : Number(form.lat)}
                    lng={form.lng === "" ? null : Number(form.lng)}
                    onChange={(la, ln) => setForm((f) => ({ ...f, lat: la, lng: ln }))}
                  />
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <Field label="Latitude">
                      <input type="number" step="any" value={form.lat} onChange={set("lat")} className={inputCls} />
                    </Field>
                    <Field label="Longitude">
                      <input type="number" step="any" value={form.lng} onChange={set("lng")} className={inputCls} />
                    </Field>
                  </div>
                </div>
              </>
            )}

            <Field label="Description" className="sm:col-span-2">
              <textarea rows={5} maxLength={8000} value={form.description} onChange={set("description")} className={inputCls} />
            </Field>
            <div className="sm:col-span-2">
              <ErrorBox message={formError} />
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setForm(null)} className={btnGhost}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </PanelFrame>
  );
}
