"use client";

// ApplicationsPanel.jsx — طلبات التقديم لكل وظيفة: قبول (بيعمل تكليف تلقائي) / رفض / إرجاع للمراجعة.
import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { api } from "../../adminUtils";
import PanelFrame from "../PanelFrame";
import { Field, Loading, ErrorBox, Badge, inputCls, btnGhost, errText } from "./ui";

const TONE = { under_review: "amber", accepted: "green", rejected: "red", withdrawn: "gray" };

export default function ApplicationsPanel() {
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState("");
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    api("/api/admin/career-jobs")
      .then((d) => {
        setJobs(d.items || []);
        if (d.items?.[0]) setJobId(d.items[0].id);
        else setLoading(false);
      })
      .catch((e) => {
        setError(errText(e));
        setLoading(false);
      });
  }, []);

  const load = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setError("");
    try {
      setApps((await api(`/api/admin/career-jobs/${jobId}/applications`)).items || []);
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, [jobId]);
  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(a, status) {
    setBusy(a.accountId);
    try {
      await api(`/api/admin/career-jobs/${jobId}/applications`, { method: "PATCH", body: JSON.stringify({ accountId: a.accountId, status }) });
      await load();
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy("");
    }
  }

  return (
    <PanelFrame icon={ClipboardCheck} title="Applications">
      <Field label="Job" className="max-w-xl">
        <select value={jobId} onChange={(e) => setJobId(e.target.value)} className={inputCls}>
          {jobs.length === 0 && <option value="">No jobs</option>}
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} {j.client ? `— ${j.client}` : ""} ({j.status})
            </option>
          ))}
        </select>
      </Field>
      <ErrorBox message={error} />
      {loading ? (
        <Loading />
      ) : apps.length === 0 ? (
        <p className="py-8 text-center text-gray-500">No applications for this job.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pe-3">Applicant</th>
                <th className="pe-3">Phone</th>
                <th className="pe-3">Proposed date</th>
                <th className="pe-3">Note</th>
                <th className="pe-3">Applied</th>
                <th className="pe-3">Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {apps.map((a) => (
                <tr key={a.accountId} className="border-b align-top">
                  <td className="py-3 pe-3 font-semibold text-gray-800">
                    {a.name}
                    <div className="text-xs font-normal text-gray-500" dir="ltr">{a.email}</div>
                  </td>
                  <td className="pe-3" dir="ltr">{a.phone || "—"}</td>
                  <td className="pe-3">{a.proposedDate || "—"}</td>
                  <td className="max-w-[16rem] break-words pe-3 text-xs text-gray-600">{a.note || "—"}</td>
                  <td className="pe-3 text-xs">{String(a.appliedAt || "").slice(0, 10)}</td>
                  <td className="pe-3">
                    <Badge tone={TONE[a.status]}>{a.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="space-x-1 whitespace-nowrap py-2 text-right">
                    {a.status !== "withdrawn" && (
                      <>
                        {a.status !== "accepted" && (
                          <button type="button" disabled={busy === a.accountId} onClick={() => setStatus(a, "accepted")} className={btnGhost}>
                            Accept
                          </button>
                        )}
                        {a.status !== "rejected" && (
                          <button type="button" disabled={busy === a.accountId} onClick={() => setStatus(a, "rejected")} className={btnGhost}>
                            Reject
                          </button>
                        )}
                        {a.status !== "under_review" && (
                          <button type="button" disabled={busy === a.accountId} onClick={() => setStatus(a, "under_review")} className={btnGhost}>
                            Reset
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PanelFrame>
  );
}
