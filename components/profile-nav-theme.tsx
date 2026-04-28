"use client";

import { useEffect } from "react";

type ProfileNavThemeProps = {
  siteBackground: string;
  navBackground?: string;
};

export function ProfileNavTheme({
  siteBackground,
  navBackground = "rgba(255, 255, 255, 0.10)",
}: ProfileNavThemeProps) {
  useEffect(() => {
    const root = document.documentElement;

    const previousSiteBg = root.style.getPropertyValue("--site-bg");
    const previousNavBg = root.style.getPropertyValue("--nav-bg");

    root.style.setProperty("--site-bg", siteBackground);
    root.style.setProperty("--nav-bg", navBackground);

    return () => {
      if (previousSiteBg) {
        root.style.setProperty("--site-bg", previousSiteBg);
      } else {
        root.style.removeProperty("--site-bg");
      }

      if (previousNavBg) {
        root.style.setProperty("--nav-bg", previousNavBg);
      } else {
        root.style.removeProperty("--nav-bg");
      }
    };
  }, [siteBackground, navBackground]);

  return null;
}