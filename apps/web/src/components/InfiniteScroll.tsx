import { useEffect, useRef, useCallback, useState } from "react";

interface InfiniteScrollProps {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
  children: React.ReactNode;
}

export function InfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 500,
  children,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || isLoading || !hasMore) return;
    setIsLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoadingMore(false);
    }
  }, [onLoadMore, isLoading, hasMore, isLoadingMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          void handleLoadMore();
        }
      },
      {
        rootMargin: `${threshold}px 0px`,
      }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, handleLoadMore, threshold]);

  return (
    <>
      {children}
      {(hasMore || isLoadingMore) && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-medium">
              {isLoadingMore ? "Cargando..." : "Cargando más..."}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
