import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Bookmark {
  id: string;
  comicId: string;
  comicTitle: string;
  page: number;
  note?: string;
  createdAt: number;
}

interface BookmarksStore {
  bookmarks: Bookmark[];
  addBookmark: (comicId: string, comicTitle: string, page: number, note?: string) => void;
  removeBookmark: (bookmarkId: string) => void;
  updateBookmark: (bookmarkId: string, note?: string) => void;
  getBookmarksForComic: (comicId: string) => Bookmark[];
  getAllBookmarks: () => Bookmark[];
}

export const useBookmarksStore = create<BookmarksStore>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      addBookmark: (comicId, comicTitle, page, note) => {
        const bookmark: Bookmark = {
          id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          comicId,
          comicTitle,
          page,
          note,
          createdAt: Date.now(),
        };
        set((state) => ({
          bookmarks: [...state.bookmarks, bookmark],
        }));
      },
      removeBookmark: (bookmarkId) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((bm) => bm.id !== bookmarkId),
        }));
      },
      updateBookmark: (bookmarkId, note) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((bm) =>
            bm.id === bookmarkId ? { ...bm, note } : bm
          ),
        }));
      },
      getBookmarksForComic: (comicId) => {
        return get().bookmarks.filter((bm) => bm.comicId === comicId).sort((a, b) => a.page - b.page);
      },
      getAllBookmarks: () => {
        return get().bookmarks.sort((a, b) => b.createdAt - a.createdAt);
      },
    }),
    {
      name: "percy-bookmarks",
    }
  )
);
