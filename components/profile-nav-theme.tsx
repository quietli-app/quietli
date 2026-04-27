"use client";

import { useEffect } from "react";

type ProfileNavThemeProps = {
  navBackground: string;
};

export function ProfileNavTheme({ navBackground }: ProfileNavThemeProps) {
  useEffect(() => {
    document.documentElement.style.setProperty("--nav-bg", navBackground);

    return () => {
      document.documentElement.style.removeProperty("--nav-bg");
    };
  }, [navBackground]);

  return null;
}