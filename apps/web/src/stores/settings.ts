import { create } from "zustand";
import { api, type SettingsDto } from "../lib/api";

const CACHE_KEY = "pl_settings_snapshot_v1";

/** API responses may omit these; they live in the client snapshot only. */
const LOCAL_ONLY_SNAPSHOT_KEYS: (keyof SettingsDto)[] = [
  "particlesEnabled",
  "neonMode",
  "soundEffects",
  "confettiOnComplete",
  "readerDisablePreload",
  "readerLowMemoryMode",
  "readerNightMode",
  "readerCinemaMode",
];

/** Bumped when a fetch starts and when `replaceFromServer` runs so a stale
 *  in-flight GET cannot overwrite a just-reset profile (or vice versa). */
let settingsFetchEpoch = 0;

function mergeServerWithLocalSnapshot(server: SettingsDto, cached: SettingsDto | null): SettingsDto {
  if (!cached) return server;
  const overlay: Partial<SettingsDto> = {};
  for (const key of LOCAL_ONLY_SNAPSHOT_KEYS) {
    const v = cached[key];
    if (v !== undefined) (overlay as Record<string, unknown>)[key as string] = v;
  }
  return { ...server, ...overlay };
}

function readCachedSettings(): SettingsDto | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as SettingsDto) : null;
  } catch {
    return null;
  }
}

function cacheSettings(settings: SettingsDto) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage quota/private mode failures
  }
}

interface SettingsState {
  settings: SettingsDto | null;
  /** Last error from a load() call, surfaced to the UI so we don't get
   *  stuck on a blank loading screen forever when the server is down. */
  error: string | null;
  load: () => Promise<void>;
  update: (patch: Partial<SettingsDto>) => Promise<void>;
  /** Replace in-memory + snapshot cache with an authoritative server row
   *  (e.g. after reset-profile). Skips merge-with-stale-cache used by load(). */
  replaceFromServer: (settings: SettingsDto) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: readCachedSettings(),
  error: null,
  async load() {
    const myEpoch = ++settingsFetchEpoch;
    try {
      const settings = await api.settings();
      if (myEpoch !== settingsFetchEpoch) return;
      const cached = readCachedSettings();
      const merged = mergeServerWithLocalSnapshot(settings, cached);
      if (myEpoch !== settingsFetchEpoch) return;
      cacheSettings(merged);
      set({ settings: merged, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo cargar la configuración";
      set({ error: message });
      // Don't blow away cached settings if a refresh fails — the user
      // can keep navigating with their last-known good values.
    }
  },
  async update(patch) {
    const current = get().settings;
    // Optimistic update for snappy UI; if the server rejects we'll roll
    // back to the server's authoritative response below.
    if (current) set({ settings: { ...current, ...patch } });
    try {
      const updated = await api.updateSettings(patch);
      // Preserve any local-only fields that the server didn't return
      // (e.g. experimental reader toggles the backend doesn't store).
      const preserved: SettingsDto = { ...updated };
      if (current) {
        for (const key of Object.keys(current) as (keyof SettingsDto)[]) {
          if (!(key in updated)) {
            (preserved as any)[key] = current[key];
          }
        }
      }
      cacheSettings(preserved);
      set({ settings: preserved, error: null });
    } catch (err) {
      // Roll back the optimistic patch and re-fetch to recover canonical state.
      if (current) {
        cacheSettings(current);
        set({ settings: current });
      }
      const message = err instanceof Error ? err.message : "No se pudieron guardar los cambios";
      set({ error: message });
      throw err;
    }
  },
  replaceFromServer(settings) {
    settingsFetchEpoch++;
    cacheSettings(settings);
    set({ settings, error: null });
  },
}));
