"use client";

import { useEffect, useState } from "react";

const THEME_STORAGE_KEY = "quietli-theme";

type Theme = "light" | "dark";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";

  const quietliTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  const oldBrainBlipTheme = window.localStorage.getItem("brainblip-theme");

  if (quietliTheme === "dark" || oldBrainBlipTheme === "dark") {
    return "dark";
  }

  return "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.localStorage.setItem("brainblip-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  const isDark = theme === "dark";

  useEffect(() => {
    const storedTheme = getStoredTheme();

    applyTheme(storedTheme);
    setTheme(storedTheme);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = isDark ? "light" : "dark";

    applyTheme(nextTheme);
    setTheme(nextTheme);
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
          className={`flex h-8 w-14 shrink-0 items-center rounded-full border border-white/30 p-1 transition-colors duration-300 ${
            isDark
              ? "justify-end bg-[#24142f]"
              : "justify-start bg-white/30"
          } ${mounted ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
        >
          <span className="block h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300" />
        </button>
      </div>
    </div>
  );
}