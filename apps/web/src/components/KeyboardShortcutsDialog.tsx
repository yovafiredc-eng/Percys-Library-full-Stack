import { useState } from "react";

export function KeyboardShortcutsDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  const shortcuts = [
    { keys: ["?"], description: "Mostrar este diálogo" },
    { keys: ["G"], description: "Ir a Gestionar" },
    { keys: ["S"], description: "Buscar/Filtrar" },
    { keys: ["Esc"], description: "Cerrar diálogos" },
    { keys: ["Del"], description: "Eliminar seleccionados" },
    { keys: ["Ctrl", "A"], description: "Seleccionar todo" },
    { keys: ["↑", "↓"], description: "Navegar (en listas)" },
    { keys: ["Enter"], description: "Abrir/Activar" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl border border-white/10 shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 p-6 border-b border-white/5 bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Atajos de Teclado</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {shortcuts.map((shortcut, idx) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <div className="flex gap-1">
                {shortcut.keys.map((key, kidx) => (
                  <span key={kidx}>
                    {kidx > 0 && <span className="text-slate-500 mx-0.5">+</span>}
                    <kbd className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                      {key}
                    </kbd>
                  </span>
                ))}
              </div>
              <span className="text-sm text-slate-400 flex-1">{shortcut.description}</span>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-white/5">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

export function useKeyboardShortcuts() {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const handleKeyPress = (e: KeyboardEvent) => {
    // Only on key 3 (?)
    if (e.shiftKey && e.key === "?") {
      e.preventDefault();
      setShortcutsOpen(true);
    }
  };

  // Global listener setup would go here
  // But this is just the hook structure

  return {
    shortcutsOpen,
    setShortcutsOpen,
    handleKeyPress,
  };
}
