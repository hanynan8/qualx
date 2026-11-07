"use client";

// ApplicationsPanel.jsx — طلبات التقديم لكل وظيفة: قبول (بيعمل تكليف تلقائي) / رفض / إرجاع للمراجعة.
import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { api } from "../../adminUtils";
import PanelFrame from "../PanelFrame";
import { Field, Loading, ErrorBox, Badge, inputCls, btnGhost, errText } from "./ui";

const INBOX = "__inbox__";
const TONE = { under_review: "amber", accepted: "green", rejected: "red", withdrawn: "gray" };

export default function ApplicationsPanel() {
  const [jobs, setJobs] = useState([]);
  const [jobId, setJobId] = useState(INBOX); // INBOX = كل الوظايف في صندوق واحد
  const [inboxStatus, setInboxStatus] = useState("under_review");
  const [inboxTotal, setInboxTotal] = useState(0);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    api("/api/admin/career-jobs")
      .then((d) => {
        setJobs(d.items || []);
      })
      .catch((e) => setError(errText(e)));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (jobId === INBOX) {
        const d = await api(`/api/admin/career-applications?status=${inboxStatus}`);
        setApps(d.items || []);
        setInboxTotal(d.total || 0);
      } else {
        setApps((await api(`/api/admin/career-jobs/${jobId}/applications`)).items || []);
      }
    } catch (e) {
      setError(errText(e));
    } finally {
      setLoading(false);
    }
  }, [jobId, inboxStatus]);
  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(a, status) {
    const key = `${a.jobId || jobId}:${a.accountId}`;
    setBusy(key);
    try {
      await api(`/api/admin/career-jobs/${a.jobId || jobId}/applications`, { method: "PATCH", body: JSON.stringify({ accountId: a.accountId, status }) });
      await load();
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy("");
    }
  }

  return (
    <PanelFrame icon={ClipboardCheck} title="Applications">
      <div className="flex flex-wrap items-end gap-4">
      <Field label="Job" className="min-w-[260px] max-w-xl flex-1">
        <select value={jobId} onChange={(e) => setJobId(e.target.value)} className={inputCls}>
          <option value={INBOX}>All jobs — inbox</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title} {j.client ? `— ${j.client}` : ""} ({j.status})
            </option>
          ))}
        </select>
      </Field>
      {jobId === INBOX && (
        <Field label="Show">
          <select value={inboxStatus} onChange={(e) => setInboxStatus(e.target.value)} className={inputCls}>
            <option value="under_review">Waiting for review</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="all">All</option>
          </select>
        </Field>
      )}
      </div>
      {jobId === INBOX && inboxTotal > apps.length && (
        <p className="text-xs text-gray-500">Showing the latest {apps.length} of {inboxTotal}.</p>
      )}
      <ErrorBox message={error} />
      {loading ? (
        <Loading />
      ) : apps.length === 0 ? (
        <p className="py-8 text-center text-gray-500">{jobId === INBOX ? "No applications here." : "No applications for this job."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pe-3">Applicant</th>
                {jobId === INBOX && <th className="pe-3">Job</th>}
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
                <tr key={`${a.jobId || jobId}:${a.accountId}`} className="border-b align-top">
                  <td className="py-3 pe-3 font-semibold text-gray-800">
                    {a.name}
                    <div className="text-xs font-normal text-gray-500" dir="ltr">{a.email}</div>
                  </td>
                  {jobId === INBOX && (
                    <td className="pe-3 text-gray-700">
                      {a.jobTitle}
                      {a.client && <div className="text-xs text-gray-400">{a.client}</div>}
                    </td>
                  )}
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
                          <button type="button" disabled={busy === `${a.jobId || jobId}:${a.accountId}`} onClick={() => setStatus(a, "accepted")} className={btnGhost}>
                            Accept
                          </button>
                        )}
                        {a.status !== "rejected" && (
                          <button type="button" disabled={busy === `${a.jobId || jobId}:${a.accountId}`} onClick={() => setStatus(a, "rejected")} className={btnGhost}>
                            Reject
                          </button>
                        )}
                        {a.status !== "under_review" && (
                          <button type="button" disabled={busy === `${a.jobId || jobId}:${a.accountId}`} onClick={() => setStatus(a, "under_review")} className={btnGhost}>
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
