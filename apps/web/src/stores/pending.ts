import { create } from "zustand";

const KEY = "pl_pending_v1";

function read(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function write(ids: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore
  }
}

interface PendingState {
  ids: Set<string>;
  toggle: (id: string) => void;
  toggleMany: (ids: string[]) => { added: number; removed: number };
  isPending: (id: string) => boolean;
  clear: () => void;
}

export const usePendingStore = create<PendingState>((set, get) => ({
  ids: read(),
  toggle(id: string) {
    const next = new Set(get().ids);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    write(next);
    set({ ids: next });
  },
  toggleMany(ids: string[]) {
    const next = new Set(get().ids);
    let added = 0;
    let removed = 0;
    for (const id of ids) {
      if (next.has(id)) {
        next.delete(id);
        removed++;
      } else {
        next.add(id);
        added++;
      }
    }
    write(next);
    set({ ids: next });
    return { added, removed };
  },
  isPending(id: string) {
    return get().ids.has(id);
  },
  clear() {
    write(new Set());
    set({ ids: new Set() });
  },
}));
