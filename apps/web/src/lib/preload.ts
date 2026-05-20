import type { ComponentType } from "react";

type LazyComponent = () => Promise<{ default: ComponentType<unknown> }>;

const preloaded = new Set<string>();
const loading = new Map<string, Promise<{ default: ComponentType<unknown> }>>();

export function preloadRoute(getComponent: LazyComponent, routeKey: string): void {
  if (preloaded.has(routeKey)) return;
  if (loading.has(routeKey)) return;

  preloaded.add(routeKey);
  
  getComponent().catch((err) => {
    preloaded.delete(routeKey);
    loading.delete(routeKey);
    console.warn(`Failed to preload route ${routeKey}:`, err);
  });
}

export function warmupRoutes(): void {
  const routes = [
    () => import("../routes/Stats"),
    () => import("../routes/Achievements"),
  ];
  
  routes.forEach((getter, idx) => {
    const key = `stats-${idx}`;
    if (!preloaded.has(key)) {
      getter().catch(() => {}).finally(() => {
        preloaded.add(key);
      });
    }
  });
}

if (typeof window !== "undefined" && "requestIdleCallback" in window) {
  (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
    setTimeout(warmupRoutes, 5000);
  });
} else {
  setTimeout(warmupRoutes, 5000);
}