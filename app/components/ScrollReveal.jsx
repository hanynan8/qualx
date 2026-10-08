// app/components/ScrollReveal.jsx
"use client";

import { useLayoutEffect } from "react";

/**
 * ScrollReveal — نظام ظهور/اختفاء عند السكرول لكل الأقسام والـ divs.
 *
 * بيشتغل مرة واحدة من الـ layout، من غير ما نعدّل أي صفحة:
 *  1) بيمشي على محتوى <main> و<footer> ويحط data-reveal على الأقسام والبلوكات.
 *  2) IntersectionObserver بيضيف data-in لما العنصر يدخل الشاشة، ويشيله لما يخرج
 *     (فالعنصر بيظهر وهو قدامك ويختفي لما تبعد عنه).
 *  3) MutationObserver بيلقط المحتوى اللي بيتحمّل لاحقًا (بيانات من الـ API / تغيير صفحة).
 *
 * ملحوظة: بنستخدم data-attributes مش classes، لأن React بيعيد كتابة className
 * عند أي re-render وكان هيمسح الحالة.
 * الحركة نفسها في globals.css (خصائص translate/scale المستقلة عن transform
 * عشان متتعارضش مع hover:-translate-y الموجودة في الكروت).
 */

const BLOCK_TAGS = new Set([
  "DIV", "LI", "ARTICLE", "ASIDE", "FIGURE", "FORM", "TABLE",
  "BLOCKQUOTE", "DETAILS", "H1", "H2", "H3", "H4", "H5", "H6", "P", "A", "IMG",
]);
const TEXT_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6", "P", "FORM", "TABLE", "FIGURE", "IMG"]);
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "SVG", "PATH", "NOSCRIPT", "INPUT", "SELECT", "TEXTAREA", "BUTTON", "NAV", "HEADER", "DIALOG"]);
const MAX_STAGGER = 8; // أقصى عدد عناصر بيتأخر ظهورها تدريجيًا
const STAGGER_MS = 120;

function isDecorative(el, cs) {
  if (el.getAttribute("aria-hidden") === "true") return true;
  if (cs.pointerEvents === "none") return true;
  if (cs.position === "absolute" || cs.position === "fixed" || cs.position === "sticky") return true;
  return false;
}

function tagTree(root, io) {
  if (!root || root.nodeType !== 1) return;

  const walk = (el, depth, index) => {
    if (SKIP_TAGS.has(el.tagName.toUpperCase())) return;
    if (el.hasAttribute("data-no-reveal")) return;

    const cs = getComputedStyle(el);
    if (cs.display === "none") return;

    const isSection = el.tagName === "SECTION";
    const isWrapper =
      el.classList.contains("container-content") || el.tagName === "UL" || el.tagName === "OL";

    let tagged = false;
    let nextDepth = depth;

    if (!isWrapper && (isSection || BLOCK_TAGS.has(el.tagName))) {
      const parent = el.parentElement;
      const pcs = parent ? getComputedStyle(parent) : null;
      const parentIsLayout =
        !parent ||
        parent.tagName === "SECTION" ||
        parent.tagName === "MAIN" ||
        parent.tagName === "FOOTER" ||
        parent.tagName === "UL" ||
        parent.tagName === "OL" ||
        parent.classList.contains("container-content") ||
        (pcs && (pcs.display.includes("grid") || pcs.display.includes("flex")));

      const okByRule = isSection || TEXT_TAGS.has(el.tagName) || parentIsLayout;
      const okByDisplay = cs.display !== "inline" && cs.display !== "contents";

      if (okByRule && okByDisplay && !isDecorative(el, cs) && depth < 3) {
        if (!el.hasAttribute("data-reveal")) {
          const variant = isSection
            ? "section"
            : el.tagName === "IMG"
              ? "zoom"
              : depth === 0
                ? "up"
                : "soft";
          el.setAttribute("data-reveal", variant);
          el.style.setProperty("--rv-d", `${Math.min(index, MAX_STAGGER) * STAGGER_MS}ms`);
          io.observe(el);
        }
        tagged = true;
        nextDepth = isSection ? 0 : depth + 1;
      }
    }

    // خط الزينة تحت العناوين (span display:block صغير) → بيتمدد من البداية
    if (!tagged && el.tagName === "SPAN" && cs.display === "block") {
      const h = parseFloat(cs.height);
      if (h > 0 && h <= 8 && !el.hasAttribute("data-reveal")) {
        el.setAttribute("data-reveal", "line");
        el.style.setProperty("--rv-d", "200ms");
        io.observe(el);
      }
      return;
    }

    let i = 0;
    for (const child of el.children) {
      walk(child, nextDepth, tagged || isWrapper ? i : index);
      i += 1;
    }
  };

  walk(root, 0, 0);
}

export default function ScrollReveal() {
  useLayoutEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.setAttribute("data-in", "");
          else entry.target.removeAttribute("data-in");
        }
      },
      // العنصر "قدامك" لما أي جزء منه يدخل المنطقة الوسطى من الشاشة
      { rootMargin: "-8% 0px -8% 0px", threshold: 0 },
    );

    const roots = () => document.querySelectorAll("main, footer");
    const run = () => roots().forEach((r) => tagTree(r, io));
    run();

    let raf = 0;
    const mo = new MutationObserver((mutations) => {
      // نتجاهل التغييرات اللي إحنا عملناها (attributes) ونراقب إضافة عناصر جديدة بس
      if (!mutations.some((m) => m.addedNodes.length)) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(run);
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      io.disconnect();
    };
  }, []);

  return null;
}