"use client";

import { useEffect, useState } from "react";

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  localStorage.setItem("brainblip-theme", isDark ? "dark" : "light");
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("brainblip-theme");
    const shouldBeDark = saved === "dark";

    applyTheme(shouldBeDark);
    setIsDark(shouldBeDark);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    applyTheme(next);
  }

  if (!mounted) {
    return null;
  }

  return (
    <div className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 backdrop-blur-xl">
      <p className="mb-2 text-xl font-bold text-white">Site settings</p>
      <p className="mb-4 text-base text-slate-100">
        Toggle a darker sitewide viewing mode.
      </p>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">Dark mode</span>

        <button
          type="button"
          onClick={toggleTheme}
          aria-pressed={isDark}
          aria-label="Toggle dark mode"
          className="relative h-8 w-14 rounded-full border border-white/30 transition-colors duration-300"
          style={{
            backgroundColor: isDark
              ? "#2a1833"
              : "rgba(255, 255, 255, 0.3)",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: isDark ? "28px" : "4px",
              width: "24px",
              height: "24px",
              borderRadius: "9999px",
              backgroundColor: "white",
              transform: "translateY(-50%)",
              transition: "left 0.25s ease",
            }}
          />
        </button>
      </div>
    </div>
  );
}