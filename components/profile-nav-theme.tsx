"use client";

import { useEffect } from "react";
import { THEME_CHANGE_EVENT } from "@/lib/theme";

type ProfileNavThemeProps = {
  siteBackground: string;
  navBackground?: string;
  darkSiteBackground?: string;
  darkNavBackground?: string;
};

export function ProfileNavTheme({
  siteBackground,
  navBackground = "rgba(255, 255, 255, 0.16)",
  darkSiteBackground = siteBackground,
  darkNavBackground = navBackground,
}: ProfileNavThemeProps) {
  useEffect(() => {
    const root = document.documentElement;

    const previousSiteBg = root.style.getPropertyValue("--site-bg");
    const previousNavBg = root.style.getPropertyValue("--nav-bg");
    const previousMobileMenuBg = root.style.getPropertyValue("--mobile-menu-bg");

    function getCurrentTheme() {
      return root.dataset.theme === "dark" || root.classList.contains("dark")
        ? "dark"
        : "light";
    }

    function applyProfileTheme() {
      const isDark = getCurrentTheme() === "dark";
      const nextSiteBackground = isDark ? darkSiteBackground : siteBackground;
      const nextNavBackground = isDark ? darkNavBackground : navBackground;

      root.style.setProperty("--site-bg", nextSiteBackground);
      root.style.setProperty("--nav-bg", nextNavBackground);

      /*
        This makes the mobile dropdown feel like a glass panel sitting on top
        of the selected profile theme.
      */
      root.style.setProperty("--mobile-menu-bg", nextSiteBackground);
    }

    applyProfileTheme();

    window.addEventListener(THEME_CHANGE_EVENT, applyProfileTheme);
    window.addEventListener("storage", applyProfileTheme);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, applyProfileTheme);
      window.removeEventListener("storage", applyProfileTheme);

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

      if (previousMobileMenuBg) {
        root.style.setProperty("--mobile-menu-bg", previousMobileMenuBg);
      } else {
        root.style.removeProperty("--mobile-menu-bg");
      }
    };
  }, [siteBackground, navBackground, darkSiteBackground, darkNavBackground]);

  return null;
}
