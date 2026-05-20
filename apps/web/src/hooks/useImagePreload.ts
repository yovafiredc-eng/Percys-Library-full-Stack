import { useEffect, useRef } from "react";

/**
 * Pre-fetch nearby pages so transitions feel instant. Holds onto the
 * created Image objects until they fall out of the active window so the
 * browser can keep them in cache without retaining giant decoded buffers.
 *
 * Improvements:
 * - Max cache size of 12 images to prevent memory bloat on large comics.
 * - Abort in-flight loads when URLs change rapidly (e.g. fast page skipping).
 * - 6s per-image timeout so a stalled preload doesn't block the pipeline.
 */
const MAX_PRELOAD_CACHE = 12;
const PRELOAD_TIMEOUT_MS = 6000;

export function useImagePreload(urls: string[]) {
  const cacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const abortRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Abort any in-flight loads from the previous cycle before starting new ones.
    for (const abort of abortRef.current) abort();
    abortRef.current = [];

    const cache = cacheRef.current;
    const wanted = new Set(urls);

    // Clean up URLs that are no longer needed.
    for (const [url, img] of [...cache.entries()]) {
      if (!wanted.has(url)) {
        // Cancel pending request by clearing src
        img.src = "";
        cache.delete(url);
      }
    }

    // If cache is already at max, don't add more until some fall out.
    let added = 0;
    for (const url of urls) {
      if (cache.has(url)) continue;
      if (cache.size + added >= MAX_PRELOAD_CACHE) break;

      const img = new Image();
      img.decoding = "async";

      let timeoutId = window.setTimeout(() => {
        // If it hasn't loaded within the timeout, clear src to free the slot.
        img.src = "";
      }, PRELOAD_TIMEOUT_MS);

      const onLoadOrError = () => {
        window.clearTimeout(timeoutId);
      };

      img.addEventListener("load", onLoadOrError, { once: true });
      img.addEventListener("error", onLoadOrError, { once: true });

      // Track abort so rapid page changes can cancel pending loads.
      abortRef.current.push(() => {
        window.clearTimeout(timeoutId);
        img.src = "";
      });

      img.src = url;
      cache.set(url, img);
      added++;
    }
  }, [urls]);

  // Final cleanup on unmount.
  useEffect(() => {
    return () => {
      for (const abort of abortRef.current) abort();
      abortRef.current = [];
      for (const img of cacheRef.current.values()) {
        img.src = "";
      }
      cacheRef.current.clear();
    };
  }, []);
}
