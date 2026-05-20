import { memo, useState, useEffect, useRef } from "react";
import clsx from "clsx";

interface OptimizedImageProps {
  src: string;
  srcSet?: string;
  alt: string;
  className?: string;
  aspectRatio?: "video" | "portrait" | "square";
  priority?: boolean;
}

const aspectClasses = {
  video: "aspect-video",
  portrait: "aspect-[2/3]",
  square: "aspect-square",
};

export const OptimizedImage = memo(function OptimizedImage({
  src,
  srcSet,
  alt,
  className,
  aspectRatio = "portrait",
  priority = false,
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, [priority]);

  useEffect(() => {
    if (!visible || !imgRef.current) return;
    
    const img = imgRef.current;
    if (img.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [visible]);

  return (
    <div className={clsx("relative overflow-hidden bg-ink-900", aspectClasses[aspectRatio], className)}>
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-ink-800 to-black" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-900 text-slate-500 text-xs">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
        </div>
      ) : visible ? (
        <img
          ref={imgRef}
          src={src}
          srcSet={srcSet}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          onLoad={(e) => {
            if ((e.currentTarget as HTMLImageElement).naturalWidth > 0) {
              setLoaded(true);
            }
          }}
          onError={() => setError(true)}
          className={clsx(
            "h-full w-full object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      ) : null}
    </div>
  );
});