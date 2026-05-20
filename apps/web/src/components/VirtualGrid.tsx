import { useEffect, useRef, useState, useCallback, memo } from "react";

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemSize: { width: string; height: string };
  gap: string;
  columns?: number;
  overscan?: number;
}

/**
 * Virtual scrolling grid optimized for large lists of comics.
 * Renders only visible items + overscan buffer to reduce DOM nodes.
 * Automatically adjusts columns on window resize (2 col mobile, 3 col tablet, 4+ col desktop).
 */
export const VirtualGrid = memo(function VirtualGrid<T>({
  items,
  renderItem,
  itemSize,
  gap,
  columns: initialColumns = 3,
  overscan = 2,
}: VirtualGridProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [columns, setColumns] = useState(initialColumns);
  const itemHeightPx = useRef(0);

  // Detect columns dynamically based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const gapPx = parseInt(gap, 10) || 0;
      const itemWidthPx = parseInt(itemSize.width, 10) || 150;
      
      // Mobile-first: 2 cols on small screens
      let cols = 2;
      if (width > 768) cols = 3;  // tablet
      if (width > 1024) cols = 4; // desktop
      if (width > 1536) cols = 5; // large desktop
      
      // Fallback to calculated columns if custom size
      const calculated = Math.max(cols, Math.floor((width + gapPx) / (itemWidthPx + gapPx)));
      setColumns(calculated);
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [gap, itemSize.width]);

  // Virtual scroll handler
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const itemHeightPx_ = parseInt(itemSize.height, 10) || 200;
    const gapPx = parseInt(gap, 10) || 0;
    const rowHeight = itemHeightPx_ + gapPx;

    itemHeightPx.current = itemHeightPx_;

    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.ceil((scrollTop + clientHeight) / rowHeight) + overscan;

    const start = startRow * columns;
    const end = Math.min(items.length, endRow * columns);

    setVisibleRange({ start, end });
  }, [items.length, columns, gap, itemSize.height, overscan]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const itemHeightPx_ = parseInt(itemSize.height, 10) || 200;
  const gapPx = parseInt(gap, 10) || 0;
  const rowHeight = itemHeightPx_ + gapPx;
  const visibleStartRow = Math.floor(visibleRange.start / columns);
  const offsetTop = visibleStartRow * rowHeight;
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const totalRows = Math.ceil(items.length / columns);
  const totalHeight = totalRows * rowHeight;

  return (
    <div
      ref={containerRef}
      className="w-full flex-1 overflow-y-auto overflow-x-hidden no-scrollbar"
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetTop}px)`,
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap,
            padding: "1rem",
            transition: "none",
          }}
        >
          {visibleItems.map((item, idx) =>
            renderItem(item, visibleRange.start + idx)
          )}
        </div>
      </div>
    </div>
  );
});

VirtualGrid.displayName = "VirtualGrid";

