import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatedModal } from "./AnimatedModal";
import { useLibraryStore } from "../stores/library";

interface PaletteItem {
  id: string;
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const comics = useLibraryStore((s) => s.comics);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const list: PaletteItem[] = [
      {
        id: "nav-library",
        label: "Ir a Biblioteca",
        shortcut: "G L",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
        action: () => { navigate("/"); onClose(); },
      },
      {
        id: "nav-favorites",
        label: "Ir a Favoritos",
        shortcut: "G F",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.5l3 6.5 7 .9-5.2 4.7 1.5 7-6.3-3.6-6.3 3.6 1.5-7L2 9.9l7-.9z"/></svg>,
        action: () => { navigate("/favorites"); onClose(); },
      },
      {
        id: "nav-categories",
        label: "Ir a Categorías",
        shortcut: "G C",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
        action: () => { navigate("/categories"); onClose(); },
      },
      {
        id: "nav-pending",
        label: "Ir a Pendientes",
        shortcut: "G P",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
        action: () => { navigate("/pending"); onClose(); },
      },
      {
        id: "nav-stats",
        label: "Ir a Estadísticas",
        shortcut: "G S",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>,
        action: () => { navigate("/stats"); onClose(); },
      },
      {
        id: "nav-settings",
        label: "Ir a Ajustes",
        shortcut: "G ,",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.67 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.67 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.67a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09A1.65 1.65 0 0 0 15 4.67a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
        action: () => { navigate("/settings"); onClose(); },
      },
      {
        id: "action-scan",
        label: "Escanear biblioteca",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 7.66A10 10 0 1 1 19.66 4.34"/></svg>,
        action: () => { window.dispatchEvent(new CustomEvent("pl-scan")); onClose(); },
      },
      {
        id: "action-random",
        label: "Abrir cómic aleatorio",
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l5 5"/><path d="M4 4l5 5"/></svg>,
        action: () => {
          if (comics.length > 0) {
            const random = comics[Math.floor(Math.random() * comics.length)];
            navigate(`/read/${random.id}`);
          }
          onClose();
        },
      },
    ];

    // Add comics
    for (const comic of comics.slice(0, 50)) {
      list.push({
        id: `comic-${comic.id}`,
        label: `Leer: ${comic.title}`,
        icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
        action: () => { navigate(`/read/${comic.id}`); onClose(); },
      });
    }

    if (!query.trim()) return list;

    const q = query.toLowerCase();
    return list.filter((item) => item.label.toLowerCase().includes(q));
  }, [comics, navigate, onClose, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length, query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[selectedIndex]?.action();
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [items, selectedIndex, onClose]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (items.length === 0 && query.trim()) {
    return (
      <AnimatedModal open={open} onClose={onClose} panelClassName="w-full max-w-xl rounded-2xl border border-white/10 bg-ink-900 shadow-2xl overflow-hidden">
        <div className="p-4">
          <div className="relative">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar comando o cómic..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div className="mt-4 text-center text-sm text-slate-500 py-8">No se encontraron resultados</div>
        </div>
      </AnimatedModal>
    );
  }

  return (
    <AnimatedModal open={open} onClose={onClose} panelClassName="w-full max-w-xl rounded-2xl border border-white/10 bg-ink-900 shadow-2xl overflow-hidden">
      <div className="p-4 pb-2">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar comando o cómic..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>
      <div ref={scrollRef} className="max-h-80 overflow-y-auto px-2 pb-2">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={item.action}
            onMouseEnter={() => setSelectedIndex(i)}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
              i === selectedIndex
                ? "bg-blue-500/15 text-blue-200"
                : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            <span className="text-slate-500">{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
            {item.shortcut && (
              <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-slate-500">
                {item.shortcut}
              </kbd>
            )}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-white/5 px-4 py-2 text-[10px] text-slate-600">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><kbd className="rounded border border-white/10 bg-white/[0.04] px-1">↑↓</kbd> Navegar</span>
          <span className="flex items-center gap-1"><kbd className="rounded border border-white/10 bg-white/[0.04] px-1">↵</kbd> Seleccionar</span>
        </div>
        <span>{items.length} resultados</span>
      </div>
    </AnimatedModal>
  );
}
