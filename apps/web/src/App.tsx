import { useEffect, useState, lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, NavLink } from "react-router-dom";
import clsx from "clsx";
import { Sidebar } from "./components/Sidebar";
import { Toaster } from "./components/Toaster";
import { ThemeProvider } from "./components/ThemeProvider";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { CelebrationOverlay } from "./components/CelebrationOverlay";
import { ConfettiOverlay } from "./components/Confetti";
import { CommandPalette } from "./components/CommandPalette";
import { useSettingsStore } from "./stores/settings";
import { useLibraryStore } from "./stores/library";
import { useToasts } from "./stores/toasts";
import { api } from "./lib/api";

const Library = lazy(() => import("./routes/Library").then(m => ({ default: m.Library as any })));
const Reader = lazy(() => import("./routes/Reader").then(m => ({ default: m.Reader as any })));
const Stats = lazy(() => import("./routes/Stats").then(m => ({ default: m.Stats as any })));
const Achievements = lazy(() => import("./routes/Achievements").then(m => ({ default: m.Achievements as any })));
const Categories = lazy(() => import("./routes/Categories").then(m => ({ default: m.Categories as any })));
const Pending = lazy(() => import("./routes/Pending").then(m => ({ default: m.Pending as any })));
const Settings = lazy(() => import("./routes/Settings").then(m => ({ default: m.Settings as any })));
const Welcome = lazy(() => import("./routes/Welcome").then(m => ({ default: m.Welcome as any })));

function LibraryWrapper({ scope }: { scope: "all" | "favorites" }) {
  const Component = Library as React.ComponentType<{ scope?: "all" | "favorites" }>;
  return <Component scope={scope} />;
}

