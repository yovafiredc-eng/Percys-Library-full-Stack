import type { ComicSummary } from "./api";

const META_KEY = "pl-category-meta-v1";

export function loadStoredCategoryNames(): string[] {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return Object.keys(parsed).filter((name) => name.trim() && name.trim().toLowerCase() !== "null");
  } catch {
    return [];
  }
}

export function collectAvailableCategoryNames(comics: ComicSummary[]): string[] {
  const set = new Set<string>();
  for (const comic of comics) {
    if (comic.category) set.add(comic.category.trim());
    for (const tag of comic.categories) {
      const trimmed = tag.trim();
      if (trimmed) set.add(trimmed);
    }
  }
  for (const name of loadStoredCategoryNames()) {
    set.add(name.trim());
  }
  return Array.from(set).filter((name) => name.trim().toLowerCase() !== "null").sort((a, b) => a.localeCompare(b));
}