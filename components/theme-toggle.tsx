"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("brainblip-theme");
    const dark = savedTheme === "dark";

    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextDark = !isDark;

    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    localStorage.setItem("brainblip-theme", nextDark ? "dark" : "light");
  }

  return (
    <div className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 text-white backdrop-blur-xl">
      <p className="mb-2 text-xl font-bold text-white">Site settings</p>

      <p className="mb-4 text-base text-white/75">
        Toggle a darker sitewide viewing mode.
      </p>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-white/85">Dark mode</span>

        <button
          type="button"
          onClick={toggleTheme}
          aria-pressed={isDark}
          aria-label="Toggle dark mode"
          disabled={!mounted}
          className={`relative h-8 w-14 rounded-full border border-white/30 transition-colors duration-300 ${
            isDark ? "bg-[#2a1833]" : "bg-white/30"
          } ${mounted ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-transform duration-300 ${
              isDark ? "translate-x-7" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}