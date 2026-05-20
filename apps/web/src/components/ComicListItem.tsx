import clsx from "clsx";
import { Link } from "react-router-dom";
import type { ComicSummary } from "../lib/api";
import { api } from "../lib/api";
import { CategoryBadge } from "./CategoryBadge";

interface Props {
  comic: ComicSummary;
  onToggleFavorite?: (id: string) => void;
}

export function ComicListItem({ comic, onToggleFavorite }: Props) {
  const progress =
    comic.pageCount > 0
      ? Math.round((comic.currentPage / Math.max(1, comic.pageCount - 1)) * 100)
      : 0;

  const status = comic.completed
    ? "Leído"
    : comic.currentPage > 0
    ? "En progreso"
    : "Sin empezar";

  const statusColor = comic.completed
    ? "text-emerald-400"
    : comic.currentPage > 0
    ? "text-blue-400"
    : "text-slate-500";

  return (
    <div className="group relative flex items-center gap-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] p-3 hover:bg-white/[0.04] hover:border-white/10 transition-all animate-fade-in">
      <Link
        to={`/read/${comic.id}`}
        className="relative shrink-0 w-16 h-24 overflow-hidden rounded-xl bg-slate-900 ring-1 ring-white/5"
      >
        <img
          src={`${api.coverUrl(comic.id)}?v=${encodeURIComponent(comic.updatedAt)}`}
          alt={comic.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {comic.completed && (
          <div className="absolute top-1 left-1 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/read/${comic.id}`}
            className="truncate text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors"
            title={comic.title}
          >
            {comic.title}
          </Link>
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleFavorite(comic.id);
              }}
              className={clsx(
                "shrink-0 grid h-8 w-8 place-items-center rounded-lg transition-all",
                comic.isFavorite
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-slate-600 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-white/5 hover:text-slate-300"
              )}
              aria-label={comic.isFavorite ? "Quitar favorito" : "Favorito"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={comic.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M12 2.5l3 6.5 7 .9-5.2 4.7 1.5 7-6.3-3.6-6.3 3.6 1.5-7L2 9.9l7-.9z" />
              </svg>
            </button>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className={`text-[11px] font-bold ${statusColor}`}>{status}</span>
          <span className="text-[10px] text-slate-600">·</span>
          <span className="text-[11px] text-slate-500 font-medium">
            {comic.format} · {comic.pageCount}P
          </span>
          {comic.lastReadAt && (
            <>
              <span className="text-[10px] text-slate-600">·</span>
              <span className="text-[11px] text-slate-500 font-medium">
                {new Date(comic.lastReadAt).toLocaleDateString()}
              </span>
            </>
          )}
        </div>

        {(comic.category || comic.categories.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {(() => {
              const tags = new Set<string>();
              if (comic.category) tags.add(comic.category);
              comic.categories.forEach((t) => { if (t.trim()) tags.add(t.trim()); });
              return Array.from(tags).slice(0, 4).map((tag) => (
                <CategoryBadge key={tag} label={tag} variant="compact" />
              ));
            })()}
          </div>
        )}

        {comic.currentPage > 0 && !comic.completed && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 max-w-[10rem] overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-black text-blue-400">{progress}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
