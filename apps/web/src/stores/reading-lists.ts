import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ComicSummary } from "../lib/api";

export interface ReadingList {
  id: string;
  name: string;
  description?: string;
  color: string;
  comicIds: string[];
  createdAt: number;
  updatedAt: number;
}

interface ReadingListsStore {
  lists: ReadingList[];
  createList: (name: string, description?: string, color?: string) => string;
  deleteList: (listId: string) => void;
  updateList: (listId: string, name: string, description?: string, color?: string) => void;
  addComicToList: (listId: string, comicId: string) => void;
  removeComicFromList: (listId: string, comicId: string) => void;
  getComicsInList: (listId: string, allComics: ComicSummary[]) => ComicSummary[];
  isComicInList: (listId: string, comicId: string) => boolean;
}

const DEFAULT_COLORS = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899"];

export const useReadingListsStore = create<ReadingListsStore>()(
  persist(
    (set, get) => ({
      lists: [],
      createList: (name, description, color) => {
        const id = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newList: ReadingList = {
          id,
          name,
          description,
          color: color || DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
          comicIds: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ lists: [...state.lists, newList] }));
        return id;
      },
      deleteList: (listId) => {
        set((state) => ({
          lists: state.lists.filter((l) => l.id !== listId),
        }));
      },
      updateList: (listId, name, description, color) => {
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId ? { ...l, name, description, color: color || l.color, updatedAt: Date.now() } : l
          ),
        }));
      },
      addComicToList: (listId, comicId) => {
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId && !l.comicIds.includes(comicId)
              ? { ...l, comicIds: [...l.comicIds, comicId], updatedAt: Date.now() }
              : l
          ),
        }));
      },
      removeComicFromList: (listId, comicId) => {
        set((state) => ({
          lists: state.lists.map((l) =>
            l.id === listId
              ? { ...l, comicIds: l.comicIds.filter((p) => p !== comicId), updatedAt: Date.now() }
              : l
          ),
        }));
      },
      getComicsInList: (listId, allComics) => {
        const list = get().lists.find((l) => l.id === listId);
        if (!list) return [];
        return allComics.filter((c) => list.comicIds.includes(c.id));
      },
      isComicInList: (listId, comicId) => {
        const list = get().lists.find((l) => l.id === listId);
        return list?.comicIds.includes(comicId) ?? false;
      },
    }),
    {
      name: "percy-reading-lists",
    }
  )
);

export function useDefaultLists() {
  const createList = useReadingListsStore((s) => s.createList);
  const lists = useReadingListsStore((s) => s.lists);

  // Ensure default lists exist
  const hasToRead = lists.some((l) => l.name === "Por Leer");
  const hasReading = lists.some((l) => l.name === "Leyendo");
  const hasCompleted = lists.some((l) => l.name === "Completados");

  if (!hasToRead) createList("Por Leer", "Cómics pendientes de leer", "#3B82F6");
  if (!hasReading) createList("Leyendo", "Cómics en lectura", "#F59E0B");
  if (!hasCompleted) createList("Completados", "Cómics completados", "#10B981");

  return {
    toRead: lists.find((l) => l.name === "Por Leer"),
    reading: lists.find((l) => l.name === "Leyendo"),
    completed: lists.find((l) => l.name === "Completados"),
  };
}
