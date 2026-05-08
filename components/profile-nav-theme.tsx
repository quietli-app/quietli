"use client";

import { useEffect } from "react";

type ProfileNavThemeProps = {
  siteBackground: string;
  navBackground?: string;
};

export function ProfileNavTheme({
  siteBackground,
  navBackground = "rgba(255, 255, 255, 0.16)",
}: ProfileNavThemeProps) {
  useEffect(() => {
    const root = document.documentElement;

    const previousSiteBg = root.style.getPropertyValue("--site-bg");
    const previousNavBg = root.style.getPropertyValue("--nav-bg");
    const previousMobileMenuBg = root.style.getPropertyValue("--mobile-menu-bg");

    root.style.setProperty("--site-bg", siteBackground);
    root.style.setProperty("--nav-bg", navBackground);

    /*
      This makes the mobile dropdown feel like a lighter glass panel
      sitting on top of the selected profile theme.
    */
    root.style.setProperty("--mobile-menu-bg", siteBackground);

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

      if (previousMobileMenuBg) {
        root.style.setProperty("--mobile-menu-bg", previousMobileMenuBg);
      } else {
        root.style.removeProperty("--mobile-menu-bg");
      }
    };
  }, [siteBackground, navBackground]);

  return null;
}