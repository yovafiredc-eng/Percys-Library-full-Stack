import { useState } from "react";
import clsx from "clsx";
import type { ComicSummary } from "../lib/api";

interface BatchOperationsProps {
  selectedIds: Set<string>;
  comics: ComicSummary[];
  onToggleFavorite?: (ids: string[]) => Promise<void>;
  onDelete?: (ids: string[]) => Promise<void>;
  onAddToList?: (ids: string[], listId: string) => Promise<void>;
  isLoading?: boolean;
}

export function BatchOperationsToolbar({
  selectedIds,
  comics,
  onToggleFavorite,
  onDelete,
  isLoading = false,
}: BatchOperationsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const count = selectedIds.size;

  if (count === 0) return null;

  const selectedComics = comics.filter((c) => selectedIds.has(c.id));
  const allFavorited = selectedComics.every((c) => c.isFavorite);

  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-slate-900 via-slate-900 to-slate-900/80 backdrop-blur-sm border-t border-white/10 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="text-sm font-bold text-white">
            {count} {count === 1 ? "cómic" : "cómics"} seleccionados
          </div>
          <div className="h-1 w-1 rounded-full bg-slate-600" />
          <div className="text-xs text-slate-400">
            {selectedComics.filter((c) => c.completed).length} completados
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onToggleFavorite?.([...selectedIds])}
            disabled={isLoading || !onToggleFavorite}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
              allFavorited
                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/30"
                : "bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600"
            )}
          >
            {allFavorited ? "⭐ Favoritos" : "☆ Añadir a Favoritos"}
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isLoading || !onDelete}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30 transition-colors"
          >
            🗑️ Eliminar
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl border border-white/10 shadow-2xl max-w-sm mx-4">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white">Confirmar eliminación</h2>
            </div>
            <div className="p-6 text-sm text-slate-300">
              ¿Estás seguro de que deseas eliminar {count} {count === 1 ? "cómic" : "cómics"}? Esta acción no se puede deshacer.
            </div>
            <div className="flex gap-3 p-6 border-t border-white/5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-slate-300 font-semibold hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDelete?.([...selectedIds]);
                  setShowDeleteConfirm(false);
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function BatchOperationsMenu({
  selectedIds,
  onSelectAll,
  onClearSelection,
}: {
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onClearSelection: () => void;
}) {
  const count = selectedIds.size;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      <button
        onClick={onSelectAll}
        className="text-xs font-semibold px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
      >
        Seleccionar Todo
      </button>
      {count > 0 && (
        <button
          onClick={onClearSelection}
          className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-500/20 text-slate-300 border border-slate-500/30 hover:bg-slate-500/30 transition-colors"
        >
          Limpiar ({count})
        </button>
      )}
    </div>
  );
}
