import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useLibraryStore } from "../stores/library";
import { useSettingsStore } from "../stores/settings";
import { useToasts } from "../stores/toasts";
import { usePendingStore } from "../stores/pending";
import { api } from "../lib/api";
import { CoverCard } from "../components/CoverCard";
import { SkeletonCard } from "../components/SkeletonCard";
import { CategoryBadge } from "../components/CategoryBadge";
import { Avatar } from "../components/AvatarPresets";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { CategoryPicker } from "../components/CategoryPicker";
import { ImportProgressOverlay, type ImportPhase } from "../components/library/ImportProgressOverlay";
import { ContinueReadingHero } from "../components/ContinueReadingHero";
import { VirtualGrid } from "../components/VirtualGrid";
import { AdvancedSearch } from "../components/AdvancedSearch";
import { ReadingStatistics } from "../components/ReadingStatistics";
import { ThemeModeToggle } from "../components/ThemeModeToggle";
import { collectAvailableCategoryNames } from "../lib/category-names";
import { getDisplayName, getInitials } from "../lib/profile";
import { pruneSelectionToVisible } from "../lib/selection";
import { useDebounce } from "../hooks/useDebounce";
import { useSoundEffects } from "../hooks/useSoundEffects";

const ACCEPTED_EXTENSIONS = [".cbz", ".cbr", ".pdf", ".zip", ".rar"] as const;
const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".avif", ".heic", ".heif", ".tif", ".tiff"] as const;
const RETURNING_BANNER_KEY_PREFIX = "pl_returning_banner_seen_";

function greeting(name: string): string {
  const h = new Date().getHours();
  const part = h < 6 ? "Buenas noches" : h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  return `${part}, ${name}`;
}

interface Props {
  scope?: "all" | "favorites";
}

