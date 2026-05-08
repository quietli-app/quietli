"use client";

import { useEffect } from "react";

const THEME_STORAGE_KEY = "quietli-theme";

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

export function ThemeProvider() {
  useEffect(() => {
    const savedTheme =
      localStorage.getItem(THEME_STORAGE_KEY) ||
      localStorage.getItem("brainblip-theme");

    const theme = savedTheme === "dark" ? "dark" : "light";

    applyTheme(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, []);

  return null;
}