export function App() {
  const loadSettings = useSettingsStore((s) => s.load);
  const settings = useSettingsStore((s) => s.settings);
  const scan = useLibraryStore((s) => s.scan);
  const push = useToasts((s) => s.push);
  const location = useLocation();
  const navigate = useNavigate();
  const isReader = location.pathname.startsWith("/read/");
  const isWelcome = location.pathname === "/welcome";
  const animationsEnabled = useSettingsStore((s) => s.settings?.animationsEnabled ?? true);
  const neonMode = useSettingsStore((s) => s.settings?.neonMode ?? false);
  const [knownAchievements, setKnownAchievements] = useState<string[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confettiActive, setConfettiActive] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const confettiEnabled = useSettingsStore((s) => s.settings?.confettiOnComplete ?? false);
  // achievements api will be imported dynamically inside the effect

  useEffect(() => {
    if (!settings?.hasOnboarded) setKnownAchievements([]);
  }, [settings?.hasOnboarded]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  // Command Palette shortcut: Ctrl+K / Cmd+K + custom event from sidebar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    function onOpenPalette() { setPaletteOpen(true); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("pl-open-palette" as any, onOpenPalette);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pl-open-palette" as any, onOpenPalette);
    };
  }, []);

  useEffect(() => {
    function isFileDrag(event: DragEvent) {
      return Array.from(event.dataTransfer?.types ?? []).includes("Files");
    }

    function onDragEnter(event: DragEvent) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
    }

    function onDragOver(event: DragEvent) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
    }

    function onDrop(event: DragEvent) {
      if (!isFileDrag(event)) return;
      event.preventDefault();
    }

    const options = { capture: true } as const;
    document.addEventListener("dragenter", onDragEnter, options);
    document.addEventListener("dragover", onDragOver, options);
    document.addEventListener("drop", onDrop, options);
    return () => {
      document.removeEventListener("dragenter", onDragEnter, options);
      document.removeEventListener("dragover", onDragOver, options);
      document.removeEventListener("drop", onDrop, options);
    };
  }, []);

  // Onboarding gate: first-time users (no settings or hasOnboarded=false)
  // are routed to the welcome screen. We wait for settings to load so we
  // never bounce a returning user away from a deep link on a slow request.
  useEffect(() => {
    if (!settings) return;
    if (!settings.hasOnboarded && !isWelcome) {
      if (settings.userName.trim() || settings.userLastName?.trim() || settings.avatar) {
        void useSettingsStore.getState().update({ hasOnboarded: true });
        return;
      }
      navigate("/welcome", { replace: true });
    }
  }, [settings, isWelcome, navigate]);

  useEffect(() => {
    if (!settings?.hasOnboarded) return; // don't poke the library before onboarding
    const handler = async () => {
      try {
        const r = await scan();
        if (r.added === 0 && r.removed === 0) return; // no-op scans stay silent
        const parts: string[] = [];
        if (r.added) parts.push(`+${r.added}`);
        if (r.removed) parts.push(`-${r.removed}`);
        push(`Biblioteca sincronizada · ${parts.join(" · ")}`, "success");
      } catch {
        push("Error al sincronizar la biblioteca", "error");
      }
    };
    window.addEventListener("pl-scan", handler);
    return () => window.removeEventListener("pl-scan", handler);
  }, [scan, push, settings?.hasOnboarded]);

  // Poll achievements and show a toast when new ones unlock. Multiple
  // simultaneous unlocks (e.g. on first scan) are merged into a single
  // toast so the user sees one celebratory notification rather than a
  // wall of them. Skipped while the user is still on the welcome screen
  // so the achievements feed doesn't fire under a half-built profile.
  useEffect(() => {
    if (!settings?.hasOnboarded) return;
    let cancelled = false;
    async function fetchOnce() {
      try {
        const list = await api.achievements();
        if (cancelled) return;
        const unlocked = list.filter((a) => a.unlocked).map((a) => a.id);
        if (knownAchievements.length === 0) {
          // First fill — establish baseline silently so reloading the
          // app doesn't fire dozens of "achievement unlocked" toasts.
          setKnownAchievements(unlocked);
          return;
        }
        const known = new Set(knownAchievements);
        const fresh = unlocked.filter((id) => !known.has(id));
        if (fresh.length === 1) {
          const a = list.find((x) => x.id === fresh[0]);
          if (a) push(`Logro · ${a.title}`, "success");
        } else if (fresh.length > 1) {
          push(`${fresh.length} logros desbloqueados`, "success");
        }
        setKnownAchievements(unlocked);
      } catch {
        // ignore polling errors
      }
    }
    void fetchOnce();
    const iv = setInterval(() => void fetchOnce(), 20_000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [knownAchievements, push, settings?.hasOnboarded]);

  // Celebration overlay when a comic is marked as completed
  useEffect(() => {
    function onCelebration() {
      setShowCelebration(true);
      if (confettiEnabled) {
        setConfettiActive(true);
        setTimeout(() => setConfettiActive(false), 3500);
      }
    }
    window.addEventListener("pl-celebrate", onCelebration);
    return () => window.removeEventListener("pl-celebrate", onCelebration);
  }, [confettiEnabled]);

  if (isWelcome && settings?.hasOnboarded) {
    return <Navigate to="/" replace />;
  }

  const routeFallback = (
    <div className="flex h-full min-h-[200px] w-full items-center justify-center bg-[#04050b]">
      <div
        className="h-9 w-9 rounded-full border-2 border-lime-400/25 border-t-lime-400 animate-spin"
        aria-hidden
      />
    </div>
  );

  if (isWelcome) {
    return (
      <ThemeProvider>
        <div data-anim={animationsEnabled ? "1" : "0"} data-neon={neonMode ? "1" : "0"} className="h-full w-full">
          <Suspense fallback={routeFallback}>
            <Routes>
              <Route path="/welcome" element={<Welcome />} />
            </Routes>
          </Suspense>
        </div>
        <Toaster />
        <ConfettiOverlay active={confettiActive} />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </ThemeProvider>
    );
  }

  if (isReader) {
    return (
      <ThemeProvider>
        <div data-anim={animationsEnabled ? "1" : "0"} data-neon={neonMode ? "1" : "0"} className="h-full w-full">
          <Suspense fallback={routeFallback}>
            <Routes>
              <Route path="/read/:id" element={<Reader />} />
            </Routes>
          </Suspense>
        </div>
        <Toaster />
        <ConfettiOverlay active={confettiActive} />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div data-anim={animationsEnabled ? "1" : "0"} data-neon={neonMode ? "1" : "0"} className="flex h-screen w-screen overflow-hidden bg-transparent text-ink-100">
        <Sidebar />
        <main className="flex-1 overflow-hidden relative pb-16 md:pb-0">
          <ErrorBoundary>
            <div key={location.pathname} className="h-full w-full animate-fade-in overflow-hidden flex flex-col">
              <Suspense fallback={routeFallback}>
                <Routes location={location}>
                  <Route path="/" element={<LibraryWrapper scope="all" />} />
                  <Route path="/favorites" element={<LibraryWrapper scope="favorites" />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/pending" element={<Pending />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/settings/*" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </div>
          </ErrorBoundary>
        </main>
        <MobileNav />
        <Toaster />
        <CelebrationOverlay show={showCelebration} onDone={() => setShowCelebration(false)} />
        <ConfettiOverlay active={confettiActive} />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      </div>
    </ThemeProvider>
  );
}

const mobilePreload = (path: string) => {
  const preloads: Record<string, () => Promise<unknown>> = {
    "/": () => import("./routes/Library"),
    "/favorites": () => import("./routes/Library"),
    "/stats": () => import("./routes/Stats"),
    "/achievements": () => import("./routes/Achievements"),
    "/categories": () => import("./routes/Categories"),
    "/pending": () => import("./routes/Pending"),
    "/settings/profile": () => import("./routes/Settings"),
  };
  preloads[path]?.().catch(() => {});
};

function MobileNav() {
  const items: { to: string; label: string; icon: React.ReactNode; aria: string }[] = [
    { to: "/", label: "Biblioteca", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>, aria: "Ir a Biblioteca" },
    { to: "/favorites", label: "Favoritos", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.5l3 6.5 7 .9-5.2 4.7 1.5 7-6.3-3.6-6.3 3.6 1.5-7L2 9.9l7-.9z"/></svg>, aria: "Ir a Favoritos" },
    { to: "/pending", label: "Pendientes", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, aria: "Ir a Pendientes" },
    { to: "/categories", label: "Categorías", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>, aria: "Ir a Categorías" },
    { to: "/stats", label: "Estadísticas", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>, aria: "Ir a Estadísticas" },
    { to: "/achievements", label: "Logros", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/></svg>, aria: "Ir a Logros" },
    { to: "/settings/profile", label: "Configuración", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>, aria: "Ir a Configuración" },
  ];
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-gradient-to-t from-black/95 via-black/90 to-black/80 backdrop-blur-2xl border-t border-white/[0.06] px-2 py-2 flex items-center justify-around pb-safe" aria-label="Navegación principal">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          onMouseEnter={() => mobilePreload(item.to)}
          onPointerDown={(e) => e.button === 0 && mobilePreload(item.to)}
          aria-label={item.aria}
          className={({ isActive }) =>
            clsx(
              "flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-300 relative group min-w-[44px]",
              isActive
                ? "text-blue-400"
                : "text-slate-500 hover:text-slate-300 active:scale-95"
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className={clsx("transition-all duration-300", isActive ? "scale-110" : "group-hover:scale-105")} aria-hidden="true">{item.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-wide">{item.label}</span>
              {isActive && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
