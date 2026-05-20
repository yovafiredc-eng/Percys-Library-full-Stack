import { useMemo } from "react";
import type { ComicSummary } from "../lib/api";

interface CollectionViewProps {
  comics: ComicSummary[];
  viewMode: "grid" | "list" | "kanban" | "timeline";
  onModeChange?: (mode: string) => void;
}

export function CollectionViewModes({ viewMode, onModeChange }: Pick<CollectionViewProps, "viewMode" | "onModeChange">) {
  const modes = [
    { id: "grid", label: "Cuadrícula", icon: "⊞" },
    { id: "list", label: "Lista", icon: "☰" },
    { id: "kanban", label: "Kanban", icon: "◻" },
    { id: "timeline", label: "Cronología", icon: "→" },
  ];

  return (
    <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1 inline-flex">
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange?.(mode.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            viewMode === mode.id
              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
              : "text-slate-400 hover:text-slate-300 hover:bg-white/5"
          }`}
          title={mode.label}
        >
          {mode.icon} {mode.label}
        </button>
      ))}
    </div>
  );
}

export function KanbanView({ comics }: Pick<CollectionViewProps, "comics">) {
  const columns = useMemo(() => {
    return {
      "Por Leer": comics.filter((c) => c.currentPage === 0),
      "Leyendo": comics.filter((c) => c.currentPage > 0 && !c.completed),
      "Completados": comics.filter((c) => c.completed),
    };
  }, [comics]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Object.entries(columns).map(([status, items]) => (
        <div key={status} className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 to-blue-500/5 border-b border-white/5 px-4 py-3">
            <h3 className="text-xs font-bold text-white">{status}</h3>
            <p className="text-[10px] text-slate-500 mt-1">{items.length} cómics</p>
          </div>
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {items.map((comic) => (
              <div key={comic.id} className="p-3 bg-white/[0.03] rounded-lg border border-white/5 hover:border-blue-500/30 transition-colors cursor-pointer">
                <div className="text-xs font-semibold text-white truncate">{comic.title}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {Math.round((comic.currentPage / comic.pageCount) * 100)}%
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${(comic.currentPage / comic.pageCount) * 100}%` }} />
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="text-xs text-slate-500 italic text-center py-6">
                Vacío
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimelineView({ comics }: Pick<CollectionViewProps, "comics">) {
  const sorted = useMemo(() => {
    return [...comics]
      .filter((c) => c.completed && c.updatedAt)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);
  }, [comics]);

  return (
    <div className="space-y-4">
      <div className="text-xs font-bold text-slate-400 uppercase">Cómics Completados Recientemente</div>
      <div className="space-y-3">
        {sorted.map((comic, idx) => (
          <div key={comic.id} className="flex gap-4 items-start">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
              {idx < sorted.length - 1 && <div className="w-0.5 h-12 bg-gradient-to-b from-green-500/50 to-transparent" />}
            </div>
            <div className="pt-0.5 pb-3 flex-1">
              <div className="text-sm font-semibold text-white">{comic.title}</div>
              <div className="text-xs text-slate-500 mt-1">
                Completado {new Date(comic.updatedAt).toLocaleDateString("es-ES")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
