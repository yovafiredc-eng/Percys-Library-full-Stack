import { useMemo, useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { useLibraryStore } from "../stores/library";
import { api } from "../lib/api";
import { CategoryBadge } from "../components/CategoryBadge";
import { CoverCard } from "../components/CoverCard";
import { CategoryPicker } from "../components/CategoryPicker";
import { collectAvailableCategoryNames } from "../lib/category-names";
import { useToasts } from "../stores/toasts";
import { useSoundEffects } from "../hooks/useSoundEffects";
import { AnimatedModal } from "../components/AnimatedModal";

const CATEGORY_PRESETS = [
  { gradient: "from-rose-500/20 via-orange-500/10 to-transparent", accent: "rose", iconId: "flame", color: "#f43f5e" },
  { gradient: "from-blue-500/20 via-cyan-500/10 to-transparent", accent: "blue", iconId: "snow", color: "#3b82f6" },
  { gradient: "from-emerald-500/20 via-teal-500/10 to-transparent", accent: "emerald", iconId: "leaf", color: "#10b981" },
  { gradient: "from-purple-500/20 via-pink-500/10 to-transparent", accent: "purple", iconId: "orb", color: "#a855f7" },
  { gradient: "from-amber-500/20 via-yellow-500/10 to-transparent", accent: "amber", iconId: "bolt", color: "#f59e0b" },
  { gradient: "from-indigo-500/20 via-blue-500/10 to-transparent", accent: "indigo", iconId: "space", color: "#6366f1" },
  { gradient: "from-pink-500/20 via-rose-500/10 to-transparent", accent: "pink", iconId: "flower", color: "#ec4899" },
  { gradient: "from-cyan-500/20 via-blue-500/10 to-transparent", accent: "cyan", iconId: "gem", color: "#22d3ee" },
  { gradient: "from-red-500/20 via-orange-500/10 to-transparent", accent: "red", iconId: "target", color: "#ef4444" },
  { gradient: "from-lime-500/20 via-green-500/10 to-transparent", accent: "lime", iconId: "clover", color: "#84cc16" },
  { gradient: "from-slate-500/20 via-gray-500/10 to-transparent", accent: "slate", iconId: "ball", color: "#64748b" },
  { gradient: "from-fuchsia-500/20 via-purple-500/10 to-transparent", accent: "fuchsia", iconId: "magic", color: "#d946ef" },
];

const ICON_MAP: Record<string, React.ReactNode> = {
  flame: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  snow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/></svg>,
  leaf: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 20A7 7 0 0 1 9.8 6.9C13.4 5.6 17 7.4 19 10.9c2.3 4.1 1 9.7-3.2 11.3"/></svg>,
  orb: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 1 0 10 10"/></svg>,
  bolt: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  space: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  flower: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 1 4.5 4.5M7.5 12H9m3 4.5a4.5 4.5 0 1 1-4.5-4.5M12 16.5V15m4.5-3a4.5 4.5 0 1 1-4.5 4.5M16.5 12H15"/></svg>,
  gem: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 3h12l4 6-10 13L2 9z"/></svg>,
  target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>,
  clover: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 10a4 4 0 1 0 4-4M12 10a4 4 0 1 1-4-4M12 14a4 4 0 1 0-4 4M12 14a4 4 0 1 1 4 4"/><path d="M12 10v4"/></svg>,
  ball: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  magic: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 4V2M15 16a5 5 0 1 1-10 0 5 5 0 0 1 10 0zM9 9h6M12 6v6M19 4l-1.5 1.5M5 4l1.5 1.5M19 20l-1.5-1.5M5 20l1.5-1.5"/></svg>,
  book: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
  hero: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.5l3 6.5 7 .9-5.2 4.7 1.5 7-6.3-3.6-6.3 3.6 1.5-7L2 9.9l7-.9z"/></svg>,
  alien: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 17a2 2 0 0 1-2-2M3 14h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"/></svg>,
  moon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  star: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l3 6.5 7 .9-5.2 4.7 1.5 7-6.3-3.6-6.3 3.6 1.5-7L2 9.9l7-.9z"/></svg>,
  skull: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M8 21v-1a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"/><path d="M12 2a7 7 0 0 0-7 7v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a7 7 0 0 0-7-7z"/></svg>,
  robot: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M8 16h.01"/><path d="M16 16h.01"/></svg>,
  mask: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12a10 10 0 1 1 20 0 10 10 0 0 1-20 0z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/></svg>,
  art: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.5 8.6"/><path d="M22 22l-5.5-5.5"/></svg>,
  scroll: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>,
  castle: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V7l8-4 8 4v14M9 21v-6h6v6"/></svg>,
  rocket: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  rainbow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 17a10 10 0 0 1 20 0"/><path d="M2 13a6 6 0 0 1 12 0"/><path d="M2 9a2 2 0 0 1 4 0"/></svg>,
  popcorn: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2"/><path d="M6 15a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2"/><path d="M7 8v7M17 8v7M12 8v7"/><path d="M10 22h4"/></svg>,
  film: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/></svg>,
  music: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  sword: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  wizard: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3l4 4-10 10-4-4z"/><path d="M14.5 6.5l3.5 3.5"/><path d="M6 18l-2 4 4-2"/></svg>,
  ghost: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 10h.01M15 10h.01M12 2a7 7 0 0 0-7 7v12l2.5-2.5L10 22l2.5-2.5L15 22l2.5-2.5L20 21V9a7 7 0 0 0-7-7z"/></svg>,
  dragon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>,
  fox: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  wolf: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16l2-2 2 2"/><path d="M16 16l2-2 2 2"/><path d="M12 12a4 4 0 0 0-4-4H5a2 2 0 0 0-2 2v5.5a2.5 2.5 0 0 0 2.5 2.5h.5"/><path d="M12 12a4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v5.5a2.5 2.5 0 0 1-2.5 2.5h-.5"/></svg>,
  lion: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const node = ICON_MAP[icon];
  if (node) return <span className={className}>{node}</span>;
  // Fallback for legacy emoji data: show first letter
  return <span className={className}>{icon ? icon.charAt(0).toUpperCase() : "?"}</span>;
}

interface CategoryMeta {
  icon: string;
  colorIndex: number;
}

interface CategoryGroup {
  name: string;
  count: number;
  comics: import("../lib/api").ComicSummary[];
  colorIndex: number;
}

const META_KEY = "pl-category-meta-v1";

function loadMeta(): Record<string, CategoryMeta> {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMeta(meta: Record<string, CategoryMeta>) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function getOrCreateMeta(name: string, fallbackIndex: number): CategoryMeta {
  const all = loadMeta();
  if (!all[name]) {
    all[name] = { icon: CATEGORY_PRESETS[fallbackIndex % CATEGORY_PRESETS.length].iconId, colorIndex: fallbackIndex % CATEGORY_PRESETS.length };
    saveMeta(all);
  }
  return all[name];
}

export function Categories() {
  const { comics, loading, toggleFavorite, bulk, load } = useLibraryStore();
  const push = useToasts((s) => s.push);
  const { click: clickSound } = useSoundEffects();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedComics, setSelectedComics] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newNameDraft, setNewNameDraft] = useState("");
  const [movingTo, setMovingTo] = useState<string | null>(null);
  const [confirmDeleteCategory, setConfirmDeleteCategory] = useState<string | null>(null);
  const [confirmDeleteComics, setConfirmDeleteComics] = useState(false);
  const [customizingCategory, setCustomizingCategory] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createColor, setCreateColor] = useState(0);
  const [createIcon, setCreateIcon] = useState("book");
  const [metaRevision, setMetaRevision] = useState(0);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [categoryPickerComicId, setCategoryPickerComicId] = useState<string | null>(null);

  // Close any open modal on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (createOpen) { setCreateOpen(false); setCreateName(""); setCreateColor(0); setCreateIcon("book"); }
        else if (editingCategory) setEditingCategory(null);
        else if (customizingCategory) setCustomizingCategory(null);
        else if (confirmDeleteCategory) setConfirmDeleteCategory(null);
        else if (confirmDeleteComics) setConfirmDeleteComics(false);
        else if (movingTo === "__open") setMovingTo(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [createOpen, editingCategory, customizingCategory, confirmDeleteCategory, confirmDeleteComics, movingTo]);

  const groups = useMemo<CategoryGroup[]>(() => {
    const map = new Map<string, import("../lib/api").ComicSummary[]>();
    for (const comic of comics) {
      const tags = new Set<string>();
      const isValidTag = (t: string) =>
        t && t.trim() && t.trim().toLowerCase() !== "null";
      if (isValidTag(comic.category ?? "")) tags.add(comic.category!);
      comic.categories.forEach((t) => { if (isValidTag(t)) tags.add(t.trim()); });
      for (const tag of tags) {
        const list = map.get(tag) ?? [];
        list.push(comic);
        map.set(tag, list);
      }
    }
    // Also include empty categories from metadata so manually-created
    // categories appear even before any comics are tagged.
    const meta = loadMeta();
    for (const name of Object.keys(meta)) {
      if (!map.has(name) && name && name.trim().toLowerCase() !== "null") {
        map.set(name, []);
      }
    }
    const sorted = Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([name, list], i) => ({
        name,
        count: list.length,
        comics: list,
        colorIndex: i,
      }));
    // Prime metadata for any new categories
    sorted.forEach((g, i) => getOrCreateMeta(g.name, i));
    return sorted;
  }, [comics, metaRevision]);

  const filteredComics = useMemo(() => {
    if (!selectedCategory) return [];
    const g = groups.find((x) => x.name === selectedCategory);
    return g?.comics ?? [];
  }, [selectedCategory, groups]);

  const otherCategories = useMemo(() => {
    return groups.filter((g) => g.name !== selectedCategory).map((g) => g.name);
  }, [groups, selectedCategory]);

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

  const toggleComicSelection = useCallback((id: string) => {
    setSelectedComics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allSelected = filteredComics.length > 0 && filteredComics.every((c) => selectedComics.has(c.id));

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedComics(new Set());
    } else {
      setSelectedComics(new Set(filteredComics.map((c) => c.id)));
    }
  }, [allSelected, filteredComics]);

  async function renameCategory(oldName: string, newName: string) {
    if (!newName.trim() || newName.trim() === oldName) return;
    const target = newName.trim();
    const ids = comics.filter((c) => c.categories.includes(oldName)).map((c) => c.id);
    if (ids.length === 0) return;
    try {
      await bulk(ids, "categoryRemove", oldName);
      await bulk(ids, "categoryAdd", target);
      // Migrate metadata
      const meta = loadMeta();
      if (meta[oldName]) {
        meta[target] = meta[oldName];
        delete meta[oldName];
        saveMeta(meta);
        setMetaRevision((r) => r + 1);
      }
      push(`Categoría renombrada a "${target}"`, "success");
      setEditingCategory(null);
      setSelectedCategory(target);
    } catch (err) {
      push("Error al renombrar categoría", "error");
    }
  }

  async function deleteCategory(name: string) {
    const ids = comics.filter((c) => c.categories.includes(name)).map((c) => c.id);
    try {
      if (ids.length > 0) {
        await bulk(ids, "categoryRemove", name);
      }
      const meta = loadMeta();
      delete meta[name];
      saveMeta(meta);
      setMetaRevision((r) => r + 1);
      push(`Categoría "${name}" eliminada`, "success");
      setConfirmDeleteCategory(null);
      setSelectedCategory(null);
    } catch (err) {
      push("Error al eliminar categoría", "error");
    }
  }

  async function deleteSelectedComics() {
    if (selectedComics.size === 0) return;
    try {
      const r = await bulk(Array.from(selectedComics), "delete");
      push(`Eliminado${r.affected === 1 ? "" : "s"} · ${r.affected}`, "success");
      setSelectedComics(new Set());
      setSelectMode(false);
      setConfirmDeleteComics(false);
    } catch (err) {
      push("Error al eliminar cómics", "error");
    }
  }

  async function moveSelectedToCategory(target: string) {
    if (selectedComics.size === 0 || !selectedCategory) return;
    try {
      await bulk(Array.from(selectedComics), "categoryRemove", selectedCategory);
      await bulk(Array.from(selectedComics), "categoryAdd", target);
      push(`${selectedComics.size} cómic(s) movido(s) a "${target}"`, "success");
      setSelectedComics(new Set());
      setSelectMode(false);
      setMovingTo(null);
    } catch (err) {
      push("Error al mover cómics", "error");
    }
  }

  function updateCategoryMeta(name: string, patch: Partial<CategoryMeta>) {
    const meta = loadMeta();
    meta[name] = { ...(meta[name] || { icon: "book", colorIndex: 0 }), ...patch };
    saveMeta(meta);
    setMetaRevision((r) => r + 1);
  }

  function createCategory() {
    const name = createName.trim();
    if (!name) {
      push("El nombre no puede estar vacío", "warn");
      return;
    }
    const meta = loadMeta();
    if (meta[name]) {
      push("Ya existe una categoría con ese nombre", "warn");
      return;
    }
    meta[name] = { icon: createIcon, colorIndex: createColor };
    saveMeta(meta);
    setMetaRevision((r) => r + 1);
    push(`Categoría "${name}" creada`, "success");
    setCreateOpen(false);
    setCreateName("");
    setCreateColor(0);
    setCreateIcon("book");
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-10">
        <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
          <div className="h-10 w-48 bg-white/5 rounded-xl animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="pl-card h-40 animate-pulse bg-white/[0.03]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (selectedCategory) {
    const meta = getOrCreateMeta(selectedCategory, groups.findIndex((g) => g.name === selectedCategory));
    const preset = CATEGORY_PRESETS[meta.colorIndex % CATEGORY_PRESETS.length];
    return (
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-10">
        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setSelectedCategory(null); setSelectMode(false); setSelectedComics(new Set()); }}
                className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center border shadow-lg" style={{ backgroundColor: `${preset.color}15`, borderColor: `${preset.color}35`, color: preset.color, boxShadow: `0 4px 20px -4px ${preset.color}30` }}>
                  <CategoryIcon icon={meta.icon} />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tight">{selectedCategory}</h1>
                  <p className="text-sm text-slate-500 font-medium">{filteredComics.length} {filteredComics.length === 1 ? "cómic" : "cómics"}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectMode && (
                <>
                  <button onClick={toggleSelectAll} className="pl-btn text-xs">
                    {allSelected ? "Desmarcar todo" : "Seleccionar todo"}
                  </button>
                  {selectedComics.size > 0 && (
                    <>
                      <button onClick={() => setMovingTo("__open")} className="pl-btn-primary text-xs flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        Mover ({selectedComics.size})
                      </button>
                      <button onClick={() => setConfirmDeleteComics(true)} className="px-3 py-2 rounded-xl text-xs font-bold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all">
                        Eliminar ({selectedComics.size})
                      </button>
                    </>
                  )}
                  <button onClick={() => { setSelectMode(false); setSelectedComics(new Set()); }} className="text-xs text-slate-500 hover:text-white px-2">
                    Cancelar
                  </button>
                </>
              )}
              {!selectMode && (
                <>
                  <button
                    onClick={() => setSelectMode(true)}
                    className="pl-btn text-xs flex items-center gap-1.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    Gestionar
                  </button>
                  <button
                    onClick={() => setCustomizingCategory(selectedCategory)}
                    className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Personalizar categoría"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                  <button
                    onClick={() => { setEditingCategory(selectedCategory); setNewNameDraft(selectedCategory); }}
                    className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    title="Renombrar categoría"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"/></svg>
                  </button>
                  <button
                    onClick={() => setConfirmDeleteCategory(selectedCategory)}
                    className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    title="Eliminar categoría"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </>
              )}
            </div>
          </header>

          {filteredComics.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(() => {
                const totalPages = filteredComics.reduce((s, c) => s + c.pageCount, 0);
                const readPages = filteredComics.reduce((s, c) => s + c.currentPage, 0);
                const completed = filteredComics.filter((c) => c.completed).length;
                const favorites = filteredComics.filter((c) => c.isFavorite).length;
                const progressPct = totalPages > 0 ? Math.round((readPages / totalPages) * 100) : 0;
                const cards = [
                  { label: "Progreso", value: `${progressPct}%`, sub: `${readPages.toLocaleString()} / ${totalPages.toLocaleString()} págs`, color: "text-blue-400", bg: "from-blue-500/10 to-transparent", border: "border-blue-500/20" },
                  { label: "Completados", value: `${completed}`, sub: `de ${filteredComics.length}`, color: "text-emerald-400", bg: "from-emerald-500/10 to-transparent", border: "border-emerald-500/20" },
                  { label: "Favoritos", value: `${favorites}`, sub: `en esta categoría`, color: "text-amber-400", bg: "from-amber-500/10 to-transparent", border: "border-amber-500/20" },
                  { label: "Tiempo est.", value: `${Math.round(totalPages * 0.8)}m`, sub: "lectura aprox.", color: "text-purple-400", bg: "from-purple-500/10 to-transparent", border: "border-purple-500/20" },
                ];
                return cards.map((card) => (
                  <div key={card.label} className={clsx("rounded-2xl border bg-gradient-to-br p-4 space-y-1.5 shadow-sm", card.border, card.bg)}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{card.label}</p>
                    <p className={clsx("text-2xl font-black tracking-tight", card.color)}>{card.value}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{card.sub}</p>
                  </div>
                ));
              })()}
            </div>
          )}

          {filteredComics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="mb-4"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500 mx-auto"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg></div>
              <h3 className="text-xl font-bold text-white mb-2">Categoría vacía</h3>
              <p className="text-slate-500">No hay cómics en esta categoría todavía.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-8 pl-stagger pl-card-grid">
              {filteredComics.map((c) => (
                <div key={c.id} className="relative">
                  {selectMode && (
                    <button
                      onClick={() => toggleComicSelection(c.id)}
                      className={clsx(
                        "absolute -top-2 -left-2 z-20 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                        selectedComics.has(c.id)
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "bg-white/10 border-white/30 text-transparent hover:border-white/60"
                      )}
                    >
                      {selectedComics.has(c.id) && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                      )}
                    </button>
                  )}
                  <CoverCard comic={c} size="md" onToggleFavorite={toggleFavorite} />
                </div>
              ))}
            </div>
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

        {/* Rename Modal */}
        <AnimatedModal
          open={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          panelClassName="rounded-3xl bg-ink-900 border border-white/10 p-6 w-full max-w-sm space-y-4 shadow-2xl"
        >
          <h3 className="text-lg font-bold text-white">Renombrar categoría</h3>
          <input
            value={newNameDraft}
            onChange={(e) => setNewNameDraft(e.target.value)}
            className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") renameCategory(editingCategory!, newNameDraft); }}
          />
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setEditingCategory(null)} className="pl-btn text-xs">Cancelar</button>
            <button onClick={() => renameCategory(editingCategory!, newNameDraft)} className="pl-btn-primary text-xs">Guardar</button>
          </div>
        </AnimatedModal>

        {/* Delete Category Confirm */}
        <AnimatedModal
          open={!!confirmDeleteCategory}
          onClose={() => setConfirmDeleteCategory(null)}
          panelClassName="rounded-3xl bg-ink-900 border border-white/10 p-6 w-full max-w-sm space-y-4 shadow-2xl"
        >
          <h3 className="text-lg font-bold text-white">¿Eliminar categoría?</h3>
          <p className="text-sm text-slate-400">
            Se quitará la etiqueta "{confirmDeleteCategory}" de todos los cómics. Los cómics no se eliminarán.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setConfirmDeleteCategory(null)} className="pl-btn text-xs">Cancelar</button>
            <button onClick={() => deleteCategory(confirmDeleteCategory!)} className="px-3 py-2 rounded-xl text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all">Eliminar</button>
          </div>
        </AnimatedModal>

        {/* Delete Comics Confirm */}
        <AnimatedModal
          open={confirmDeleteComics}
          onClose={() => setConfirmDeleteComics(false)}
          panelClassName="rounded-3xl bg-ink-900 border border-white/10 p-6 w-full max-w-sm space-y-4 shadow-2xl"
        >
          <h3 className="text-lg font-bold text-white">¿Eliminar cómics?</h3>
          <p className="text-sm text-slate-400">
            Se eliminarán permanentemente {selectedComics.size} cómic(s) de tu biblioteca.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setConfirmDeleteComics(false)} className="pl-btn text-xs">Cancelar</button>
            <button onClick={deleteSelectedComics} className="px-3 py-2 rounded-xl text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all">Eliminar</button>
          </div>
        </AnimatedModal>

        {/* Move Comics Modal */}
        <AnimatedModal
          open={movingTo === "__open"}
          onClose={() => setMovingTo(null)}
          panelClassName="rounded-3xl bg-ink-900 border border-white/10 p-6 w-full max-w-sm space-y-4 shadow-2xl"
        >
          <h3 className="text-lg font-bold text-white">Mover a categoría</h3>
          {otherCategories.length === 0 ? (
            <p className="text-sm text-slate-500">No hay otras categorías. Crea una nueva en la biblioteca primero.</p>
          ) : (
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {otherCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => moveSelectedToCategory(cat)}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <span className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                  {cat}
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
            <button onClick={() => setMovingTo(null)} className="pl-btn text-xs">Cancelar</button>
            <div className="flex-1">
              <input
                placeholder="Nueva categoría..."
                className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.currentTarget as HTMLInputElement).value.trim();
                    if (val) moveSelectedToCategory(val);
                  }
                }}
              />
            </div>
          </div>
        </AnimatedModal>

        {/* Customize Category Modal */}
        <AnimatedModal
          open={!!customizingCategory}
          onClose={() => setCustomizingCategory(null)}
          panelClassName="rounded-3xl bg-ink-900 border border-white/10 p-6 w-full max-w-md space-y-5 shadow-2xl"
        >
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-xl"><CategoryIcon icon={getOrCreateMeta(customizingCategory!, 0).icon} /></span>
            Personalizar "{customizingCategory}"
          </h3>
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Color</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => updateCategoryMeta(customizingCategory!, { colorIndex: i })}
                  className={clsx(
                    "h-8 w-8 rounded-lg transition-all",
                    getOrCreateMeta(customizingCategory!, 0).colorIndex === i ? "ring-2 ring-white scale-110" : "hover:scale-110"
                  )}
                  style={{ backgroundColor: p.color }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Icono</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => updateCategoryMeta(customizingCategory!, { icon })}
                  className={clsx(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all",
                    getOrCreateMeta(customizingCategory!, 0).icon === icon
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-white/5 border border-transparent hover:bg-white/10 text-slate-400"
                  )}
                >
                  <CategoryIcon icon={icon} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={() => setCustomizingCategory(null)} className="pl-btn-primary text-xs">Listo</button>
          </div>
        </AnimatedModal>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-10">
      <div className="max-w-6xl mx-auto space-y-10 animate-fade-in">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Categorías
            </h1>
            <p className="text-slate-400 font-medium text-lg">
              Organiza, personaliza y gestiona tu colección
            </p>
          </div>
          <button
            onClick={() => { clickSound(); setCreateOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/10 border border-blue-500/20 text-sm font-bold text-blue-300 hover:text-white hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-95"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Crear categoría
          </button>
        </header>

        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-fade-in">
            <div className="h-24 w-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-6 shadow-2xl">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sin categorías aún</h3>
            <p className="text-slate-500 max-w-xs mx-auto font-medium">
              Asigna categorías a tus cómics para organizarlos mejor. Usa la opción "Gestionar" en la biblioteca.
            </p>
            <Link to="/" className="mt-6 pl-btn-primary inline-flex">
              Ir a la biblioteca
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pl-stagger">
              {groups.map((group) => {
                const meta = getOrCreateMeta(group.name, group.colorIndex);
                const preset = CATEGORY_PRESETS[meta.colorIndex % CATEGORY_PRESETS.length];
                return (
                  <button
                    key={group.name}
                    onClick={() => setSelectedCategory(group.name)}
                    className={clsx(
                      "group relative overflow-hidden rounded-[1.25rem] border border-white/[0.06] bg-gradient-to-br p-6 text-left transition-all duration-300",
                      "hover:border-white/[0.12] hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/30 active:scale-[0.98]",
                      preset.gradient
                    )}
                  >
                    <div className="absolute top-3 right-3 opacity-30 group-hover:opacity-60 group-hover:scale-110 transition-all duration-300">
                      <CategoryIcon icon={meta.icon} />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-white transition-colors">
                          {group.name}
                        </h3>
                        <p className="text-sm text-slate-400 font-medium mt-1">
                          {group.count} {group.count === 1 ? "cómic" : "cómics"}
                        </p>
                      </div>
                      <div className="flex -space-x-2">
                        {group.comics.slice(0, 4).map((c) => (
                          <img
                            key={c.id}
                            src={`/api/comics/${c.id}/cover`}
                            alt=""
                            className="h-10 w-8 rounded-lg object-cover border-2 border-white/10 bg-white/5 shadow-sm"
                            loading="lazy"
                          />
                        ))}
                        {group.comics.length > 4 && (
                          <div className="h-10 w-8 rounded-lg border-2 border-white/10 bg-white/5 flex items-center justify-center text-[10px] font-bold text-slate-400">
                            +{group.comics.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.02] transition-colors" />
                  </button>
                );
              })}
            </div>

            {groups.length > 0 && (
              <section className="space-y-4 pt-6 border-t border-white/5">
                <h2 className="text-lg font-black text-white tracking-tight">Nube de etiquetas</h2>
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => (
                    <CategoryBadge
                      key={g.name}
                      label={`${g.name} (${g.count})`}
                      variant="default"
                      onClick={() => setSelectedCategory(g.name)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Create Category Modal */}
        <AnimatedModal
          open={createOpen}
          onClose={() => { setCreateOpen(false); setCreateName(""); setCreateColor(0); setCreateIcon("book"); }}
          panelClassName="rounded-3xl bg-ink-900 border border-white/10 p-6 w-full max-w-md space-y-5 shadow-2xl"
        >
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-xl"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></span>
            Nueva categoría
          </h3>
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nombre</label>
            <input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Ej: Marvel, Manga, Favoritos..."
              autoFocus
              className="w-full rounded-xl bg-white/[0.03] border border-white/10 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
              onKeyDown={(e) => { if (e.key === "Enter") createCategory(); }}
            />
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Color</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setCreateColor(i)}
                  className={clsx(
                    "h-8 w-8 rounded-lg transition-all",
                    createColor === i ? "ring-2 ring-white scale-110" : "hover:scale-110"
                  )}
                  style={{ backgroundColor: p.color }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Icono</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setCreateIcon(icon)}
                  className={clsx(
                    "h-9 w-9 rounded-xl flex items-center justify-center transition-all",
                    createIcon === icon
                      ? "bg-white/10 border border-white/20 text-white"
                      : "bg-white/5 border border-transparent hover:bg-white/10 text-slate-400"
                  )}
                >
                  <CategoryIcon icon={icon} />
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => { setCreateOpen(false); setCreateName(""); setCreateColor(0); setCreateIcon("book"); }} className="pl-btn text-xs">Cancelar</button>
            <button onClick={createCategory} className="pl-btn-primary text-xs">Crear</button>
          </div>
        </AnimatedModal>
      </div>
    </div>
  );
}
