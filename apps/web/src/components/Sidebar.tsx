import clsx from "clsx";
import { NavLink } from "react-router-dom";
import { Avatar } from "./AvatarPresets";
import { useSettingsStore } from "../stores/settings";

const items: { to: string; label: string; icon: string; badge: string | null; preload?: () => Promise<void> }[] = [
  { to: "/", label: "Biblioteca", icon: "library", badge: null },
  { to: "/favorites", label: "Favoritos", icon: "star", badge: null },
  { to: "/pending", label: "Pendientes", icon: "clock", badge: null },
  { to: "/categories", label: "Categorías", icon: "tag", badge: null },
  { to: "/stats", label: "Estadísticas", icon: "chart", badge: null },
  { to: "/achievements", label: "Logros", icon: "trophy", badge: null },
  { to: "/settings", label: "Configuración", icon: "gear", badge: null },
];

function preloadRoute(path: string) {
  const preloads: Record<string, () => Promise<unknown>> = {
    "/": () => import("../routes/Library"),
    "/favorites": () => import("../routes/Library"),
    "/stats": () => import("../routes/Stats"),
    "/achievements": () => import("../routes/Achievements"),
    "/categories": () => import("../routes/Categories"),
    "/pending": () => import("../routes/Pending"),
    "/settings": () => import("../routes/Settings"),
  };
  const preload = preloads[path];
  if (preload) {
    preload().catch(() => {});
  }
}

function Icon({ name }: { name: string }) {
  switch (name) {
    case "library":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
        </svg>
      );
    case "star":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      );
    case "chart":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="20" x2="12" y2="10"/>
          <line x1="18" y1="20" x2="18" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="16"/>
        </svg>
      );
    case "trophy":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
          <path d="M4 22h16"/>
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
        </svg>
      );
    case "tag":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
          <circle cx="7" cy="7" r="1.5"/>
        </svg>
      );
    case "clock":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      );
    case "gear":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      );
    default:
      return null;
  }
}

export function Sidebar() {
  const settings = useSettingsStore((s) => s.settings);
  return (
    <aside className="lg:w-72 md:w-20 shrink-0 border-r border-white/[0.08] bg-ink-900 backdrop-blur-xl px-5 py-6 hidden md:flex md:flex-col relative z-50 md:px-3 md:py-5 lg:px-5 lg:py-6 transition-all duration-300">
      <div className="px-2 pb-8">
        <div className="pl-brand text-2xl font-black tracking-tight flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0 ring-1 ring-white/20 overflow-hidden">
            <img src="/logo.ico" alt="Percy's Library" className="h-full w-full object-cover" />
          </div>
          <span className="hidden lg:inline">Percy&apos;s Library</span>
        </div>
        <div className="pl-brand-sub text-[10px] uppercase tracking-[0.3em] mt-2 font-semibold items-center gap-2 hidden lg:flex">
          <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse"></span>
          Archivo Digital
        </div>
      </div>
      
      {/* Command palette trigger */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("pl-open-palette"))}
        className="mx-2 mb-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
        <span className="flex-1 text-left hidden lg:inline">Buscar...</span>
        <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono hidden lg:inline">Ctrl K</kbd>
      </button>

      <nav className="flex flex-1 flex-col gap-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onMouseEnter={() => preloadRoute(item.to)}
            onFocus={() => preloadRoute(item.to)}
            className={({ isActive }) =>
              clsx(
                "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-300 overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-blue-600/15 to-purple-600/5 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/10"
                  : "text-slate-400 hover:bg-white/[0.06] hover:text-white border border-transparent hover:border-white/[0.08]"
              )
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gradient-to-b from-blue-400 to-purple-500 shadow-[0_0_12px_rgba(59,130,246,0.5)] animate-glow-pulse" />
                )}
                <span className={clsx(
                  "transition-all duration-300 relative z-10",
                  isActive ? "scale-110 text-blue-400" : "group-hover:scale-110 group-hover:text-white"
                )}>
                  <Icon name={item.icon} />
                </span>
                <span className="flex-1 relative z-10 hidden lg:inline">{item.label}</span>
                {item.badge && (
                  <span className="text-xs relative z-10">{item.badge}</span>
                )}
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-transparent pointer-events-none" />
                )}
              </>
            )}
          </NavLink>
        ))}

        <div className="mt-6 px-2">
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent("pl-scan"));
            }}
            className="group w-full flex items-center justify-center lg:justify-start gap-3 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 hover:bg-white/[0.03] transition-all duration-300 border border-white/[0.06] hover:border-indigo-500/20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:rotate-180 duration-500">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
            </svg>
            <span className="hidden lg:inline">Sincronizar</span>
          </button>
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-white/[0.08]">
        <NavLink
          to="/settings/profile"
          className="group flex items-center gap-3 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-3 text-sm text-slate-300 hover:bg-gradient-to-br hover:from-white/[0.06] hover:to-white/[0.02] border border-white/[0.08] hover:border-white/12 transition-all duration-300 hover:shadow-lg hover:shadow-black/20"
        >
          <div className="relative">
            <Avatar value={settings?.avatar ?? null} size={36} className="rounded-xl shadow-lg shadow-black/50 transition-transform group-hover:scale-105 duration-300" fallbackText={`${settings?.userName?.[0] ?? ""}${settings?.userLastName?.[0] ?? ""}`} />
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-ink-800" />
          </div>
          <div className="flex-col min-w-0 hidden lg:flex">
            <span className="truncate font-semibold text-white group-hover:text-blue-400 transition-colors">{settings?.userName?.trim() || "Lector"}</span>
            <span className="text-[10px] text-slate-500 truncate font-medium">Perfil de lector</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300 hidden lg:block">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </NavLink>
      </div>
    </aside>
  );
}
