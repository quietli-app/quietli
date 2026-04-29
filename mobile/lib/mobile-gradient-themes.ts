import type { LinearGradientProps } from "expo-linear-gradient";

export type GradientTheme = "blush" | "violet" | "sky" | "mint" | "sunset";

type MobileGradientTheme = {
  colors: LinearGradientProps["colors"];
  start: LinearGradientProps["start"];
  end: LinearGradientProps["end"];
};

export const mobileGradientThemes: Record<GradientTheme, MobileGradientTheme> = {
  blush: {
    colors: ["#C6426E", "#642B73"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  violet: {
    colors: ["#642B73", "#3A1C71"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  sky: {
    colors: ["#76D7EA", "#7F7FD5"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  mint: {
    colors: ["#7DD8C5", "#56AB91"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  sunset: {
    colors: ["#F59E8B", "#C6426E"],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

export function getMobileGradientTheme(theme?: string | null) {
  if (
    theme === "blush" ||
    theme === "violet" ||
    theme === "sky" ||
    theme === "mint" ||
    theme === "sunset"
  ) {
    return mobileGradientThemes[theme];
  }

  return mobileGradientThemes.blush;
}