export function Library({ scope = "all" }: Props) {
  const {
    comics,
    loading,
    uploading,
    uploadProgress,
    query,
    filter,
    load,
    upload,
    setQuery,
    setFilter,
    toggleFavorite,
    bulk,
  } = useLibraryStore();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.update);
  const push = useToasts((s) => s.push);
  const { click: clickSound } = useSoundEffects();
  const { toggle: togglePending, toggleMany: toggleManyPending, isPending } = usePendingStore();
  const [dragOver, setDragOver] = useState(false);
  const [showReturningBanner, setShowReturningBanner] = useState(false);
  // Tracks the last completed import so the overlay can stay open with
  // a result summary even after `uploading` flips back to false.
  const [importPhase, setImportPhase] = useState<ImportPhase>({ kind: "idle" });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  // Multi-select mode + selection set. Both reset whenever scope changes
  // so switching from "Library" → "Favoritos" can't leak a stale selection.
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargets, setDeleteTargets] = useState<string[]>([]);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [categoryValue, setCategoryValue] = useState("");
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categoryPickerComicId, setCategoryPickerComicId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  useEffect(() => {
    setSelectMode(false);
    setDeleteConfirmOpen(false);
    setDeleteTargets([]);
    setCategoryEditorOpen(false);
    setCategoryValue("");
    setSelected(new Set());
  }, [scope]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const el = folderInputRef.current;
    if (!el) return;
    // Non-standard but widely supported in Chromium-based browsers.
    el.setAttribute("webkitdirectory", "");
    el.setAttribute("directory", "");
  }, []);

  useEffect(() => {
    if (!settings?.ownerId || !settings.hasOnboarded) return;
    const key = `${RETURNING_BANNER_KEY_PREFIX}${settings.ownerId}`;
    const alreadySeen = localStorage.getItem(key) === "1";
    setShowReturningBanner(!alreadySeen);
  }, [settings?.ownerId, settings?.hasOnboarded]);

  // Filter dropped/picked items down to formats we accept. Browsers don't
  // always populate `file.type` for CBR (it's a renamed RAR), so we fall
  // back to extension matching to be safe.
  function acceptedFiles(list: FileList | File[] | null | undefined): File[] {
    if (!list) return [];
    const arr = Array.from(list);
    return arr.filter((f) => {
      const lower = f.name.toLowerCase();
      return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext)) ||
        ACCEPTED_IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
    });
  }

  const handleUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      push("No se reconocieron archivos compatibles (.cbz, .cbr, .pdf, .zip, .rar o imágenes)", "error");
      return;
    }
    setImportPhase({ kind: "uploading", loaded: 0, total: 0, fileCount: files.length });
    try {
      const r = await upload(files);
      // Settle on the result-summary phase so the overlay shows what
      // happened (added / skipped / unreadable) instead of disappearing
      // the moment the request resolves.
      setImportPhase({ kind: "done", result: r });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error subiendo archivos";
      setImportPhase({ kind: "error", message: msg });
    }
  }, [upload, push]);

  // Mirror live byte-level progress from the store into the overlay's
  // local phase. The store is the source of truth while the request is
  // in flight; once it resolves, `handleUpload` swaps to `done`/`error`
  // and we leave the overlay alone.
  useEffect(() => {
    if (!uploadProgress) return;
    setImportPhase((prev) => {
      if (prev.kind === "done" || prev.kind === "error") return prev;
      if (uploadProgress.phase === "uploading") {
        return {
          kind: "uploading",
          loaded: uploadProgress.loaded,
          total: uploadProgress.total,
          fileCount: uploadProgress.fileCount,
        };
      }
      return { kind: "processing", fileCount: uploadProgress.fileCount };
    });
  }, [uploadProgress]);

  const sortMode = settings?.librarySort ?? "lastReadAt";
  const viewMode = settings?.libraryView ?? "grid";

  const debouncedQuery = useDebounce(query, 180);

  const visible = useMemo(() => {
    const filtered = comics.filter((c) => {
      if (scope === "favorites" && !c.isFavorite) return false;
      if (filter === "favorites" && !c.isFavorite) return false;
      if (filter === "in-progress" && (c.completed || c.currentPage === 0)) return false;
      if (filter === "completed" && !c.completed) return false;
      if (debouncedQuery.trim() && !c.title.toLowerCase().includes(debouncedQuery.trim().toLowerCase())) return false;
      // Match against both the legacy primary slot AND the additive
      // Category filtering removed — use the dedicated /categories page instead.
      return true;
    });
    // Sort copies the array so React doesn't re-render the same identity.
    const sorted = [...filtered];
    switch (sortMode) {
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "progress": {
        // Highest progress (% read) first; completed sit at the bottom so
        // "show me what I've started" stays glanceable. Use the same
        // (pageCount-1) denominator as CoverCard / ListView so the sort
        // order matches what the user sees on each tile.
        const pct = (c: typeof sorted[number]) =>
          c.pageCount > 1 ? c.currentPage / (c.pageCount - 1) : 0;
        sorted.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1;
          return pct(b) - pct(a);
        });
        break;
      }
      case "addedAt":
        sorted.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
        break;
      case "lastReadAt":
      default:
        // Most-recently-read first; never-opened items fall to the end.
        sorted.sort((a, b) => {
          const av = a.lastReadAt ?? "";
          const bv = b.lastReadAt ?? "";
          if (!av && !bv) return a.title.localeCompare(b.title);
          if (!av) return 1;
          if (!bv) return -1;
          return bv.localeCompare(av);
        });
    }
    return sorted;
  }, [comics, debouncedQuery, filter, scope, sortMode]);

  const availableCategories = useMemo(() => {
    return collectAvailableCategoryNames(comics);
  }, [comics]);

  const handleCategoryPickerAdd = useCallback(async (category: string) => {
    if (!categoryPickerComicId) return;
    const comic = comics.find((c) => c.id === categoryPickerComicId);
    if (!comic) return;
    if (comic.categories.includes(category)) return;
    try {
      await api.bulk([categoryPickerComicId], "categoryAdd", category);
      push(`Añadido a "${category}"`, "success");
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo añadir categoría";
      push(msg, "error");
    }
  }, [categoryPickerComicId, comics, load, push]);

  const handleCategoryPickerRemove = useCallback(async (category: string) => {
    if (!categoryPickerComicId) return;
    const comic = comics.find((c) => c.id === categoryPickerComicId);
    if (!comic) return;
    try {
      await api.bulk([categoryPickerComicId], "categoryRemove", category);
      push(`Quitado de "${category}"`, "success");
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo quitar categoría";
      push(msg, "error");
    }
  }, [categoryPickerComicId, comics, load, push]);

  const handleCategoryPickerCreate = useCallback(async (name: string) => {
    if (!categoryPickerComicId || !name.trim()) return;
    const comic = comics.find((c) => c.id === categoryPickerComicId);
    if (!comic) return;
    if (comic.categories.includes(name.trim())) return;
    try {
      await api.bulk([categoryPickerComicId], "categoryAdd", name.trim());
      push(`Categoría "${name.trim()}" creada y añadida`, "success");
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo crear categoría";
      push(msg, "error");
    }
  }, [categoryPickerComicId, comics, load, push]);

  const categoryPickerComic = useMemo(
    () => (categoryPickerComicId ? comics.find((c) => c.id === categoryPickerComicId) ?? null : null),
    [categoryPickerComicId, comics],
  );

  useEffect(() => {
    if (!selectMode) return;
    const visibleIds = new Set(visible.map((comic) => comic.id));
    setSelected((prev) => pruneSelectionToVisible(prev, visibleIds));
  }, [selectMode, visible]);

  async function runBulk(op: import("../lib/api").BulkOp, category?: string | null) {
    const ids = deleteTargets.length > 0 ? deleteTargets : Array.from(selected);
    if (ids.length === 0) {
      setDeleteConfirmOpen(false);
      setCategoryEditorOpen(false);
      push("Selecciona al menos un cómic", "warn");
      return;
    }
    setBulkBusy(true);
    try {
      const r = await bulk(ids, op, category);
      // Bulk feedback is intentionally low-noise: a single toast per
      // user action, never one per affected row.
      const verb = op === "delete" ? "Eliminado" : "Actualizado";
      push(`${verb}${r.affected === 1 ? "" : "s"} · ${r.affected}`, "success");
      // Trigger celebration when marking comics as completed
      if (op === "markCompleted" && r.affected > 0) {
        window.dispatchEvent(new CustomEvent("pl-celebrate"));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error en operación masiva";
      push(msg, "error");
    } finally {
      // Always tear down the modals + selection regardless of success or
      // failure — leaving the confirm dialog stuck open after the user
      // pressed "Confirmar" was the most common complaint.
      setSelected(new Set());
      setSelectMode(false);
      setDeleteConfirmOpen(false);
      setDeleteTargets([]);
      setCategoryEditorOpen(false);
      setCategoryValue("");
      setBulkBusy(false);
    }
  }

  function requestDelete(ids: string[]) {
    setDeleteTargets(ids);
    setDeleteConfirmOpen(true);
  }

  // Home-page lanes — shown only when we're at the "all" scope with no
  // active filter or query, so the user sees a tidy split between
  // "what was I reading?" and "what's new?".
  const showHomeLanes =
    scope === "all" && filter === "all" && !query.trim() && comics.length > 0;
  const continueReading = useMemo(() => {
    return [...comics]
      .filter((c) => !c.completed && c.currentPage > 0 && c.lastReadAt)
      .sort((a, b) => (b.lastReadAt ?? "").localeCompare(a.lastReadAt ?? ""))
      .slice(0, 8);
  }, [comics]);
  const recentlyAdded = useMemo(() => {
    return [...comics]
      .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
      .slice(0, 8);
  }, [comics]);
  // "Casi terminados" — >70% progress, not completed
  const almostDone = useMemo(() => {
    return [...comics]
      .filter((c) => !c.completed && c.pageCount > 1)
      .filter((c) => c.currentPage / (c.pageCount - 1) >= 0.7)
      .sort((a, b) => (b.currentPage / Math.max(1, b.pageCount - 1)) - (a.currentPage / Math.max(1, a.pageCount - 1)))
      .slice(0, 8);
  }, [comics]);
  // "Descubrimientos" — never opened, recently added
  const newDiscoveries = useMemo(() => {
    return [...comics]
      .filter((c) => c.currentPage === 0)
      .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
      .slice(0, 8);
  }, [comics]);
  // "Favoritos" — favorited comics
  const favoritePicks = useMemo(() => {
    return [...comics]
      .filter((c) => c.isFavorite)
      .sort((a, b) => (b.lastReadAt ?? "").localeCompare(a.lastReadAt ?? ""))
      .slice(0, 8);
  }, [comics]);

  const userName = getDisplayName(settings?.userName, settings?.userLastName) || "Lector";
  const coverSize = settings?.coverSize ?? "md";

  const heroComic = continueReading[0] || recentlyAdded[0];
  const isEmpty = comics.length === 0;
  const noResults = !loading && visible.length === 0 && !isEmpty;
  const totalEmpty = !loading && isEmpty;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const hasFileDrag = useCallback((event: Pick<DragEvent, "dataTransfer">) => {
    return Array.from(event.dataTransfer?.types ?? []).includes("Files");
  }, []);

  // Tags currently on at least one of the selected comics. Powers the
  // "click to remove" chips in the category editor so the user can see
  // which labels they would be stripping off.
  const selectedTagsForRemoval = useMemo<string[]>(() => {
    if (selected.size === 0) return [];
    const set = new Set<string>();
    for (const c of comics) {
      if (!selected.has(c.id)) continue;
      if (c.category) set.add(c.category);
      for (const t of c.categories) {
        const trimmed = t.trim();
        if (trimmed) set.add(trimmed);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [comics, selected]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => setShowScrollTop(el.scrollTop > 600);
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onDragEnter(e: DragEvent) {
      if (!hasFileDrag(e)) return;
      e.preventDefault();
      setDragOver(true);
    }

    function onDragOver(e: DragEvent) {
      if (!hasFileDrag(e)) return;
      e.preventDefault();
    }

    function onDrop(e: DragEvent) {
      if (!hasFileDrag(e)) return;
      e.preventDefault();
      setDragOver(false);
    }

    function onDragEnd() {
      setDragOver(false);
    }

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    window.addEventListener("dragend", onDragEnd);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("dragend", onDragEnd);
    };
  }, [hasFileDrag]);

  // Keyboard shortcuts active while the user is in "Gestionar" mode:
  //   Esc           — exit select mode
  //   Delete/Backsp  — open delete confirm for current selection
  //   Ctrl/⌘ + A     — select every visible comic
  // We bail out when focus is in an input/textarea or when a dialog is
  // already open so we never steal real keystrokes.
  useEffect(() => {
    if (!selectMode) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      if (deleteConfirmOpen || categoryEditorOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        setSelectMode(false);
        setSelected(new Set());
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selected.size > 0) {
        e.preventDefault();
        requestDelete(Array.from(selected));
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelected(new Set(visible.map((c) => c.id)));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectMode, selected, visible, deleteConfirmOpen, categoryEditorOpen]);

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden pl-gradient-bg"
      onDragEnter={(e) => {
        if (hasFileDrag(e)) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragOver={(e) => {
        if (hasFileDrag(e)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragOver(false);
      }}
      onDrop={(e) => {
        if (!hasFileDrag(e)) return;
        e.preventDefault();
        setDragOver(false);
        void handleUpload(acceptedFiles(e.dataTransfer.files));
      }}
    >
      {/* Dynamic blurred background art from most relevant comic */}
      {heroComic && (
        <div
          className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url(${`/api/comics/${heroComic.id}/cover`})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(80px) saturate(1.2)",
          }}
        />
      )}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-6 pt-5 pb-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/30 to-purple-500/20 blur-xl opacity-60" />
            <Avatar value={settings?.avatar ?? null} size={56} className="rounded-2xl shadow-xl shadow-black/50 border border-white/10 shrink-0 relative" fallbackText={getInitials(settings?.userName, settings?.userLastName)} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{greeting(userName)}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] font-bold text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {scope === "favorites" ? "Favoritos" : `${comics.length} obras`}
              </span>
              {scope !== "favorites" && comics.filter(c => !c.completed && c.currentPage > 0).length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] font-bold text-blue-400">
                  {comics.filter(c => !c.completed && c.currentPage > 0).length} en progreso
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-60 md:w-72 rounded-xl bg-white/[0.03] border border-white/[0.08] pl-9 pr-9 py-2 text-sm font-medium placeholder:text-slate-500 focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.06] transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                aria-label="Limpiar búsqueda"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".cbz,.cbr,.pdf,.zip,.rar,application/pdf"
            className="sr-only"
            onChange={(e) => {
              const files = acceptedFiles(e.target.files);
              if (e.target) e.target.value = "";
              void handleUpload(files);
            }}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            accept=".cbz,.cbr,.pdf,.zip,.rar,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.heic,.heif,.tif,.tiff,application/pdf,image/*"
            className="sr-only"
            onChange={(e) => {
              const files = acceptedFiles(e.target.files);
              if (e.target) e.target.value = "";
              void handleUpload(files);
            }}
          />
          {/* While the user is gestionar-ing, hide import to keep
              the header focused on selection. The centralised toolbar at
              the bottom owns every management action in that state. */}
          {!selectMode && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { clickSound(); setSearchOpen(!searchOpen); }}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
                title="Búsqueda avanzada"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </button>
              <button
                onClick={() => { clickSound(); setShowStats(!showStats); }}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
                title="Estadísticas"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </button>
              <ThemeModeToggle />
              <button
                onClick={() => { clickSound(); fileInputRef.current?.click(); }}
                disabled={uploading}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
                title="Importar archivos"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </button>
              <button
                onClick={() => { clickSound(); folderInputRef.current?.click(); }}
                disabled={uploading}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
                title="Importar carpeta"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </button>
            </div>
          )}
          <button
            onClick={() => {
              clickSound();
              setSelectMode((v) => !v);
              if (selectMode) setSelected(new Set());
            }}
            className={clsx("rounded-xl px-3 py-2 text-xs font-bold border transition-all", selectMode ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/20" : "border-white/10 bg-white/[0.03] text-slate-300 hover:text-white hover:bg-white/[0.06]")}
          >
            {selectMode ? "Listo" : "Gestionar"}
          </button>
        </div>
      </header>
       {/* Advanced Search Panel */}
       <AdvancedSearch 
         comics={comics} 
         isOpen={searchOpen} 
         onClose={() => setSearchOpen(false)}
       />

       {/* Reading Statistics Panel */}
       {showStats && (
         <div className="px-6 pb-4 relative z-10 border-b border-white/5">
           <ReadingStatistics comics={comics} />
         </div>
       )}
       {showReturningBanner && settings?.hasOnboarded && (
        <div className="mx-8 mb-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Bienvenido de vuelta, {userName}</div>
              <div className="text-xs text-blue-100/80">Tu perfil y biblioteca se conservarán durante la navegación.</div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (settings?.ownerId) {
                  localStorage.setItem(`${RETURNING_BANNER_KEY_PREFIX}${settings.ownerId}`, "1");
                }
                setShowReturningBanner(false);
              }}
              className="rounded-lg border border-blue-300/40 px-3 py-1.5 text-xs font-semibold text-blue-100 hover:bg-blue-500/20"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      <div className="px-6 pb-4 flex flex-wrap md:flex-nowrap items-center gap-2 relative z-10">
        {scope !== "favorites" && (
          <div className="flex gap-0.5 overflow-x-auto no-scrollbar shrink-0 max-w-[calc(100%-100px)]">
            {([
              { id: "all", label: "Todos" },
              { id: "in-progress", label: "Leyendo" },
              { id: "completed", label: "Leídos" },
              { id: "favorites", label: "Favoritos" },
            ] as const).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap shrink-0",
                  filter === f.id
                    ? "bg-blue-500/15 text-blue-300 border border-blue-500/20 shadow-sm shadow-blue-500/10"
                    : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <select
            value={sortMode}
            onChange={(e) => void updateSettings({ librarySort: e.target.value as typeof sortMode })}
            className="rounded-lg bg-white/[0.03] border border-white/[0.08] px-2.5 py-1.5 text-[11px] font-bold text-slate-300 focus:outline-none focus:border-blue-500/40 cursor-pointer hover:bg-white/[0.05]"
          >
            <option value="lastReadAt">Recientes</option>
            <option value="title">A-Z</option>
            <option value="progress">Progreso</option>
            <option value="addedAt">Nuevos</option>
          </select>

          <div className="flex p-0.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
            <button
              onClick={() => void updateSettings({ libraryView: "grid" })}
              className={clsx("p-1.5 rounded-md transition-all", viewMode === "grid" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300")}
              title="Cuadrícula"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            </button>
            <button
              onClick={() => void updateSettings({ libraryView: "list" })}
              className={clsx("p-1.5 rounded-md transition-all", viewMode === "list" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300")}
              title="Lista"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-6 pb-10 space-y-8 no-scrollbar scroll-smooth">
        {!loading && showHomeLanes && !selectMode && (
          <>
            {heroComic && (
              <section className="animate-fade-in">
                <ContinueReadingHero comic={heroComic} />
              </section>
            )}

            {continueReading.filter(c => c.id !== heroComic?.id).length > 0 && (
              <Lane title="Sigue leyendo" subtitle="Retoma donde lo dejaste">
                {continueReading.filter(c => c.id !== heroComic?.id).map((c) => (
                  <CoverCard key={c.id} comic={c} size="sm" onToggleFavorite={toggleFavorite} />
                ))}
              </Lane>
            )}
            {almostDone.length > 0 && (
              <Lane title="Casi terminados" subtitle="Estás a punto de completarlos">
                {almostDone.map((c) => (
                  <CoverCard key={c.id} comic={c} size="sm" onToggleFavorite={toggleFavorite} />
                ))}
              </Lane>
            )}
            {newDiscoveries.length > 0 && (
              <Lane title="Descubrimientos" subtitle="Aún no los has abierto">
                {newDiscoveries.map((c) => (
                  <CoverCard key={c.id} comic={c} size="sm" onToggleFavorite={toggleFavorite} />
                ))}
              </Lane>
            )}
            {favoritePicks.length > 0 && (
              <Lane title="Tus favoritos" subtitle="Los que más te gustan">
                {favoritePicks.map((c) => (
                  <CoverCard key={c.id} comic={c} size="sm" onToggleFavorite={toggleFavorite} />
                ))}
              </Lane>
            )}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Tu Colección</h2>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.15em]">
                      {comics.length} cómics totales
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {comics.length > 0 && (
                    <>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/15 text-[10px] font-bold text-blue-300 whitespace-nowrap shadow-sm shadow-blue-500/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                        {comics.filter(c => c.currentPage > 0 && !c.completed).length} leyendo
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-[10px] font-bold text-emerald-300 whitespace-nowrap shadow-sm shadow-emerald-500/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {comics.filter(c => c.completed).length} terminados
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/15 text-[10px] font-bold text-amber-300 whitespace-nowrap shadow-sm shadow-amber-500/10">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {comics.filter(c => c.isFavorite).length} favoritos
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-8">
            <div className="flex flex-wrap gap-x-6 gap-y-8 justify-center">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} size={coverSize} />
              ))}
            </div>
            <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
              <div className="h-5 w-5 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
              Organizando biblioteca...
            </div>
          </div>
        )}

        {totalEmpty && (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-purple-500/20 blur-2xl rounded-full" />
              <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] flex items-center justify-center shadow-2xl">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Tu biblioteca está vacía</h3>
            <p className="text-slate-400 max-w-sm mx-auto mb-8 font-medium leading-relaxed">
              Importa archivos CBZ, CBR, PDF o carpetas de imágenes para empezar tu aventura de lectura.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="pl-btn-primary flex items-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {uploading ? "Subiendo…" : "Elegir archivos"}
              </button>
              <button
                onClick={() => folderInputRef.current?.click()}
                className="pl-btn flex items-center gap-2"
                disabled={uploading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                Importar carpeta
              </button>
              <Link to="/online-library" className="pl-btn flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>
                Buscar online
              </Link>
            </div>
            <p className="mt-6 text-[11px] text-slate-600 font-medium">
              También puedes arrastrar y soltar archivos directamente aquí
            </p>
          </div>
        )}

        {noResults && (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/10 blur-2xl rounded-full" />
              <div className="relative h-20 w-20 rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] flex items-center justify-center shadow-2xl">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">Sin resultados</h3>
            <p className="text-slate-400 font-medium max-w-sm mx-auto mb-8">
              No hemos encontrado cómics que coincidan con &quot;{query}&quot;. Prueba con otros términos o revisa los filtros.
            </p>
            <button
              onClick={() => { setQuery(""); setFilter("all"); }}
              className="pl-btn-primary flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Limpiar búsqueda
            </button>
          </div>
        )}

        {viewMode === "grid" ? (
          <VirtualGrid
            items={visible}
            itemSize={{ width: "190px", height: "280px" }}
            gap="24px"
            renderItem={(comic: any) => (
              <CoverCard
                key={comic.id}
                comic={comic}
                size={coverSize}
                onToggleFavorite={toggleFavorite}
                selectable={selectMode}
                selected={selected.has(comic.id)}
                onToggleSelect={(id) => toggleSelect(id)}
                onTogglePending={togglePending}
                isPending={isPending(comic.id)}
              />
            )}
          />
        ) : (
          <ListView comics={visible} onToggleFavorite={toggleFavorite} />
        )}
      </div>

      <CategoryPicker
        open={categoryPickerOpen}
        onClose={() => {
          setCategoryPickerOpen(false);
          setCategoryPickerComicId(null);
        }}
        comicTitle={categoryPickerComic?.title ?? "Cómic"}
        currentCategories={categoryPickerComic ? [
          ...(categoryPickerComic.category ? [categoryPickerComic.category] : []),
          ...categoryPickerComic.categories,
        ] : []}
        allCategories={availableCategories}
        onAdd={handleCategoryPickerAdd}
        onRemove={handleCategoryPickerRemove}
        onCreate={handleCategoryPickerCreate}
      />

      {showScrollTop && (
        <button
          onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 h-11 w-11 rounded-full bg-white/[0.08] backdrop-blur-xl text-white shadow-2xl shadow-black/40 flex items-center justify-center animate-in fade-in zoom-in slide-in-from-bottom-4 duration-300 hover:scale-110 active:scale-95 transition-all border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/30 hover:text-blue-300"
          title="Volver arriba"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg>
        </button>
      )}

      {selectMode && (
        // Outer wrapper spans the full viewport width so the bar stays
        // anchored to the bottom regardless of any ancestor's `overflow:
        // hidden`. `pointer-events-none` lets clicks pass through the
        // empty area to the comics behind, while the inner card opts
        // back in with `pointer-events-auto`. The `pb-` rules layer the
        // device safe-area on top of a baseline (20 mobile / 6 desktop)
        // so the toolbar always clears the iOS home indicator AND the
        // mobile bottom-nav, which the old `bottom-6` clipped against.
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 animate-fade-in pb-[max(env(safe-area-inset-bottom),0px)] mb-20 md:mb-6"
          aria-label="Acciones masivas"
        >
          <div className="pointer-events-auto w-full max-w-3xl rounded-2xl border border-white/10 bg-slate-950/95 px-3 py-2.5 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            {/* Centralised management toolbar. Stays visible the whole time
                the user is in select mode so the available bulk actions and
                the selection counter are always reachable from one place. */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={clsx(
                    "grid h-9 w-9 place-items-center rounded-xl text-sm font-black text-white shadow-md transition-colors",
                    selected.size > 0
                      ? "bg-blue-600 shadow-blue-600/30"
                      : "bg-white/5 text-slate-300 shadow-black/20",
                  )}
                >
                  {selected.size}
                </div>
                <div className="leading-tight">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Seleccionados
                  </div>
                  <div className="text-[11px] font-semibold text-slate-300">
                    de {visible.length} visible{visible.length === 1 ? "" : "s"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (selected.size === visible.length && visible.length > 0) {
                    setSelected(new Set());
                  } else {
                    setSelected(new Set(visible.map((c) => c.id)));
                  }
                }}
                disabled={visible.length === 0 || bulkBusy}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-300 transition-all hover:border-blue-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {selected.size === visible.length && visible.length > 0
                  ? "Quitar selección"
                  : "Seleccionar todo"}
              </button>

              <div className="hidden h-8 w-px bg-white/10 md:block" />

              <div className="flex flex-wrap items-center justify-center gap-1">
                <ActionBtn onClick={() => void runBulk("favorite")} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l3 6.5 7 .9-5.2 4.7 1.5 7-6.3-3.6-6.3 3.6 1.5-7L2 9.9l7-.9z"/></svg>} label="Favorito" disabled={selected.size === 0 || bulkBusy} />
                <ActionBtn onClick={() => void runBulk("unfavorite")} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.5l3 6.5 7 .9-5.2 4.7 1.5 7-6.3-3.6-6.3 3.6 1.5-7L2 9.9l7-.9z"/></svg>} label="Sin fav." disabled={selected.size === 0 || bulkBusy} />
                <ActionBtn onClick={() => void runBulk("markCompleted")} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>} label="Leído" disabled={selected.size === 0 || bulkBusy} />
                <ActionBtn
                  onClick={() => {
                    const ids = Array.from(selected);
                    const { added, removed } = toggleManyPending(ids);
                    const total = added + removed;
                    if (total > 0) {
                      push(
                        removed > 0 && added > 0
                          ? `Pendientes actualizados · +${added} -${removed}`
                          : removed > 0
                            ? `Quitados de pendientes · ${removed}`
                            : `Agregados a pendientes · ${added}`,
                        "success"
                      );
                    }
                    setSelected(new Set());
                    setSelectMode(false);
                  }}
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                  label="Pendiente"
                  disabled={selected.size === 0 || bulkBusy}
                />
                <ActionBtn onClick={() => setCategoryEditorOpen(true)} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>} label="Categoría" disabled={selected.size === 0 || bulkBusy} />
                <ActionBtn onClick={() => requestDelete(Array.from(selected))} icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>} label="Eliminar" danger disabled={selected.size === 0 || bulkBusy} />
              </div>

              <div className="hidden h-8 w-px bg-white/10 md:block" />

              <button
                onClick={() => { setSelectMode(false); setSelected(new Set()); }}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 transition-all hover:border-white/20 hover:text-white"
                title="Salir del modo gestionar (Esc)"
              >
                Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Eliminar de biblioteca"
        description={`Se eliminarán ${deleteTargets.length || selected.size} cómic${(deleteTargets.length || selected.size) === 1 ? "" : "s"} de la biblioteca y sus archivos locales. Esta acción no se puede deshacer.`}
        confirmLabel="Confirmar eliminación"
        tone="danger"
        busy={bulkBusy}
        onConfirm={() => void runBulk("delete")}
        onCancel={() => {
          if (bulkBusy) return;
          setDeleteConfirmOpen(false);
          setDeleteTargets([]);
        }}
      />
      <ConfirmDialog
        open={categoryEditorOpen}
        title="Añadir etiqueta"
        description="Añade una etiqueta a los cómics seleccionados sin borrar las existentes. Toca una etiqueta de abajo para quitarla."
        confirmLabel="Añadir"
        busy={bulkBusy}
        // Let the inner <input autoFocus /> own focus so the user can
        // start typing immediately.
        autoFocusConfirm={false}
        // Use the additive `categoryAdd` op so assigning "Marvel" to a
        // comic that's already tagged "X-Men" keeps both labels — this
        // is the wipe-out fix the user reported. Empty input is a
        // no-op (handled server-side too).
        onConfirm={() => {
          const value = categoryValue.trim();
          if (!value) {
            setCategoryEditorOpen(false);
            setCategoryValue("");
            return;
          }
          void runBulk("categoryAdd", value);
        }}
        onCancel={() => {
          if (bulkBusy) return;
          setCategoryEditorOpen(false);
          setCategoryValue("");
        }}
      >
        <div className="space-y-3">
          <input
            autoFocus
            value={categoryValue}
            onChange={(e) => setCategoryValue(e.target.value)}
            placeholder="Ejemplo: Shonen, DC, Pendientes..."
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
          />
          {selectedTagsForRemoval.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Etiquetas en la selección · click para quitar
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedTagsForRemoval.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    disabled={bulkBusy}
                    onClick={() => void runBulk("categoryRemove", tag)}
                    className="group inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition-all hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span>{tag}</span>
                    <span className="text-slate-500 group-hover:text-red-300" aria-hidden>×</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ConfirmDialog>
      {dragOver && !uploading && (
        // Drag-and-drop hint overlay. Only visible while a drag is over
        // the page and no upload is currently in flight — the
        // ImportProgressOverlay below owns every other "I'm busy" state.
        <div
          className="pointer-events-none fixed inset-0 z-[150] flex items-center justify-center bg-[#030408]/90 backdrop-blur-xl animate-fade-in"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-8 max-w-sm text-center">
            <div className="relative">
              <div className="h-28 w-28 rounded-[32px] bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-2xl animate-bounce">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-300"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div className="absolute -inset-4 bg-blue-500/20 blur-3xl -z-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">Suelta tus archivos</h3>
              <p className="text-slate-500 font-medium leading-relaxed">
                Arrastra tus archivos CBZ, CBR o PDF aquí para añadirlos a la biblioteca.
              </p>
            </div>
          </div>
        </div>
      )}

      <ImportProgressOverlay
        phase={importPhase}
        onClose={() => setImportPhase({ kind: "idle" })}
      />
    </div>
  );
}

// Horizontal carousel of covers with a label. Netflix-style with arrow navigation.
const Lane = memo(function Lane({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
    // Delay check for initial render
    const t = setTimeout(checkScroll, 300);
    return () => { el.removeEventListener("scroll", checkScroll); clearTimeout(t); };
  }, [checkScroll]);

  const scrollBy = useCallback((dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = dir === "left" ? -el.clientWidth * 0.75 : el.clientWidth * 0.75;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  return (
    <section className="space-y-3 relative group/lane">
      <div className="flex items-center justify-between px-1">
        <div className="space-y-0.5">
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            {title}
            <span className="h-2 w-2 rounded-full bg-indigo-500 opacity-80" />
          </h2>
          {subtitle && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover/lane:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => scrollBy("left")}
            disabled={!canScrollLeft}
            className="h-7 w-7 rounded-full bg-white/5 border border-white/[0.08] flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            aria-label="Anterior"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button
            onClick={() => scrollBy("right")}
            disabled={!canScrollRight}
            className="h-7 w-7 rounded-full bg-white/5 border border-white/[0.08] flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            aria-label="Siguiente"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
      <div className="relative -mx-8">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#030408] to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-300" style={{ opacity: canScrollLeft ? 1 : 0 }} />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#030408] to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-300" style={{ opacity: canScrollRight ? 1 : 0 }} />
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-6 px-8 no-scrollbar scroll-smooth"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {children}
        </div>
      </div>
    </section>
  );
});

function ListView({
  comics,
  onToggleFavorite,
}: {
  comics: import("../lib/api").ComicSummary[];
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <div className="grid gap-2.5">
      {comics.map((c) => {
        const pct = c.pageCount > 0 ? Math.round((c.currentPage / Math.max(1, c.pageCount - 1)) * 100) : 0;
        const tags = new Set<string>();
        if (c.category) tags.add(c.category);
        c.categories.forEach((t) => { if (t.trim()) tags.add(t.trim()); });
        return (
          <div key={c.id} className="group pl-card p-3 flex items-center gap-4 hover:border-blue-500/30 transition-all duration-300">
            <Link to={`/read/${c.id}`} className="flex flex-1 items-center gap-4 min-w-0">
              <img
                src={`/api/comics/${c.id}/cover`}
                alt=""
                className="h-16 w-12 shrink-0 rounded-xl object-cover bg-white/5 border border-white/5 shadow-lg group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-white group-hover:text-blue-400 transition-colors">{c.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  {Array.from(tags).slice(0, 2).map((tag) => (
                    <CategoryBadge key={tag} label={tag} variant="compact" />
                  ))}
                  {tags.size > 2 && (
                    <span className="text-[9px] text-slate-600 font-medium">+{tags.size - 2}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="h-1.5 w-24 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {c.completed ? "Completado" : `${pct}%`}
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase">{c.format}</span>
                  {c.readingTimeMinutes && c.readingTimeMinutes > 0 && (
                    <span className="text-[10px] font-semibold text-slate-600">
                      {c.readingTimeMinutes < 60 ? `${c.readingTimeMinutes}m` : `${Math.floor(c.readingTimeMinutes / 60)}h ${c.readingTimeMinutes % 60}m`}
                    </span>
                  )}
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-2 px-3 border-l border-white/5">
              <button
                onClick={() => onToggleFavorite(c.id)}
                className={clsx(
                  "p-2.5 rounded-xl transition-all duration-300",
                  c.isFavorite ? "text-amber-400 bg-amber-400/10 hover:bg-amber-400/20" : "text-slate-500 hover:text-white hover:bg-white/5"
                )}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={c.isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M12 2.5l3 6.5 7 .9-5.2 4.7 1.5 7-6.3-3.6-6.3 3.6 1.5-7L2 9.9l7-.9z" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActionBtn({ onClick, icon, label, danger, disabled }: { onClick: () => void; icon: React.ReactNode; label: string; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "flex flex-col items-center justify-center min-w-[60px] h-11 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed",
        danger
          ? "text-red-400 hover:bg-red-400/10"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <span className="flex items-center justify-center">{icon}</span>
      <span className="mt-0.5 text-[9px] font-black uppercase tracking-tighter leading-none">{label}</span>
    </button>
  );
}


// PageModal was replaced by the shared <ConfirmDialog> in components/.
