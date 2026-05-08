export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "quietli-theme";
export const LEGACY_THEME_STORAGE_KEY = "brainblip-theme";
export const THEME_CHANGE_EVENT = "quietli:themechange";

function normalizeTheme(value: string | null): Theme {
  return value === "dark" ? "dark" : "light";
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";

  try {
    const quietliTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (quietliTheme === "dark" || quietliTheme === "light") {
      return quietliTheme;
    }

    return normalizeTheme(window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY));
  } catch {
    return "light";
  }
}

export function applyTheme(
  theme: Theme,
  options: { persist?: boolean; notify?: boolean } = {}
) {
  if (typeof document === "undefined") return;

  const { persist = true, notify = true } = options;
  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  if (persist && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
      window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, theme);
      document.cookie = `${THEME_STORAGE_KEY}=${theme}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Storage can be unavailable in private or restricted browsing modes.
    }
  }

  if (notify && typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(THEME_CHANGE_EVENT, { detail: { theme } })
    );
  }
}

export function subscribeToTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

export function getServerThemeSnapshot(): Theme {
  return "light";
}
