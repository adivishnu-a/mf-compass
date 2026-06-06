export type Theme = "light" | "dark" | "system";

export const THEME_KEY = "mfc:theme";
export const COOKIE_KEY = "theme";

export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }
  return "system";
}

export function setTheme(theme: Theme) {
  if (typeof window === "undefined") return;

  // Save to localStorage
  localStorage.setItem(THEME_KEY, theme);

  // Save to cookie for SSR (expires in 1 year)
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_KEY}=${theme}; path=/; max-age=${maxAge}; SameSite=Lax`;

  // Apply to documentElement
  const root = document.documentElement;
  const resolved = theme === "system" ? getSystemTheme() : theme;

  if (resolved === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
}
