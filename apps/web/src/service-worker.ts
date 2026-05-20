/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "percys-library-v1";
const STATIC_CACHE = "percys-static-v1";

const staticAssets = [
  "/",
  "/index.html",
  "/manifest.json",
];

// Assets that should be cached on first request
const networkFirst = [
  /\.html$/,
  /\.json$/,
  /\/api\//,
];

// Assets that should be cached with network fallback
const cacheFirst = [
  /\.js$/,
  /\.css$/,
  /\.woff2?$/,
  /\.ttf$/,
  /\.eot$/,
  /\.svg$/,
  /\.png$/,
  /\.jpg$/,
  /\.jpeg$/,
  /\.webp$/,
  /\.gif$/,
  /\.ico$/,
];

// Install event
self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(staticAssets).catch(() => {
        // Silently fail if some assets aren't available yet
      });
    }),
  );
  (self as any).skipWaiting();
});

// Activate event
self.addEventListener("activate", (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  (self.clients as any).claim();
});

// Fetch event
self.addEventListener("fetch", (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin and non-GET requests
  if (url.origin !== self.location.origin || request.method !== "GET") {
    return;
  }

  // Network first for API & HTML
  if (networkFirst.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            return new Response("Offline", { status: 503 });
          });
        }),
    );
    return;
  }

  // Cache first for assets
  if (cacheFirst.some((pattern) => pattern.test(url.pathname))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const cache = caches.open(STATIC_CACHE);
              cache.then((c) => c.put(request, response.clone()));
            }
            return response;
          })
          .catch(() => new Response("Offline", { status: 503 }));
      }),
    );
    return;
  }

  // Default: network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && (response.type === "basic" || response.type === "cors")) {
          const cache = caches.open(CACHE_NAME);
          cache.then((c) => c.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || new Response("Offline", { status: 503 }))),
  );
});

export {};


