"use client";

import { useSyncExternalStore } from "react";
import {
  applyTheme,
  getServerThemeSnapshot,
  getStoredTheme,
  subscribeToTheme,
} from "@/lib/theme";
import type { Theme } from "@/lib/theme";

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getStoredTheme,
    getServerThemeSnapshot
  );

  const isDark = theme === "dark";

  function toggleTheme() {
    const nextTheme: Theme = isDark ? "light" : "dark";

    applyTheme(nextTheme);
  }

  return (
    <div className="rounded-[1.5rem] border border-white/20 bg-white/20 p-5 text-white backdrop-blur-xl">
      <p className="mb-2 text-xl font-bold text-white">Site settings</p>

      <p className="mb-4 text-base text-white/75">
        Toggle a darker viewing mode across Quietli.
      </p>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-white/85">Dark mode</span>

        <button
          type="button"
          onClick={toggleTheme}
          role="switch"
          aria-checked={isDark}
          aria-label="Toggle dark mode"
          className={`flex h-8 w-14 shrink-0 items-center rounded-full border border-white/30 p-1 transition-colors duration-300 ${
            isDark
              ? "justify-end bg-[#24142f]"
              : "justify-start bg-white/30"
          } cursor-pointer`}
        >
          <span className="block h-6 w-6 rounded-full bg-white shadow-md transition-all duration-300" />
        </button>
      </div>
    </div>
  );
}
