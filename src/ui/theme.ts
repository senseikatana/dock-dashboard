export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "dock:theme";

export function readTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

export function applyTheme(theme: ThemeMode): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");

  function resolve() {
    const mode =
      theme === "system" ? (media.matches ? "dark" : "light") : theme;
    document.documentElement.dataset.theme = mode;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", mode === "dark" ? "#1b1714" : "#e8e4dc");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }

  resolve();
  media.addEventListener("change", resolve);
  return () => media.removeEventListener("change", resolve);
}
