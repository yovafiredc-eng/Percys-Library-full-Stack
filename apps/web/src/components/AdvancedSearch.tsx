import { useState, useMemo, useRef, useEffect } from "react";
import clsx from "clsx";
import type { ComicSummary } from "../lib/api";

interface Props {
  comics: ComicSummary[];
  onResultsChange?: (results: ComicSummary[]) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

type FilterFormat = "all" | "cbz" | "cbr" | "pdf" | "zip" | "rar" | "folder";
type FilterStatus = "all" | "unread" | "reading" | "completed";

export function AdvancedSearch({ comics, onResultsChange, onClose, isOpen = false }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFormat, setFilterFormat] = useState<FilterFormat>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    for (const comic of comics) {
      if (comic.category) set.add(comic.category);
      comic.categories.forEach((c) => set.add(c.trim()));
    }
    return Array.from(set).sort();
  }, [comics]);

  const results = useMemo(() => {
    return comics.filter((comic) => {
      // Search query - match title
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = comic.title.toLowerCase().includes(q);
        if (!matchesTitle) return false;
      }

      // Format filter
      if (filterFormat !== "all") {
        if (comic.format.toLowerCase() !== filterFormat.toUpperCase()) return false;
      }

      // Status filter
      if (filterStatus !== "all") {
        if (filterStatus === "unread" && comic.currentPage > 0) return false;
        if (filterStatus === "reading" && (comic.currentPage === 0 || comic.completed)) return false;
        if (filterStatus === "completed" && !comic.completed) return false;
      }

      // Category filter
      if (selectedCategories.size > 0) {
        const comicCats = new Set<string>();
        if (comic.category) comicCats.add(comic.category);
        comic.categories.forEach((c) => comicCats.add(c.trim()));
        const hasMatch = Array.from(selectedCategories).some((cat) => comicCats.has(cat));
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [comics, searchQuery, filterFormat, filterStatus, selectedCategories]);

  useEffect(() => {
    onResultsChange?.(results);
  }, [results, onResultsChange]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFilterFormat("all");
    setFilterStatus("all");
    setSelectedCategories(new Set());
  };

  const hasActiveFilters = searchQuery.trim() || filterFormat !== "all" || filterStatus !== "all" || selectedCategories.size > 0;

  return (
    <div ref={searchRef} className={clsx("bg-ink-800/50 backdrop-blur-sm border-b border-white/5 transition-all duration-300", isOpen ? "max-h-[600px] overflow-y-auto p-4" : "max-h-0 overflow-hidden p-0")}>
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Search Input */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Busca por título, autor, serie..."
            className="w-full rounded-xl bg-white/[0.05] border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.08] transition-colors"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Format Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Formato</label>
            <div className="flex flex-wrap gap-2">
              {(["all", "cbz", "cbr", "pdf", "zip", "rar", "folder"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFilterFormat(fmt)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    filterFormat === fmt
                      ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
                      : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                  )}
                >
                  {fmt === "all" ? "Todos" : fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estado</label>
            <div className="flex flex-wrap gap-2">
              {(["all", "unread", "reading", "completed"] as const).map((stat) => (
                <button
                  key={stat}
                  onClick={() => setFilterStatus(stat)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    filterStatus === stat
                      ? "bg-green-500/30 text-green-300 border border-green-500/50"
                      : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                  )}
                >
                  {stat === "all" ? "Todos" : stat === "unread" ? "Sin leer" : stat === "reading" ? "Leyendo" : "Completados"}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Categorías ({selectedCategories.size})</label>
            <div className="flex flex-wrap gap-2">
              {allCategories.slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={clsx(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all truncate",
                    selectedCategories.has(cat)
                      ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                      : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                  )}
                  title={cat}
                >
                  {cat}
                </button>
              ))}
              {allCategories.length > 6 && (
                <span className="text-xs text-slate-500 px-2 py-1">+{allCategories.length - 6} más</span>
              )}
            </div>
          </div>
        </div>

        {/* Results & Clear Button */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="text-sm font-semibold text-slate-400">
            {results.length} de {comics.length} cómics
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-slate-500 hover:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
