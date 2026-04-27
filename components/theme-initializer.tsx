"use client";

import { useEffect } from "react";

export function ThemeInitializer() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("brainblip-theme") || "light";
    document.documentElement.dataset.theme = savedTheme;
  }, []);

  return null;
}
