import type { ComicSummary } from "../lib/api";

interface TrendingComicsProps {
  comics: ComicSummary[];
}

export function TrendingComics({ comics }: TrendingComicsProps) {
  // Get most popular by reading engagement
  const trending = comics
    .filter((c) => c.currentPage > 0 || c.completed)
    .sort((a, b) => {
      const progressA = a.currentPage / a.pageCount;
      const progressB = b.currentPage / b.pageCount;
      return progressB - progressA;
    })
    .slice(0, 5);

  if (trending.length === 0) {
    return (
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-4">
        <div className="text-xs font-bold text-slate-400 mb-3">POPULARES EN TU BIBLIOTECA</div>
        <div className="text-sm text-slate-500 italic">Comienza a leer cómics para ver recomendaciones</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-4">
      <div className="text-xs font-bold text-slate-400 mb-3">POPULARES EN TU BIBLIOTECA</div>
      <div className="space-y-2">
        {trending.map((comic, idx) => (
          <div key={comic.id} className="flex items-center gap-3 p-2.5 bg-white/[0.02] rounded-lg border border-white/5">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 text-xs font-bold text-blue-300">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{comic.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">
                {Math.round((comic.currentPage / comic.pageCount) * 100)}% completado
              </div>
            </div>
            {comic.completed && (
              <div className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300 border border-green-500/30 font-semibold">
                ✓
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecommendedNextReads({ comics }: TrendingComicsProps) {
  // Comics with 0% progress, prioritized by recent additions
  const recommended = comics
    .filter((c) => c.currentPage === 0 && !c.completed)
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .slice(0, 3);

  if (recommended.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4">
      <div className="text-xs font-bold text-slate-400 mb-3">PRÓXIMAS LECTURAS</div>
      <div className="space-y-2">
        {recommended.map((comic) => (
          <div key={comic.id} className="flex items-center gap-3 p-2.5 bg-white/[0.02] rounded-lg border border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{comic.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{comic.pageCount} páginas</div>
            </div>
            <div className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
              Nuevo
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
