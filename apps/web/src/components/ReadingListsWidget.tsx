import { useState } from "react";
import clsx from "clsx";
import { useReadingListsStore, useDefaultLists } from "../stores/reading-lists";

interface Props {
  onSelectList?: (listId: string) => void;
}

export function ReadingListsWidget({ onSelectList }: Props) {
  const lists = useReadingListsStore((s) => s.lists);
  useDefaultLists(); // Ensure default lists exist
  const [showAll, setShowAll] = useState(false);

  const visibleLists = showAll ? lists : lists.slice(0, 3);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mis Listas</h3>
        {lists.length > 3 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showAll ? "Menos" : "Ver todas"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {visibleLists.map((list) => (
          <button
            key={list.id}
            onClick={() => onSelectList?.(list.id)}
            className="group relative px-3 py-2.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left overflow-hidden"
          >
            {/* Color accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: list.color }}
            />

            <div className="text-xs font-semibold text-white truncate pl-1">{list.name}</div>
            {list.description && (
              <div className="text-[10px] text-slate-500 truncate pl-1">{list.description}</div>
            )}
            <div className="text-[10px] text-slate-600 mt-1 pl-1">{list.comicIds.length} cómics</div>
          </button>
        ))}
      </div>

      {lists.length === 0 && (
        <div className="text-xs text-slate-500 text-center py-3 italic">
          No hay listas aún. Crea una para empezar.
        </div>
      )}
    </div>
  );
}

export function CreateReadingListDialog({ isOpen, onClose, onCreate }: { isOpen: boolean; onClose: () => void; onCreate: (name: string, color: string) => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim(), color);
      setName("");
      setColor("#3B82F6");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl border border-white/10 shadow-2xl w-full max-w-sm mx-4">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-bold text-white">Nueva Lista</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Nombre
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi lista de favoritos..."
              autoFocus
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Color
            </label>
            <div className="grid grid-cols-6 gap-2">
              {["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={clsx("h-8 rounded-lg border-2 transition-all", color === c ? "border-white" : "border-transparent opacity-60 hover:opacity-100")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-semibold hover:bg-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
