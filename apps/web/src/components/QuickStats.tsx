import type { ComicSummary } from "../lib/api";

interface QuickStatsProps {
  comics: ComicSummary[];
}

export function QuickStats({ comics }: QuickStatsProps) {
  const totalComics = comics.length;
  const completedComics = comics.filter((c) => c.completed).length;
  const inProgress = comics.filter((c) => c.currentPage > 0 && !c.completed).length;
  const totalPages = comics.reduce((sum, c) => sum + c.pageCount, 0);
  const readPages = comics.reduce((sum, c) => sum + c.currentPage, 0);
  const progressPercent = totalPages > 0 ? Math.round((readPages / totalPages) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-3 backdrop-blur-sm">
        <div className="text-xs font-bold text-slate-400">TOTAL</div>
        <div className="text-2xl font-black text-blue-300 mt-1">{totalComics}</div>
      </div>

      <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-3 backdrop-blur-sm">
        <div className="text-xs font-bold text-slate-400">COMPLETADOS</div>
        <div className="text-2xl font-black text-green-300 mt-1">{completedComics}</div>
      </div>

      <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 backdrop-blur-sm">
        <div className="text-xs font-bold text-slate-400">EN LECTURA</div>
        <div className="text-2xl font-black text-yellow-300 mt-1">{inProgress}</div>
      </div>

      <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-lg p-3 backdrop-blur-sm">
        <div className="text-xs font-bold text-slate-400">PROGRESO</div>
        <div className="text-2xl font-black text-purple-300 mt-1">{progressPercent}%</div>
      </div>
    </div>
  );
}
