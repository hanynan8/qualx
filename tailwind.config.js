/** @type {import('tailwindcss').Config} */
module.exports = {
  // 🐛 BUGFIX: كان فيه سطر "./components/**/*.{js,jsx}" هنا، لكن مفيش
  // مجلد components/ على مستوى الروت في المشروع — الكومبوننتس فعليًا جوه
  // app/components/ ومغطاة أصلًا بالسطر اللي تحت. السطر الميت ده كان
  // بقايا من هيكل قديم للمشروع (زي اللي في components.zip).
  content: [
    "./app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // merlix brand palette — Palette 1 (Navy + Sky Blue + Gold)
        navy: "#0B1F3A",
        sky: "#1E9BC6",
        gold: "#C9A227",
        offwhite: "#F5F6F8",
        charcoal: "#2D3436",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1180px",
      },
    },
  },
  plugins: [],
};