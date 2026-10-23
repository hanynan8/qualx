"use client";

// إعدادات الداشبورد: اسم الجهة، الهدف، وحدود "ممتاز" و"جيد".

import { useEffect, useState } from "react";
import { api, useApi, useMs, errMsg } from "../client";
import { Card, Loading, ErrorBox, Field, Btn, inputCls } from "../components/ui";

export default function SettingsView() {
  const { t, notify } = useMs();
  const { data, error, reload } = useApi("settings");
  const [f, setF] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (data?.settings) setF({ ...data.settings });
  }, [data]);

  if (!f) return error ? <ErrorBox message={errMsg(t, error)} onRetry={reload} retryLabel={t.c.retry} /> : <Loading text={t.c.loading} />;

  const num = (k) => (e) => setF({ ...f, [k]: e.target.value === "" ? "" : Number(e.target.value) });

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await api("settings", { method: "PUT", body: f });
      notify(t.saved);
    } catch (e2) {
      setErr(errMsg(t, e2));
    }
    setBusy(false);
  }

  return (
    <Card className="max-w-xl">
      <form onSubmit={submit} className="space-y-4">
        <Field label={t.settings.orgName}>
          <input className={inputCls} value={f.orgName} maxLength={80} onChange={(e) => setF({ ...f, orgName: e.target.value })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t.settings.targetScore}>
            <input type="number" min={0} max={100} step={1} className={inputCls} value={f.targetScore} onChange={num("targetScore")} />
          </Field>
          <Field label={t.settings.excellentFrom}>
            <input type="number" min={0} max={100} step={1} className={inputCls} value={f.excellentFrom} onChange={num("excellentFrom")} />
          </Field>
          <Field label={t.settings.goodFrom}>
            <input type="number" min={0} max={100} step={1} className={inputCls} value={f.goodFrom} onChange={num("goodFrom")} />
          </Field>
        </div>
        <p className="text-xs text-charcoal/55">{t.settings.hint}</p>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}
        <div className="flex justify-end">
          <Btn type="submit" disabled={busy}>
            {busy ? t.c.saving : t.c.save}
          </Btn>
        </div>
      </form>
    </Card>
  );
}
