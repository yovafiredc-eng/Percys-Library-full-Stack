import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { ComicSummary } from "../lib/api";

export function ContinueReadingHero({ comic }: { comic: ComicSummary }) {
  const pct = comic.pageCount > 0 ? Math.round((comic.currentPage / Math.max(1, comic.pageCount - 1)) * 100) : 0;
  const remaining = Math.max(0, comic.pageCount - comic.currentPage - 1);

  const accentHue = useMemo(() => {
    const hash = comic.title.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return (hash % 360);
  }, [comic.title]);

  const accentColor = `hsl(${accentHue} 80% 65%)`;
  const accentGlow = `hsl(${accentHue} 80% 65% / 0.25)`;
  const accentBg = `hsl(${accentHue} 60% 55% / 0.08)`;

  return (
    <Link
      to={`/read/${comic.id}`}
      className="group relative flex items-stretch rounded-[2rem] border border-white/[0.08] overflow-hidden hover:border-white/[0.18] transition-all duration-500"
      style={{
        background: `linear-gradient(115deg, hsl(${accentHue} 40% 8%) 0%, hsl(${accentHue} 30% 6%) 40%, hsl(${accentHue} 20% 5%) 100%)`,
        boxShadow: `0 12px 50px -12px ${accentGlow}, inset 0 1px 0 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* Large ambient glow behind cover */}
      <div
        className="absolute top-1/2 left-28 -translate-y-1/2 w-72 h-72 rounded-full blur-[100px] opacity-35 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none"
        style={{ background: accentColor }}
      />
      {/* Secondary glow */}
      <div
        className="absolute bottom-0 right-20 w-48 h-48 rounded-full blur-[80px] opacity-15 group-hover:opacity-25 transition-opacity duration-700 pointer-events-none"
        style={{ background: accentColor }}
      />

      {/* Left: Prominent Cover */}
      <div className="relative shrink-0 p-6 sm:p-7 md:p-9">
        <div
          className="relative overflow-hidden rounded-[1.25rem] transition-all duration-500 group-hover:scale-[1.04] group-hover:-translate-y-1"
          style={{
            boxShadow: `0 24px 70px -16px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(255,255,255,0.08), 0 0 30px -5px ${accentGlow}`,
          }}
        >
          <img
            src={`/api/comics/${comic.id}/cover`}
            alt={comic.title}
            className="h-52 w-[140px] sm:h-56 sm:w-[152px] md:h-64 md:w-[172px] object-cover"
            loading="eager"
          />
          {/* Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
          {/* Edge highlight */}
          <div className="absolute inset-0 rounded-[1.25rem] ring-1 ring-white/[0.12] pointer-events-none" />
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60">
            <div
              className="h-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accentColor}, hsl(${accentHue + 35} 85% 72%))` }}
            />
          </div>
        </div>
      </div>

      {/* Right: Content */}
      <div className="relative flex flex-col justify-center gap-3 sm:gap-4 py-5 sm:py-6 md:py-8 pr-5 sm:pr-6 md:pr-8 flex-1 min-w-0">
        {/* Badge row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] border backdrop-blur-sm shadow-sm"
            style={{
              color: accentColor,
              borderColor: `${accentColor}30`,
              backgroundColor: accentBg,
              boxShadow: `0 0 20px -4px ${accentGlow}`,
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: accentColor }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: accentColor }} />
            </span>
            {comic.currentPage === 0 ? "Empezar" : "Continuar lectura"}
          </span>
          {comic.isFavorite && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold border border-amber-500/20 text-amber-400 bg-amber-500/10">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2.5l3 6.5 7 .9-5.2 4.7 1.5 7-6.3-3.6-6.3 3.6 1.5-7L2 9.9l7-.9z"/></svg>
              Favorito
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl md:text-[2rem] font-black text-white leading-[1.1] truncate group-hover:text-white/90 transition-colors tracking-tight">
          {comic.title}
        </h2>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-400">
          <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-slate-300 uppercase tracking-wider text-[10px] font-bold border border-white/[0.06]">{comic.format}</span>
          <span className="text-slate-500">·</span>
          <span>{comic.pageCount} páginas</span>
          {remaining > 0 && comic.currentPage > 0 && (
            <>
              <span className="text-slate-500">·</span>
              <span style={{ color: accentColor }} className="font-semibold">{remaining} restantes</span>
            </>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 max-w-[280px]">
          <div className="h-2.5 flex-1 rounded-full bg-white/[0.06] overflow-hidden ring-1 ring-white/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${accentColor}, hsl(${accentHue + 35} 85% 72%))` }}
            />
          </div>
          <span className="text-xs font-black tabular-nums" style={{ color: accentColor }}>{pct}%</span>
        </div>

        {/* CTA */}
        <div className="mt-1">
          <span
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[13px] font-bold transition-all duration-300 group-hover:scale-[1.03] active:scale-[0.97] group-hover:shadow-lg"
            style={{
              color: "#0a0a0f",
              backgroundColor: accentColor,
              boxShadow: `0 6px 24px -6px ${accentGlow}`,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 3l14 9-14 9V3z"/></svg>
            {comic.currentPage === 0 ? "Comenzar lectura" : "Seguir leyendo"}
          </span>
        </div>
      </div>

      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-500 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color: accentColor }}>
          <circle cx="100" cy="0" r="70" fill="currentColor" />
        </svg>
      </div>
    </Link>
  );
}
