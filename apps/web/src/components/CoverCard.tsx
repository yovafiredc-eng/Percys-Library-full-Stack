import clsx from "clsx";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { ComicSummary } from "../lib/api";
import { api } from "../lib/api";
import { CategoryBadge } from "./CategoryBadge";

interface Props {
  comic: ComicSummary;
  size?: "sm" | "md" | "lg";
  onToggleFavorite?: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  onTogglePending?: (id: string) => void;
  isPending?: boolean;
  /** Opens the category picker for this comic. When provided, an inline
   *  "tag" affordance is rendered on hover so adding a comic to a
   *  category never requires entering bulk-management mode. */
  onOpenCategoryPicker?: (id: string) => void;
}

const sizeMap = {
  sm: "w-[130px] sm:w-[150px]",
  md: "w-[140px] sm:w-[170px] md:w-[190px]",
  lg: "w-[150px] sm:w-[190px] md:w-[230px]",
};

export const CoverCard = memo(function CoverCard({
  comic,
  size = "md",
  onToggleFavorite,
  selectable = false,
  selected = false,
  onToggleSelect,
  onTogglePending,
  isPending = false,
  onOpenCategoryPicker,
}: Props) {
  const [coverState, setCoverState] = useState<"loading" | "ready" | "error">("loading");
  const [retry, setRetry] = useState(0);
  const retryTimerRef = useRef<number | null>(null);
  const progress = comic.pageCount > 0 ? Math.round((comic.currentPage / Math.max(1, comic.pageCount - 1)) * 100) : 0;
  const coverUrl = `${api.coverUrl(comic.id)}?v=${encodeURIComponent(comic.updatedAt)}${retry > 0 ? `&retry=${retry}` : ""}`;
  const titleInitials = useMemo(
    () =>
      comic.title
        .split(/[\s._-]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => Array.from(part)[0] ?? "")
        .join("")
        .toUpperCase() || "PL",
    [comic.title],
  );

  useEffect(() => {
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    setCoverState("loading");
    setRetry(0);
    return () => {
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [comic.id, comic.updatedAt]);

  const coverInner = (
    <>
      <div
        className={clsx(
          "absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-ink-800 via-ink-900 to-black p-4 text-center transition-opacity duration-500",
          coverState === "ready" ? "opacity-0" : "opacity-100",
        )}
        aria-hidden={coverState === "ready"}
      >
        <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-lg font-black text-white shadow-inner animate-pulse">
          {titleInitials}
        </div>
        <div className="line-clamp-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {coverState === "error" ? "Portada no disponible" : "Cargando portada..."}
        </div>
      </div>
      {coverState !== "ready" && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-transparent">
          <div className="absolute inset-x-5 bottom-5 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className={clsx(
                "h-full rounded-full bg-blue-500/70",
                coverState === "loading" ? "w-2/3 animate-pulse" : "w-full bg-amber-400/70",
              )}
            />
          </div>
        </div>
      )}
      <img
        src={coverUrl}
        alt={comic.title}
        loading="lazy"
        decoding="async"
        // React 19 supports the camelCase `fetchPriority` prop, but our
        // current React version maps it to the lowercase HTML attribute.
        // Let the browser pick the right priority; we used to force
        // "low" which made the grid look stuck even though the response
        // was already being served.
        fetchPriority="auto"
        className={clsx(
          "h-full w-full object-cover transition-opacity duration-300 ease-out",
          coverState === "ready" ? "opacity-100" : "opacity-0",
        )}
        onError={(e) => {
          const el = e.currentTarget as HTMLImageElement;
          // 3 quick retries (200ms, 600ms, 1500ms) — the old backoff
          // peaked at 6.4s which left covers stuck in skeleton state
          // for far too long on a fresh library scan.
          if (retry < 3) {
            if (retryTimerRef.current !== null) {
              window.clearTimeout(retryTimerRef.current);
            }
            const delay = [200, 600, 1500][retry] ?? 1500;
            retryTimerRef.current = window.setTimeout(() => {
              retryTimerRef.current = null;
              setRetry((n) => n + 1);
            }, delay);
            return;
          }
          // Final failure: hide image via opacity but keep element in DOM
          // so future visibility changes can trigger re-evaluation
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          setCoverState("error");
        }}
        onLoad={(e) => {
          if ((e.currentTarget as HTMLImageElement).naturalWidth > 0) {
            if (retryTimerRef.current !== null) {
              window.clearTimeout(retryTimerRef.current);
              retryTimerRef.current = null;
            }
            setCoverState("ready");
          }
        }}
      />
      {coverState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/70 p-4 text-center backdrop-blur-sm">
          <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-lg font-black text-white">
            {titleInitials}
          </div>
          <div className="line-clamp-3 text-xs font-bold text-slate-200">{comic.title}</div>
        </div>
      )}
      {comic.completed && (
        <div className="absolute top-2 left-2 rounded-lg bg-emerald-500/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-sm shadow-lg shadow-emerald-500/30 flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          Leído
        </div>
      )}
    </>
  );

  return (
    <div className={clsx("group relative animate-fade-in", sizeMap[size])}>
      {selectable ? (
        <button
          type="button"
          onClick={() => onToggleSelect?.(comic.id)}
          className={clsx(
            "relative block aspect-[2/3] w-full overflow-hidden rounded-2xl bg-slate-900 ring-1 transition-shadow duration-200 ease-out",
            selected
              ? "ring-2 ring-blue-500 shadow-xl shadow-blue-500/25"
              : "ring-white/5 shadow-md hover:ring-blue-500/40",
          )}
          aria-pressed={selected}
          aria-label={selected ? `Quitar selección de ${comic.title}` : `Seleccionar ${comic.title}`}
        >
          {coverInner}
          <span
            aria-hidden
            className={clsx(
              "absolute top-2 right-2 grid h-7 w-7 place-items-center rounded-xl border text-[11px] font-bold backdrop-blur-md transition-opacity duration-200",
              selected
                ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/30"
                : "bg-black/40 text-white border-white/20 opacity-0 group-hover:opacity-100",
            )}
          >
            {selected ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg> : ""}
          </span>
        </button>
      ) : (
        <Link
          to={`/read/${comic.id}`}
          className="relative block aspect-[2/3] overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-white/[0.07] shadow-md shadow-black/30 transition-shadow duration-200 ease-out group-hover:ring-white/15 group-hover:shadow-lg group-hover:shadow-black/40"
        >
          {coverInner}
        </Link>
      )}
      {!selectable && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite?.(comic.id); }}
            className={clsx(
              "absolute top-2 right-2 grid h-9 w-9 place-items-center rounded-xl backdrop-blur-md transition-all duration-300 z-10",
              comic.isFavorite
                ? "bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 scale-100 shadow-lg shadow-amber-400/30"
                : "bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 hover:scale-110",
            )}
            aria-label={comic.isFavorite ? "Quitar de favoritos" : "Marcar favorito"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={comic.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.5l3 6.5 7 .9-5.2 4.7 1.5 7-6.3-3.6-6.3 3.6 1.5-7L2 9.9l7-.9z" />
            </svg>
          </button>
          {onTogglePending && (
            <button
              onClick={(e) => { e.preventDefault(); onTogglePending(comic.id); }}
              className={clsx(
                "absolute top-2 left-2 grid h-9 w-9 place-items-center rounded-xl backdrop-blur-md transition-opacity duration-200 z-10",
                isPending
                  ? "bg-blue-500/80 text-white shadow-lg shadow-blue-500/30"
                  : "bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70",
              )}
              aria-label={isPending ? "Quitar de pendientes" : "Marcar como pendiente"}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isPending ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </button>
          )}
          {/* Quick category button — opens the picker for this specific
              comic so the user never has to enter "Gestionar" mode just
              to add one comic to a category. */}
          {onOpenCategoryPicker && (
            <button
              onClick={(e) => { e.preventDefault(); onOpenCategoryPicker(comic.id); }}
              className="absolute bottom-2 right-2 grid h-9 w-9 place-items-center rounded-xl bg-black/50 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-opacity duration-200 z-10"
              aria-label="Añadir a una categoría"
              title="Añadir a una categoría"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </button>
          )}
        </>
      )}
      <div className="mt-3 px-1 space-y-1.5">
        <div className="truncate text-[13px] font-bold text-slate-100 leading-snug group-hover:text-indigo-300 transition-colors duration-300 tracking-tight" title={comic.title}>
          {comic.title}
        </div>
        {(comic.category || comic.categories.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {(() => {
              const tags = new Set<string>();
              if (comic.category) tags.add(comic.category);
              comic.categories.forEach((t) => { if (t.trim()) tags.add(t.trim()); });
              return Array.from(tags).slice(0, 3).map((tag) => (
                <CategoryBadge key={tag} label={tag} variant="compact" />
              ));
            })()}
            {(() => {
              const tags = new Set<string>();
              if (comic.category) tags.add(comic.category);
              comic.categories.forEach((t) => { if (t.trim()) tags.add(t.trim()); });
              return tags.size > 3 ? (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold text-slate-500 bg-white/[0.03] border border-white/[0.05]">
                  +{tags.size - 3}
                </span>
              ) : null;
            })()}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            {comic.format} · {comic.pageCount}P
          </div>
          {comic.currentPage > 0 && !comic.completed && (
            <span className="text-[10px] font-black text-blue-400">{progress}%</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {comic.currentPage > 0 && !comic.completed && (
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
              <div className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.6)] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          )}
          {comic.readingTimeMinutes && comic.readingTimeMinutes > 0 && (
            <span className="text-[9px] font-semibold text-slate-600 shrink-0" title="Tiempo de lectura estimado">
              {comic.readingTimeMinutes < 60 
                ? `${comic.readingTimeMinutes}m` 
                : `${Math.floor(comic.readingTimeMinutes / 60)}h ${comic.readingTimeMinutes % 60}m`}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
