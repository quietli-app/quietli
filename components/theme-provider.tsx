"use client";

import { useEffect } from "react";

export function ThemeProvider() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("brainblip-theme");

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return null;
}