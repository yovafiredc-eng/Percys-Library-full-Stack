import { useEffect, useState } from "react";
import { useSettingsStore } from "../stores/settings";

export function ThemeModeToggle() {
  const [mounted, setMounted] = useState(false);
  const theme = useSettingsStore((s) => s.settings?.theme ?? "auto");
  const updateSettings = useSettingsStore((s) => s.update);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : theme === "light" ? "auto" : "dark";
    updateSettings({ theme: nextTheme });
    applyTheme(nextTheme);
  };

  const getIcon = () => {
    if (theme === "light") return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
    if (theme === "dark") return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
  };

  const getLabel = () => {
    if (theme === "light") return "Claro";
    if (theme === "dark") return "Oscuro";
    return "Auto";
  };

  return (
    <button
      onClick={toggleTheme}
      title={`Tema: ${getLabel()} (pulsa para cambiar)`}
      className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all"
      aria-label="Cambiar tema"
    >
      {getIcon()}
    </button>
  );
}

export function applyTheme(theme: "dark" | "light" | "auto") {
  const root = document.documentElement;
  const isDark = theme === "dark" || (theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.style.colorScheme = isDark ? "dark" : "light";
  
  // Update body background for transition
  if (isDark) {
    root.classList.add("dark");
    root.style.backgroundColor = "#0f0f12";
  } else {
    root.classList.remove("dark");
    root.style.backgroundColor = "#ffffff";
  }
}
