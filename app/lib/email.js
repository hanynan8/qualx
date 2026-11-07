// app/lib/email.js
//
// إرسال الإيميلات عن طريق Resend (https://resend.com) بـ fetch مباشرة — من غير مكتبات إضافية.
//
// متغيرات البيئة:
//   RESEND_API_KEY  : مفتاح Resend (لو مش موجود الإرسال بيتعطّل بهدوء ومفيش أي حاجة بتتكسر).
//   EMAIL_FROM      : المرسِل، لازم على دومين متحقق منه في Resend. مثال: "Merilex <no-reply@merilex.online>".
//
// إرسال الإيميل عمره ما بيفشّل العملية الأساسية: كل الدوال بترجّع { sent, reason? } ومابترميش أخطاء.

import { SITE_NAME } from "./siteConfig";

const RESEND_URL = "https://api.resend.com/emails";

export function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export async function sendEmail({ to, subject, html, text }) {
  if (!emailConfigured()) return { sent: false, reason: "not_configured" };
  if (typeof to !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { sent: false, reason: "invalid_recipient" };
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html, text }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("[email] Resend rejected the message:", res.status, (await res.text().catch(() => "")).slice(0, 300));
      return { sent: false, reason: `http_${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { sent: false, reason: "network_error" };
  }
}

// ───────────── قوالب (عربي + English في نفس الرسالة) ─────────────
const BRAND = SITE_NAME;

function layout({ titleAr, titleEn, bodyAr, bodyEn }) {
  const html = `<!doctype html><html><body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e7eb">
<h2 style="margin:0 0 12px;color:#1d4ed8">${esc(BRAND)}</h2>
<div dir="rtl" style="text-align:right;margin-bottom:20px"><h3 style="margin:0 0 8px">${esc(titleAr)}</h3><p style="margin:0;line-height:1.7">${bodyAr}</p></div>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">
<div dir="ltr" style="text-align:left"><h3 style="margin:0 0 8px">${esc(titleEn)}</h3><p style="margin:0;line-height:1.7">${bodyEn}</p></div>
</div></body></html>`;
  const text = `${titleAr}\n\n${bodyAr.replace(/<[^>]+>/g, "")}\n\n---\n\n${titleEn}\n\n${bodyEn.replace(/<[^>]+>/g, "")}`;
  return { html, text };
}

export function buildEmail(kind, { name = "", jobTitle = "" } = {}) {
  const n = esc(name || "");
  const j = esc(jobTitle || "");
  switch (kind) {
    case "application_accepted":
      return {
        subject: `تم قبول طلبك — Application accepted${jobTitle ? ` (${jobTitle})` : ""}`,
        ...layout({
          titleAr: "تم قبول طلبك",
          titleEn: "Your application was accepted",
          bodyAr: `أهلًا ${n}، تم قبول طلبك على وظيفة <b>${j}</b>. هتلاقيها الآن في «وظائفي» داخل بوابة الكارير.`,
          bodyEn: `Hi ${n}, your application for <b>${j}</b> was accepted. You'll find it under “My Jobs” in the career portal.`,
        }),
      };
    case "application_rejected":
      return {
        subject: `تحديث بخصوص طلبك — Application update${jobTitle ? ` (${jobTitle})` : ""}`,
        ...layout({
          titleAr: "تحديث بخصوص طلبك",
          titleEn: "Update on your application",
          bodyAr: `أهلًا ${n}، للأسف لم يتم قبول طلبك على وظيفة <b>${j}</b> هذه المرة. نشكرك على اهتمامك ونتمنى نشوفك في فرص قادمة.`,
          bodyEn: `Hi ${n}, unfortunately your application for <b>${j}</b> wasn't selected this time. Thank you for your interest — we hope to see you apply again.`,
        }),
      };
    case "password_changed":
      return {
        subject: "تم تغيير كلمة المرور — Your password was changed",
        ...layout({
          titleAr: "تم تغيير كلمة المرور",
          titleEn: "Your password was changed",
          bodyAr: `أهلًا ${n}، قام فريق الإدارة بتغيير كلمة مرور حسابك، وتم تسجيل خروجك من كل الأجهزة. هتستلم كلمة المرور الجديدة من الإدارة مباشرة. لو ماطلبتش ده، تواصل معانا فورًا.`,
          bodyEn: `Hi ${n}, an administrator changed your account password and signed you out of all devices. The new password will be shared with you directly. If you didn't expect this, contact us right away.`,
        }),
      };
    case "account_suspended":
      return {
        subject: "تم إيقاف حسابك — Your account was suspended",
        ...layout({
          titleAr: "تم إيقاف حسابك",
          titleEn: "Your account was suspended",
          bodyAr: `أهلًا ${n}، تم إيقاف حسابك مؤقتًا. للاستفسار تواصل مع فريق الإدارة.`,
          bodyEn: `Hi ${n}, your account has been suspended. Please contact the team if you have questions.`,
        }),
      };
    case "account_reactivated":
      return {
        subject: "تم تفعيل حسابك — Your account is active again",
        ...layout({
          titleAr: "تم تفعيل حسابك",
          titleEn: "Your account is active again",
          bodyAr: `أهلًا ${n}، تم تفعيل حسابك مرة أخرى وتقدر تسجل الدخول دلوقتي.`,
          bodyEn: `Hi ${n}, your account has been re-activated and you can sign in again.`,
        }),
      };
    default:
      return null;
  }
}

/** إرسال إشعار جاهز (بيرجّع { sent, reason? } ومابيرميش أخطاء). */
export async function notify(kind, { to, name, jobTitle }) {
  const mail = buildEmail(kind, { name, jobTitle });
  if (!mail || !to) return { sent: false, reason: "no_template" };
  return sendEmail({ to, subject: mail.subject, html: mail.html, text: mail.text });
}
