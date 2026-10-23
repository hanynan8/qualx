"use client";

// إعدادات الداشبورد: اسم الجهة، الهدف، حدود الالتزام، مهل حل الملاحظات حسب الخطورة، وقايمة الفحص لكل مجال
// (بند في كل سطر). بعد الحفظ بنعمل reloadSettings عشان باقي الصفحات تاخد القيم الجديدة.

import { useEffect, useState } from "react";
import { api, useApi, useAu, errMsg, AREAS, SEVERITIES } from "../client";
import { Card, Loading, ErrorBox, Field, Btn, inputCls } from "../../_shared/ui";
import { DEFAULT_CHECKLIST, checklistFor } from "../checklist";

const SLA_LABEL = { critical: "slaCritical", major: "slaMajor", minor: "slaMinor" };
const lines = (s) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export default function SettingsView() {
  const { t, language, notify, reloadSettings } = useAu();
  const { data, error, reload } = useApi("settings");
  const [f, setF] = useState(null);
  // null = بيستخدم القايمة الافتراضية (بلغة الواجهة). غير كده = نص كل مجال (بند في كل سطر).
  const [custom, setCustom] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const s = data?.settings;
    if (!s) return;
    setF({ orgName: s.orgName, targetCompliance: s.targetCompliance, compliantFrom: s.compliantFrom, partialFrom: s.partialFrom, sla: { ...s.sla } });
    setCustom(s.checklist ? Object.fromEntries(AREAS.map((a) => [a, checklistFor(s, language)[a].join("\n")])) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  if (!f) return error ? <ErrorBox message={errMsg(t, error)} onRetry={reload} retryLabel={t.c.retry} /> : <Loading text={t.c.loading} />;

  const defaults = DEFAULT_CHECKLIST[language] || DEFAULT_CHECKLIST.en;
  const shown = (a) => (custom ? custom[a] : defaults[a].join("\n"));
  const editList = (a, value) => setCustom({ ...Object.fromEntries(AREAS.map((k) => [k, shown(k)])), [a]: value });

  const num = (k) => (e) => setF({ ...f, [k]: e.target.value === "" ? "" : Number(e.target.value) });
  const sla = (k) => (e) => setF({ ...f, sla: { ...f.sla, [k]: e.target.value === "" ? "" : Number(e.target.value) } });

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const body = { ...f, checklist: custom ? Object.fromEntries(AREAS.map((a) => [a, lines(custom[a])])) : null };
      await api("settings", { method: "PUT", body });
      notify(t.saved);
      reloadSettings();
      reload();
    } catch (e2) {
      setErr(errMsg(t, e2));
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-5">
      <Card>
        <div className="space-y-4">
          <Field label={t.settings.orgName}>
            <input className={inputCls} value={f.orgName} maxLength={80} onChange={(e) => setF({ ...f, orgName: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label={t.settings.targetCompliance}>
              <input type="number" min={0} max={100} step={1} className={inputCls} value={f.targetCompliance} onChange={num("targetCompliance")} />
            </Field>
            <Field label={t.settings.compliantFrom}>
              <input type="number" min={0} max={100} step={1} className={inputCls} value={f.compliantFrom} onChange={num("compliantFrom")} />
            </Field>
            <Field label={t.settings.partialFrom}>
              <input type="number" min={0} max={100} step={1} className={inputCls} value={f.partialFrom} onChange={num("partialFrom")} />
            </Field>
          </div>
          <p className="text-xs text-charcoal/55">{t.settings.hint}</p>
        </div>
      </Card>

      <Card title={t.settings.slaTitle}>
        <div className="grid gap-4 sm:grid-cols-3">
          {SEVERITIES.map((k) => (
            <Field key={k} label={t.settings[SLA_LABEL[k]]}>
              <input type="number" min={1} max={365} step={1} className={inputCls} value={f.sla[k]} onChange={sla(k)} />
            </Field>
          ))}
        </div>
        <p className="mt-3 text-xs text-charcoal/55">{t.settings.slaHint}</p>
      </Card>

      <Card
        title={t.settings.checklistTitle}
        right={
          <Btn variant="secondary" onClick={() => setCustom(null)} disabled={!custom}>
            {t.settings.resetDefaults}
          </Btn>
        }
      >
        <p className="-mt-1 mb-4 text-xs text-charcoal/55">{t.settings.checklistHint}</p>
        {!custom && <p className="mb-4 rounded-lg bg-sky/10 px-3 py-2 text-xs text-navy">{t.settings.usingDefaults}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          {AREAS.map((a) => (
            <Field key={a} label={t.areas[a]}>
              <textarea className={`${inputCls} leading-relaxed`} rows={8} value={shown(a)} onChange={(e) => editList(a, e.target.value)} />
            </Field>
          ))}
        </div>
      </Card>

      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
      <div className="flex justify-end">
        <Btn type="submit" disabled={busy}>
          {busy ? t.c.saving : t.c.save}
        </Btn>
      </div>
    </form>
  );
}
