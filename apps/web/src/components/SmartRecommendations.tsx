import type { ComicSummary } from "../lib/api";

interface SmartRecommendationsProps {
  comics: ComicSummary[];
  userId?: string;
}

export function SmartRecommendations({ comics }: SmartRecommendationsProps) {
  // Get user's favorite categories
  const categoryScores = new Map<string, number>();
  comics
    .filter((c) => c.isFavorite)
    .forEach((c) => {
      if (c.category) {
        categoryScores.set(c.category, (categoryScores.get(c.category) ?? 0) + 2);
      }
      c.categories.forEach((cat) => {
        categoryScores.set(cat.trim(), (categoryScores.get(cat.trim()) ?? 0) + 1);
      });
    });

  // Get recommendations based on favorite categories
  const recommendations = comics
    .filter((c) => c.currentPage === 0 && !c.completed)
    .map((c) => {
      let score = 0;
      if (c.category && categoryScores.has(c.category)) {
        score += categoryScores.get(c.category)! * 2;
      }
      c.categories.forEach((cat) => {
        if (categoryScores.has(cat.trim())) {
          score += categoryScores.get(cat.trim())!;
        }
      });
      // Boost newer comics slightly
      score += (new Date().getTime() - new Date(c.addedAt).getTime()) / (1000 * 60 * 60 * 24) / 100;
      return { comic: c, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((r) => r.comic);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-pink-500/10 to-pink-500/5 border border-pink-500/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          ⭐ RECOMENDACIONES PERSONALIZADAS
        </div>
      </div>
      <div className="space-y-2">
        {recommendations.map((comic) => (
          <div key={comic.id} className="flex items-start gap-3 p-2.5 bg-white/[0.02] rounded-lg border border-white/5 hover:bg-white/[0.04] transition-colors">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{comic.title}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {comic.category && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    {comic.category}
                  </span>
                )}
                {comic.categories.slice(0, 1).map((cat) => (
                  <span key={cat} className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-xs px-2 py-1 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold whitespace-nowrap">
              Recomendado
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
