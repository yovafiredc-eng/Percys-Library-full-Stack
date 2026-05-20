import { useMemo } from "react";
import { useLibraryStore } from "../stores/library";
import { Link } from "react-router-dom";

export function LiveStatsWidget() {
  const comics = useLibraryStore((s) => s.comics);

  const stats = useMemo(() => {
    const total = comics.length;
    const completed = comics.filter((c) => c.completed).length;
    const inProgress = comics.filter((c) => c.currentPage > 0 && !c.completed).length;
    const favorites = comics.filter((c) => c.isFavorite).length;
    const totalPages = comics.reduce((sum, c) => sum + c.pageCount, 0);
    const readPages = comics.reduce((sum, c) => sum + c.currentPage, 0);
    const totalMinutes = comics.reduce((sum, c) => sum + (c.readingTimeMinutes ?? 0), 0);
    const readMinutes = Math.round(totalMinutes * (readPages / Math.max(1, totalPages)));
    return { total, completed, inProgress, favorites, totalPages, readPages, readMinutes, totalMinutes };
  }, [comics]);

  if (stats.total === 0) return null;

  return (
    <Link
      to="/stats"
      className="group flex items-stretch gap-0 rounded-2xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex flex-col justify-center gap-1 px-3 border-r border-white/5">
        <div className="text-xl font-black text-white leading-none">{stats.total}</div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cómics</div>
      </div>
      <div className="flex flex-col justify-center gap-1 px-3 border-r border-white/5">
        <div className="text-xl font-black text-emerald-400 leading-none">{stats.completed}</div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Completados</div>
      </div>
      <div className="flex flex-col justify-center gap-1 px-3 border-r border-white/5">
        <div className="text-xl font-black text-blue-400 leading-none">{stats.inProgress}</div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Leyendo</div>
      </div>
      <div className="flex flex-col justify-center gap-1 px-3">
        <div className="text-xl font-black text-amber-400 leading-none">{stats.favorites}</div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Favoritos</div>
      </div>
      {stats.totalPages > 0 && (
        <div className="ml-auto flex flex-col justify-center gap-1 pl-3">
          <div className="text-xs font-bold text-slate-400 leading-none">
            {Math.round((stats.readPages / stats.totalPages) * 100)}%
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Progreso</div>
        </div>
      )}
    </Link>
  );
}
