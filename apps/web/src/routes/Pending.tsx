import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLibraryStore } from "../stores/library";
import { usePendingStore } from "../stores/pending";
import { CoverCard } from "../components/CoverCard";
import { useToasts } from "../stores/toasts";

export function Pending() {
  const comics = useLibraryStore((s) => s.comics);
  const pendingIds = usePendingStore((s) => s.ids);
  const clear = usePendingStore((s) => s.clear);
  const push = useToasts((s) => s.push);
  const navigate = useNavigate();

  const pending = useMemo(
    () => comics.filter((c) => pendingIds.has(c.id)),
    [comics, pendingIds]
  );

  return (
    <div className="relative flex h-full flex-col overflow-hidden pl-gradient-bg">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-5 px-8 pt-8 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Pendientes</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] font-bold text-slate-400">
              {pending.length} {pending.length === 1 ? "obra" : "obras"} por leer
            </span>
          </div>
        </div>
        {pending.length > 0 && (
          <button
            onClick={() => {
              clear();
              push("Lista de pendientes limpiada", "success");
            }}
            className="rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 px-4 py-2 text-xs font-bold transition-all w-max"
          >
            Limpiar lista
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 pt-20 text-center animate-fade-in">
            <div className="opacity-30"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white">Sin pendientes</h2>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Marca cómics como pendientes desde la biblioteca para agregarlos aquí.
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="mt-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600/30 px-5 py-2.5 text-xs font-bold transition-all"
            >
              Ir a la biblioteca
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-8 pl-stagger">
            {pending.map((c) => (
              <CoverCard key={c.id} comic={c} size="md" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
