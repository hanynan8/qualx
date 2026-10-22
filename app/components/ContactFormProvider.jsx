"use client";

// app/components/ContactFormProvider.jsx
//
// فورم تواصل / طلب عرض سعر / تقديم على وظيفة — بيفتح كنافذة (Modal) من أي زرار
// في الموقع، وبيحفظ الطلب في كولكشن "form" في مونجو عن طريق
// POST /api/data?collection=form. الأدمن بيشوف الطلبات في بانل "Form Submissions".
// التقديم على وظيفة (kind: "apply") بيرفع CV بصيغة PDF لـ POST /api/cv (multipart)،
// وبيتخزن في Vercel Blob، والأدمن بيشوفه في بانل "CVs".
//
// الاستخدام في أي كومبوننت:
//   const { openForm } = useContactForm();
//   <button onClick={() => openForm({ kind: "quote" })}>…</button>
//   openForm({ kind: "apply", subject: "Auditor", email: "jobs@…" })
//
// kind: "quote" | "contact" | "service" | "apply"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { X, Send, AlertCircle, Loader, Mail, Upload, FileText, Trash2 } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useContactEmail } from "../lib/useContactEmail";

const ContactFormContext = createContext({ openForm: () => {} });

export function useContactForm() {
  return useContext(ContactFormContext);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// لازم يطابق MAX_CV_BYTES في app/lib/cvValidation.js (4MB — حد Vercel لحجم الـ request).
const MAX_CV_MB = 4;
const MAX_CV_BYTES = MAX_CV_MB * 1024 * 1024;

const TEXT = {
  en: {
    titles: {
      quote: "Request a quote",
      contact: "Contact us",
      service: "Ask about this service",
      apply: "Apply now",
    },
    subtitles: {
      quote: "Tell us a bit about your business and we'll get back to you with an offer.",
      contact: "Send us your question and we'll reply as soon as possible.",
      service: "Send us your question and we'll reply as soon as possible.",
      apply: "Share your details and we'll contact you about the next step.",
    },
    labels: {
      quote: "Quote request",
      contact: "Inquiry",
      service: "Inquiry about",
      apply: "Application",
    },
    name: "Full name",
    email: "Email",
    phone: "Phone (optional)",
    message: "Message",
    messageApply: "About you (optional)",
    link: "LinkedIn / portfolio link (optional)",
    cv: "Your CV (PDF)",
    cvChoose: "Choose a PDF file",
    cvHint: `PDF only, up to ${MAX_CV_MB} MB`,
    cvRemove: "Remove file",
    send: "Send",
    sending: "Sending…",
    close: "Close",
    successTitle: "Thank you!",
    successText: "We received your request and will get back to you shortly.",
    errName: "Please enter your name.",
    errEmail: "Please enter a valid email address.",
    errMessage: "Please write a short message.",
    errApply: "Please attach your CV as a PDF file.",
    errCvType: "The CV must be a PDF file.",
    errCvSize: `The file is too large. Maximum size is ${MAX_CV_MB} MB.`,
    errUnavailable: "File upload is temporarily unavailable. Please email us your CV instead.",
    errRate: "Too many attempts. Please try again in a minute.",
    errGeneric: "Something went wrong. Please try again.",
    orEmail: "Or email us directly at",
  },
  ar: {
    titles: {
      quote: "اطلب عرض سعر",
      contact: "تواصل معانا",
      service: "اسأل عن الخدمة",
      apply: "قدّم دلوقتي",
    },
    subtitles: {
      quote: "قولنا شوية عن شغلك وهنرجعلك بعرض مناسب.",
      contact: "ابعتلنا سؤالك وهنرد عليك في أقرب وقت.",
      service: "ابعتلنا سؤالك وهنرد عليك في أقرب وقت.",
      apply: "ابعتلنا بياناتك وهنتواصل معاك بخصوص الخطوة الجاية.",
    },
    labels: {
      quote: "طلب عرض سعر",
      contact: "استفسار",
      service: "استفسار عن",
      apply: "تقديم على وظيفة",
    },
    name: "الاسم بالكامل",
    email: "البريد الإلكتروني",
    phone: "رقم التليفون (اختياري)",
    message: "الرسالة",
    messageApply: "نبذة عنك (اختياري)",
    link: "لينك LinkedIn / أعمالك (اختياري)",
    cv: "السيرة الذاتية (PDF)",
    cvChoose: "اختار ملف PDF",
    cvHint: `PDF فقط، لحد ${MAX_CV_MB} ميجا`,
    cvRemove: "إزالة الملف",
    send: "إرسال",
    sending: "جاري الإرسال…",
    close: "إغلاق",
    successTitle: "شكرًا ليك!",
    successText: "استلمنا طلبك وهنرد عليك قريب.",
    errName: "من فضلك اكتب اسمك.",
    errEmail: "من فضلك اكتب بريد إلكتروني صحيح.",
    errMessage: "من فضلك اكتب رسالة قصيرة.",
    errApply: "من فضلك ارفع سيرتك الذاتية كملف PDF.",
    errCvType: "السيرة الذاتية لازم تكون ملف PDF.",
    errCvSize: `الملف كبير. الحد الأقصى ${MAX_CV_MB} ميجا.`,
    errUnavailable: "رفع الملفات مش متاح دلوقتي. ابعتلنا سيرتك الذاتية على الإيميل.",
    errRate: "محاولات كتير. جرّب تاني بعد دقيقة.",
    errGeneric: "حصلت مشكلة. جرّب تاني.",
    orEmail: "أو ابعتلنا إيميل على",
  },
};

const EMPTY = { name: "", email: "", phone: "", message: "", link: "", website: "" };

export default function ContactFormProvider({ children }) {
  const { language } = useLanguage();
  const defaultEmail = useContactEmail();
  const isAr = language === "ar";
  const t = TEXT[isAr ? "ar" : "en"];

  const [ctx, setCtx] = useState(null); // null = مقفول
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | sending | success
  const [error, setError] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const firstFieldRef = useRef(null);
  const fileInputRef = useRef(null);

  const openForm = useCallback((opts = {}) => {
    setCtx({ kind: "contact", subject: "", email: "", ...opts });
    setForm(EMPTY);
    setCvFile(null);
    setStatus("idle");
    setError("");
  }, []);

  const closeForm = useCallback(() => setCtx(null), []);

  // Escape بيقفل + قفل سكرول الصفحة + فوكس على أول حقل.
  useEffect(() => {
    if (!ctx) return undefined;
    const onKey = (e) => e.key === "Escape" && setCtx(null);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = setTimeout(() => firstFieldRef.current?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      clearTimeout(id);
    };
  }, [ctx]);

  const value = useMemo(() => ({ openForm }), [openForm]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function handleCvChange(e) {
    const file = e.target.files?.[0] || null;
    e.target.value = ""; // يسمح باختيار نفس الملف تاني بعد إزالته
    if (!file) return;
    if (!(file.type === "application/pdf" || /\.pdf$/i.test(file.name))) {
      setCvFile(null);
      return setError(t.errCvType);
    }
    if (file.size > MAX_CV_BYTES) {
      setCvFile(null);
      return setError(t.errCvSize);
    }
    setError("");
    setCvFile(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (status === "sending" || !ctx) return;

    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const text = form.message.trim();
    const link = form.link.trim();
    const isApply = ctx.kind === "apply";

    if (!name) return setError(t.errName);
    if (!EMAIL_RE.test(email)) return setError(t.errEmail);
    if (isApply && !cvFile) return setError(t.errApply);
    if (!isApply && !text) return setError(t.errMessage);

    const message = text;
    const labelBase = TEXT.en.labels[ctx.kind] || TEXT.en.labels.contact;
    const service = (ctx.subject ? `${labelBase}: ${ctx.subject}` : labelBase).slice(0, 200);

    setError("");
    setStatus("sending");
    try {
      let res;
      if (isApply) {
        // التقديم بملف: multipart لـ /api/cv (من غير Content-Type يدوي — المتصفح بيحط الـ boundary).
        const fd = new FormData();
        fd.append("file", cvFile);
        fd.append("name", name);
        fd.append("email", email);
        if (phone) fd.append("phone", phone);
        if (ctx.subject) fd.append("position", ctx.subject);
        if (text) fd.append("message", text);
        if (link) fd.append("link", link);
        fd.append("website", form.website); // honeypot — لازم يفضل فاضي
        res = await fetch("/api/cv", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/data?collection=form", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            ...(phone ? { phone } : {}),
            service,
            message,
            website: form.website, // honeypot — لازم يفضل فاضي
          }),
        });
      }
      if (res.status === 429) throw new Error(t.errRate);
      if (!res.ok) {
        const code = (await res.json().catch(() => null))?.error || "";
        if (res.status === 413 || code === "file_too_large") throw new Error(t.errCvSize);
        if (code === "file_not_pdf") throw new Error(t.errCvType);
        if (code === "storage_not_configured") throw new Error(t.errUnavailable);
        throw new Error(t.errGeneric);
      }
      setStatus("success");
    } catch (err) {
      setStatus("idle");
      setError(err?.message || t.errGeneric);
    }
  }

  const directEmail = ctx?.email || defaultEmail;
  const title =
    ctx?.kind === "service" || ctx?.kind === "apply"
      ? `${t.titles[ctx.kind]}${ctx.subject ? ` — ${ctx.subject}` : ""}`
      : ctx
        ? t.titles[ctx.kind] || t.titles.contact
        : "";

  const inputCls =
    "mt-1.5 w-full rounded-lg border border-charcoal/15 bg-white px-3.5 py-2.5 text-sm text-charcoal placeholder:text-charcoal/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30";
  const labelCls = "block text-sm font-semibold text-navy";

  return (
    <ContactFormContext.Provider value={value}>
      {children}

      {ctx && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-navy/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(e) => e.target === e.currentTarget && closeForm()}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            dir={isAr ? "rtl" : "ltr"}
            className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-offwhite shadow-2xl sm:max-w-lg sm:rounded-2xl"
          >
            <div className="relative bg-navy px-6 py-5 text-offwhite">
              <h2 className="pe-10 font-display text-xl font-bold">{title}</h2>
              <p className="mt-1 text-sm text-offwhite/70">{t.subtitles[ctx.kind] || t.subtitles.contact}</p>
              <span aria-hidden className="mt-4 block h-1 w-12 rounded-full bg-gold" />
              <button
                type="button"
                onClick={closeForm}
                aria-label={t.close}
                className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-offwhite/80 transition-colors hover:bg-white/10 hover:text-gold"
              >
                <X size={20} />
              </button>
            </div>

            {status === "success" ? (
              <div className="px-6 py-10 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/20 text-2xl font-bold text-gold">
                  ✓
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-navy">{t.successTitle}</h3>
                <p className="mt-2 text-sm text-charcoal/70">{t.successText}</p>
                <button type="button" onClick={closeForm} className="btn-primary mt-6">
                  {t.close}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4 px-6 py-6">
                <label className={labelCls}>
                  {t.name}
                  <input
                    ref={firstFieldRef}
                    type="text"
                    name="name"
                    autoComplete="name"
                    maxLength={200}
                    value={form.name}
                    onChange={set("name")}
                    className={inputCls}
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelCls}>
                    {t.email}
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      dir="ltr"
                      maxLength={254}
                      value={form.email}
                      onChange={set("email")}
                      className={inputCls}
                    />
                  </label>
                  <label className={labelCls}>
                    {t.phone}
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      dir="ltr"
                      maxLength={40}
                      value={form.phone}
                      onChange={set("phone")}
                      className={inputCls}
                    />
                  </label>
                </div>

                {ctx.kind === "apply" && (
                  <>
                    <div>
                      <span className={labelCls}>{t.cv}</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        name="cv"
                        accept="application/pdf,.pdf"
                        onChange={handleCvChange}
                        className="sr-only"
                        tabIndex={-1}
                      />
                      {cvFile ? (
                        <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-gold/50 bg-gold/10 px-3.5 py-2.5">
                          <FileText size={20} className="shrink-0 text-gold" />
                          <div className="min-w-0 flex-1">
                            <p dir="auto" className="truncate text-sm font-semibold text-navy">{cvFile.name}</p>
                            <p className="text-xs text-charcoal/60">{(cvFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCvFile(null)}
                            aria-label={t.cvRemove}
                            title={t.cvRemove}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-charcoal/60 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-1.5 flex w-full flex-col items-center gap-1 rounded-lg border-2 border-dashed border-charcoal/20 bg-white px-4 py-5 text-center transition-colors hover:border-gold hover:bg-gold/5 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                        >
                          <Upload size={22} className="text-gold" />
                          <span className="text-sm font-semibold text-navy">{t.cvChoose}</span>
                          <span className="text-xs text-charcoal/60">{t.cvHint}</span>
                        </button>
                      )}
                    </div>

                    <label className={labelCls}>
                      {t.link}
                      <input
                        type="url"
                        name="link"
                        dir="ltr"
                        placeholder="https://"
                        maxLength={500}
                        value={form.link}
                        onChange={set("link")}
                        className={inputCls}
                      />
                    </label>
                  </>
                )}

                <label className={labelCls}>
                  {ctx.kind === "apply" ? t.messageApply : t.message}
                  <textarea
                    name="message"
                    rows={4}
                    maxLength={4000}
                    value={form.message}
                    onChange={set("message")}
                    className={`${inputCls} resize-y`}
                  />
                </label>

                {/* honeypot: مخفي عن المستخدمين، البوتات بتملاه */}
                <div aria-hidden="true" className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
                  <label>
                    Website
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={set("website")}
                    />
                  </label>
                </div>

                {error && (
                  <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </p>
                )}

                <button type="submit" disabled={status === "sending"} className="btn-primary w-full justify-center disabled:opacity-60">
                  {status === "sending" ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      {t.sending}
                    </>
                  ) : (
                    <>
                      {t.send}
                      <Send size={16} className="rtl:-scale-x-100" />
                    </>
                  )}
                </button>

                <p className="flex flex-wrap items-center justify-center gap-1.5 text-center text-xs text-charcoal/60">
                  <Mail size={13} />
                  {t.orEmail}
                  <a href={`mailto:${directEmail}`} dir="ltr" className="font-semibold text-navy hover:text-gold">
                    {directEmail}
                  </a>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </ContactFormContext.Provider>
  );
}
