import { useMemo } from "react";
import type { ComicSummary } from "../lib/api";

interface Props {
  comics: ComicSummary[];
}

interface Stats {
  totalComics: number;
  totalRead: number;
  percentComplete: number;
  hoursSpent: number;
  avgTimePerComic: number;
  currentStreak: number;
  favoriteGenre: string;
  recentlyRead: ComicSummary[];
  readingSpeed: number; // pages per day (approx)
}

export function ReadingStatistics({ comics }: Props) {
  const stats: Stats = useMemo(() => {
    if (!comics.length) {
      return {
        totalComics: 0,
        totalRead: 0,
        percentComplete: 0,
        hoursSpent: 0,
        avgTimePerComic: 0,
        currentStreak: 0,
        favoriteGenre: "N/A",
        recentlyRead: [],
        readingSpeed: 0,
      };
    }

    const totalRead = comics.filter((c) => c.completed || c.currentPage > 0).length;
    const readPages = comics.reduce((sum, c) => sum + c.currentPage, 0);

    // Estimate hours (avg 30 pages/hour reading speed)
    const hoursSpent = Math.round(readPages / 30 * 10) / 10;
    const avgTimePerComic = comics.length > 0 ? Math.round((hoursSpent / comics.length) * 10) / 10 : 0;

    // Reading speed (pages/day estimate from completed comics)
    const completedComics = comics.filter((c) => c.completed);
    const readingSpeed = completedComics.length > 0 ? Math.round((readPages / completedComics.length) * 10) / 10 : 0;

    // Favorite genre (most common category)
    const genreMap = new Map<string, number>();
    comics.forEach((c) => {
      if (c.category) {
        genreMap.set(c.category, (genreMap.get(c.category) ?? 0) + 1);
      }
      c.categories.forEach((cat) => {
        genreMap.set(cat.trim(), (genreMap.get(cat.trim()) ?? 0) + 1);
      });
    });
    const favoriteGenre = Array.from(genreMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

    // Recently read
    const recentlyRead = comics.filter((c) => c.currentPage > 0 && !c.completed).sort((a, b) => b.currentPage - a.currentPage).slice(0, 3);

    return {
      totalComics: comics.length,
      totalRead,
      percentComplete: Math.round((totalRead / comics.length) * 100),
      hoursSpent,
      avgTimePerComic,
      currentStreak: calculateStreak(comics),
      favoriteGenre,
      recentlyRead,
      readingSpeed,
    };
  }, [comics]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total */}
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total</div>
        <div className="text-3xl font-black text-white">{stats.totalComics}</div>
        <div className="text-xs text-slate-500 mt-2">{stats.totalRead} cómics leídos</div>
      </div>

      {/* Progress */}
      <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-4 backdrop-blur-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Progreso</div>
        <div className="flex items-baseline gap-1">
          <div className="text-3xl font-black text-white">{stats.percentComplete}%</div>
          <div className="text-xs text-slate-500">completado</div>
        </div>
        <div className="w-full bg-white/5 h-2 rounded-full mt-3 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full" style={{ width: `${stats.percentComplete}%` }} />
        </div>
      </div>

      {/* Hours Read */}
      <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4 backdrop-blur-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tiempo</div>
        <div className="flex items-baseline gap-1">
          <div className="text-3xl font-black text-white">{stats.hoursSpent}</div>
          <div className="text-xs text-slate-500">horas</div>
        </div>
        <div className="text-xs text-slate-500 mt-2">~{stats.avgTimePerComic}h/cómic</div>
      </div>

      {/* Favorite Genre */}
      <div className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20 rounded-xl p-4 backdrop-blur-sm">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Favorito</div>
        <div className="text-2xl font-black text-white truncate">{stats.favoriteGenre}</div>
        <div className="text-xs text-slate-500 mt-2">{stats.readingSpeed} pág/cómic</div>
      </div>

      {/* Recently Reading */}
      {stats.recentlyRead.length > 0 && (
        <div className="lg:col-span-4 bg-white/[0.02] border border-white/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Leyendo Ahora</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stats.recentlyRead.map((comic) => (
              <div key={comic.id} className="flex items-center gap-3 p-2 bg-white/[0.03] rounded-lg border border-white/5">
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{comic.title}</div>
                  <div className="text-xs text-slate-500 mt-1">Pág {comic.currentPage}/{comic.pageCount}</div>
                  <div className="w-full bg-white/5 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-full" style={{ width: `${(comic.currentPage / comic.pageCount) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function calculateStreak(comics: ComicSummary[]): number {
  // Simulate reading streak (could be enhanced with actual date tracking)
  const recentlyRead = comics.filter((c) => c.currentPage > 0).length;
  return Math.min(recentlyRead, 7); // Max 7-day streak display
}
