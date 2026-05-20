import { useState, useMemo, useRef, useEffect } from "react";
import { AnimatedModal } from "./AnimatedModal";

interface Props {
  open: boolean;
  onClose: () => void;
  comicTitle: string;
  currentCategories: string[];
  allCategories: string[];
  onAdd: (category: string) => void;
  onRemove: (category: string) => void;
  onCreate?: (name: string) => void;
}

const PRESET_COLORS = [
  "#f43f5e", "#3b82f6", "#10b981", "#a855f7", "#f59e0b",
  "#6366f1", "#ec4899", "#22d3ee", "#ef4444", "#84cc16",
  "#64748b", "#d946ef", "#f97316", "#14b8a6", "#8b5cf6",
];

export function CategoryPicker({
  open,
  onClose,
  comicTitle,
  currentCategories,
  allCategories,
  onAdd,
  onRemove,
  onCreate,
}: Props) {
  const [filter, setFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFilter("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const normalizedFilter = filter.trim().toLowerCase();

  const existing = useMemo(() => {
    const set = new Set(currentCategories.map((c) => c.toLowerCase()));
    return allCategories
      .filter((c) => !set.has(c.toLowerCase()))
      .filter((c) => !normalizedFilter || c.toLowerCase().includes(normalizedFilter))
      .sort((a, b) => a.localeCompare(b));
  }, [allCategories, currentCategories, normalizedFilter]);

  const canCreate =
    normalizedFilter.length > 0 &&
    !allCategories.some((c) => c.toLowerCase() === normalizedFilter) &&
    !currentCategories.some((c) => c.toLowerCase() === normalizedFilter);

  return (
    <AnimatedModal
      open={open}
      onClose={onClose}
      panelClassName="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/50 overflow-hidden"
    >
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-black text-white">Etiquetas</h3>
          <button
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <p className="text-xs text-slate-400 line-clamp-1">{comicTitle}</p>
      </div>

      {/* Search / Create */}
      <div className="px-5 pb-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
          <input
            ref={inputRef}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canCreate && onCreate) {
                onCreate(filter.trim());
                setFilter("");
              }
            }}
            placeholder="Buscar o crear etiqueta..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
        {canCreate && onCreate && (
          <button
            onClick={() => { onCreate(filter.trim()); setFilter(""); }}
            className="mt-2 w-full flex items-center gap-2 rounded-lg border border-dashed border-blue-500/30 bg-blue-500/5 px-3 py-2 text-sm font-semibold text-blue-300 hover:bg-blue-500/10 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Crear "{filter.trim()}"
          </button>
        )}
      </div>

      {/* Current tags */}
      {currentCategories.length > 0 && (
        <div className="px-5 pb-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Asignadas</div>
          <div className="flex flex-wrap gap-1.5">
            {currentCategories.map((cat, i) => (
              <button
                key={cat}
                onClick={() => onRemove(cat)}
                className="group inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-300 transition-all"
                title="Quitar etiqueta"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: PRESET_COLORS[i % PRESET_COLORS.length] }}
                />
                {cat}
                <svg className="opacity-50 group-hover:opacity-100 transition-opacity" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Available tags */}
      <div className="px-5 pb-5 max-h-56 overflow-y-auto">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
          {normalizedFilter ? "Resultados" : "Etiquetas existentes"}
        </div>
        {existing.length === 0 ? (
          <div className="text-xs text-slate-600 py-2">
            {normalizedFilter ? "No se encontraron etiquetas" : "No hay más etiquetas disponibles"}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {existing.map((cat, i) => (
              <button
                key={cat}
                onClick={() => onAdd(cat)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-blue-500/15 hover:text-blue-200 hover:border-blue-500/25 transition-all"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: PRESET_COLORS[(i + currentCategories.length) % PRESET_COLORS.length] }}
                />
                + {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02] flex justify-end">
        <button
          onClick={onClose}
          className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
        >
          Listo
        </button>
      </div>
    </AnimatedModal>
  );
}
