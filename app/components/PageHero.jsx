// app/components/PageHero.jsx
//
// هيرو موحّد لصفحات الموقع الداخلية (الخدمات، تفاصيل الخدمة، الوظائف):
// خلفية Navy متدرجة + نقاط + هالات ملونة. لو مرّرت `visual` بيتحط في عمود جنب النص.

export default function PageHero({ back, badge, title, text, icon, visual, bgImage, children }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-[#15406E] text-offwhite">
      {bgImage && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${bgImage}")` }}
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-navy/60 via-navy/35 to-navy/65" />
        </>
      )}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute -top-32 end-[-4rem] h-80 w-80 rounded-full bg-sky/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-[-6rem] start-[-3rem] h-72 w-72 rounded-full bg-gold/15 blur-3xl" />

      <div
        className={`container-content relative py-16 md:py-24 ${
          visual ? "grid items-center gap-12 md:grid-cols-2 md:gap-16" : ""
        }`}
      >
        <div>
          {back}
          {icon && (
            <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold text-navy shadow-lg shadow-gold/20">
              {icon}
            </span>
          )}
          {badge && (
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {badge}
            </span>
          )}
          <h1 className="mt-6 max-w-2xl font-display text-4xl font-bold leading-tight md:text-5xl">
            {title}
          </h1>
          {text && <p className="mt-4 max-w-xl leading-relaxed text-offwhite/75">{text}</p>}
          {children}
        </div>

        {visual && <div className="relative">{visual}</div>}
      </div>
    </section>
  );
}