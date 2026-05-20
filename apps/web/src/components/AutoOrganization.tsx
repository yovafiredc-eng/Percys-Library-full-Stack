import { useState } from "react";
import type { ComicSummary } from "../lib/api";

interface AutoOrganizationProps {
  comics: ComicSummary[];
  onOrganize?: (organization: Map<string, string[]>) => Promise<void>;
}

export function AutoOrganizationSuggestions({ comics }: AutoOrganizationProps) {
  const [suggestions, setSuggestions] = useState<Map<string, ComicSummary[]> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeComics = async () => {
    setIsAnalyzing(true);
    // Simulate analysis
    await new Promise((r) => setTimeout(r, 500));

    const groups = new Map<string, ComicSummary[]>();

    // Group by format
    comics.forEach((c) => {
      const key = `[${c.format.toUpperCase()}]`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    });

    setSuggestions(groups);
    setIsAnalyzing(false);
  };

  if (!suggestions) {
    return (
      <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          🤖 Organización Automática
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Analiza tu biblioteca y sugiere categorías automáticas.
        </p>
        <button
          onClick={analyzeComics}
          disabled={isAnalyzing}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors text-sm"
        >
          {isAnalyzing ? "Analizando..." : "Analizar Biblioteca"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 space-y-3">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        📊 Sugerencias de Organización
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {Array.from(suggestions.entries()).map(([category, comicsInGroup]) => (
          <div key={category} className="p-3 bg-white/[0.02] rounded-lg border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs font-semibold text-white">{category}</div>
                <div className="text-xs text-slate-500 mt-1">
                  {comicsInGroup.length} cómics
                </div>
              </div>
              <button className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors font-semibold">
                Aplicar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
