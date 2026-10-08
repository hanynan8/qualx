"use client";

// app/admin/components/mfaPanel.jsx
//
// لوحة تفعيل MFA (TOTP) لحساب الأدمن الحالي — نفس خطوات وشكل AdminMfaPanel في
// Edumaster: 1) توليد secret + QR  2) تأكيد بكود من تطبيق الـ authenticator
// 3) عرض الأكواد الاحتياطية مرة واحدة. بتكلّم /api/admin/mfa.

import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { api } from "../adminUtils";

const ERRORS = {
  mfa_already_enabled: "MFA is already enabled on this account.",
  invalid_code: "Invalid code, please try again.",
  too_many_requests: "Too many attempts. Please wait a few minutes and try again.",
};

export default function MfaPanel({ mfaEnabled = false }) {
  // idle | setup | backupCodes
  const [status, setStatus] = useState("idle");
  const [enabled, setEnabled] = useState(mfaEnabled);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState([]);
  const [disableCode, setDisableCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function call(body, fallback) {
    setError("");
    setBusy(true);
    try {
      return await api("/api/admin/mfa", { method: "POST", body: JSON.stringify(body) });
    } catch (err) {
      setError(ERRORS[err.message] || fallback);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function startSetup() {
    const data = await call({ action: "setup" }, "Failed to start MFA setup.");
    if (!data) return;
    setQrDataUrl(data.qrDataUrl);
    setSecret(data.secret);
    setCode("");
    setStatus("setup");
  }

  async function confirmSetup(e) {
    e.preventDefault();
    const data = await call({ action: "verify-setup", code }, "Failed to verify code.");
    if (!data) return;
    setBackupCodes(data.backupCodes || []);
    setEnabled(true);
    setQrDataUrl("");
    setSecret("");
    setStatus("backupCodes");
  }

  async function disableMfa(e) {
    e.preventDefault();
    const data = await call({ action: "disable", code: disableCode }, "Failed to disable MFA.");
    if (!data) return;
    setEnabled(false);
    setDisableCode("");
    setStatus("idle");
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-100">
      <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <h2 className="text-xl font-semibold flex items-center gap-3 text-blue-900">
          <Lock size={22} /> Two-Factor Authentication (MFA)
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Adds a required verification code from an authenticator app (Google Authenticator, Authy, ...) on top of your password.
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-medium">{error}</div>
        )}

        {status === "idle" && !enabled && (
          <button
            onClick={startSetup}
            disabled={busy}
            className="px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-50"
          >
            Enable MFA
          </button>
        )}

        {status === "idle" && enabled && (
          <div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-semibold mb-4">
              <ShieldCheck size={18} /> MFA is enabled on your account.
            </div>
            <details className="text-sm text-gray-500">
              <summary className="cursor-pointer font-medium">Disable MFA</summary>
              <form onSubmit={disableMfa} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  placeholder="Current 6-digit code or backup code"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 w-72"
                />
                <button
                  type="submit"
                  disabled={busy || !disableCode}
                  className="px-4 py-2 rounded-lg bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 disabled:opacity-50"
                >
                  Disable MFA
                </button>
              </form>
            </details>
          </div>
        )}

        {status === "setup" && (
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {qrDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrDataUrl} alt="MFA QR code" className="w-40 h-40 rounded-xl border-2 border-gray-100" />
            )}
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">Scan this QR code with your authenticator app, or enter the secret manually:</p>
              <code className="block px-3 py-2 rounded-lg bg-gray-50 text-xs font-mono text-gray-700 break-all mb-4" dir="ltr">{secret}</code>
              <form onSubmit={confirmSetup} className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code to confirm"
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={busy || !code}
                  className="px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 disabled:opacity-50"
                >
                  Confirm &amp; Enable
                </button>
              </form>
            </div>
          </div>
        )}

        {status === "backupCodes" && (
          <div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-semibold mb-4">
              <ShieldCheck size={18} /> MFA enabled successfully.
            </div>
            <p className="text-sm text-gray-600 mb-3 font-medium">
              Save these one-time backup codes somewhere safe — each can be used once if you lose access to your authenticator app. They won&apos;t be shown again.
              You will be signed out within about a minute and will need your code to sign in again.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {backupCodes.map((c) => (
                <code key={c} className="px-3 py-2 rounded-lg bg-gray-50 text-xs font-mono text-center text-gray-700" dir="ltr">{c}</code>
              ))}
            </div>
            <button
              onClick={() => {
                setBackupCodes([]);
                setStatus("idle");
              }}
              className="mt-5 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
