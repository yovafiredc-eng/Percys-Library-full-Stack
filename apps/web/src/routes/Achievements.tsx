import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { api, type AchievementDto } from "../lib/api";

const GROUP_LABELS: Record<AchievementDto["group"], string> = {
  milestones: "Hitos",
  pages: "Páginas",
  streaks: "Rachas",
  favorites: "Favoritos",
  library: "Biblioteca",
  modes: "Modos",
  formats: "Formatos",
  categories: "Categorías",
  series: "Series",
  exploration: "Exploración",
  secret: "Secretos",
};

const GROUP_ORDER: AchievementDto["group"][] = [
  "milestones",
  "pages",
  "streaks",
  "favorites",
  "library",
  "categories",
  "formats",
  "modes",
  "series",
  "exploration",
  "secret",
];

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "unlocked", label: "Desbloqueados" },
  { id: "locked", label: "Bloqueados" },
] as const;

type Filter = (typeof FILTERS)[number]["id"];

export function Achievements() {
  const [items, setItems] = useState<AchievementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  useEffect(() => {
    void api.achievements().then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const visible = useMemo(() => {
    if (filter === "unlocked") return items.filter((a) => a.unlocked);
    if (filter === "locked") return items.filter((a) => !a.unlocked);
    return items;
  }, [items, filter]);

  const grouped = useMemo(() => {
    const m = new Map<AchievementDto["group"], AchievementDto[]>();
    for (const a of visible) {
      const g = m.get(a.group) ?? [];
      g.push(a);
      m.set(a.group, g);
    }
    return GROUP_ORDER.filter((g) => m.has(g)).map(
      (g) => [g, m.get(g)!] as const,
    );
  }, [visible]);

  const total = items.length;
  const unlockedCount = items.filter((a) => a.unlocked).length;
  const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  if (loading) {
    return <AchievementsSkeleton />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-10 pl-gradient-bg">
      <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-white">Logros</h1>
            <p className="text-slate-400 font-medium">
              Has desbloqueado {unlockedCount} de {total} hitos ({pct}%)
            </p>
          </div>
          <div className="w-full md:w-80 space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
              <span>Progreso total</span>
              <span>{pct}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/5 border border-white/5 overflow-hidden p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_12px_rgba(59,130,246,0.4)] transition-all duration-1000 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </header>

        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/[0.02] border border-white/5 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={clsx(
                "px-5 py-2 rounded-xl text-xs font-bold transition-all",
                filter === f.id ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-12">
          {grouped.map(([group, list]) => (
            <section key={group} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <h2 className="text-xl font-bold text-white tracking-tight">{GROUP_LABELS[group]}</h2>
                <span className="px-2 py-0.5 rounded-lg bg-white/5 text-[10px] font-bold text-slate-500 border border-white/5">
                  {list.filter((a) => a.unlocked).length} / {list.length}
                </span>
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {list.map((a) => (
                  <AchievementCard key={a.id} a={a} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ a }: { a: AchievementDto }) {
  const isSecret = a.secret && !a.unlocked;
  
  return (
    <div
      className={clsx(
        "pl-card p-5 group transition-all duration-300 relative overflow-hidden",
        a.unlocked 
          ? "bg-gradient-to-br from-blue-600/10 to-transparent border-blue-500/30 shadow-lg shadow-blue-600/5" 
          : "opacity-40 grayscale-[0.5] hover:opacity-60"
      )}
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className={clsx(
              "h-10 w-10 rounded-xl flex items-center justify-center text-xl shadow-inner border transition-all",
              a.unlocked 
                ? "bg-blue-600/20 border-blue-400/30 text-blue-400 scale-110 rotate-3" 
                : "bg-white/5 border-white/5 text-slate-500"
            )}>
              {isSecret ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> : a.unlocked ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/></svg>}
            </div>
            <div>
              <h3 className="font-bold text-white leading-none">{isSecret ? "Logro Secreto" : a.title}</h3>
              <div className="mt-1.5 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={clsx(
                      "h-1 w-3 rounded-full transition-colors",
                      i < a.tier 
                        ? (a.unlocked ? "bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]" : "bg-slate-600") 
                        : "bg-white/5"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-slate-400 font-medium leading-relaxed flex-1">
          {isSecret ? "Sigue explorando para descubrir este hito oculto." : a.description}
        </p>

        {a.unlocked && (
          <div className="mt-4 pt-3 border-t border-blue-500/10 flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Desbloqueado</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="text-blue-500"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
        )}
      </div>
      
      {/* Decorative background glow for unlocked items */}
      {a.unlocked && (
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-600/10 blur-3xl pointer-events-none" />
      )}
    </div>
  );
}

function SkeletonPulse({ className }: { className?: string }) {
  return <div className={clsx("animate-pulse bg-white/[0.05] rounded-xl", className)} />;
}

function AchievementsSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-10">
      <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <SkeletonPulse className="h-10 w-32" />
            <SkeletonPulse className="h-4 w-56" />
          </div>
          <div className="w-full md:w-80 space-y-2">
            <SkeletonPulse className="h-3 w-full" />
            <SkeletonPulse className="h-3 w-full rounded-full" />
          </div>
        </header>

        <SkeletonPulse className="h-10 w-64 rounded-2xl" />

        <div className="space-y-12">
          {Array.from({ length: 4 }).map((_, gi) => (
            <section key={gi} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <SkeletonPulse className="h-6 w-32" />
                <SkeletonPulse className="h-5 w-16 rounded-lg" />
              </div>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, ci) => (
                  <div key={ci} className="pl-card p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <SkeletonPulse className="h-10 w-10 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <SkeletonPulse className="h-4 w-32" />
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <SkeletonPulse key={i} className="h-1 w-3 rounded-full" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <SkeletonPulse className="h-3 w-full" />
                    <SkeletonPulse className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
