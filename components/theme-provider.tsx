"use client";

import { useEffect } from "react";
import { applyTheme, getStoredTheme, subscribeToTheme } from "@/lib/theme";

export function ThemeProvider() {
  useEffect(() => {
    function syncTheme() {
      applyTheme(getStoredTheme(), { notify: false });
    }

    syncTheme();

    return subscribeToTheme(syncTheme);
  }, []);

  return null;
}
