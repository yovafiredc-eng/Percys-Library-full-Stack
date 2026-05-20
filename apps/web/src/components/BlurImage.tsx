import { useState, useEffect, useRef } from "react";
import clsx from "clsx";

interface Props {
  src: string;
  alt: string;
  className?: string;
  blurDataUrl?: string;
}

export function BlurImage({ src, alt, className, blurDataUrl }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setLoaded(true);
      if (imgRef.current) {
        imgRef.current.src = src;
      }
    };
    img.onerror = () => setError(true);
    img.src = src;
  }, [src]);

  return (
    <div className={clsx("relative overflow-hidden", className)}>
      {/* Blur placeholder */}
      {blurDataUrl && !loaded && (
        <img
          src={blurDataUrl}
          alt={alt}
          className="absolute inset-0 w-full h-full blur-md"
          aria-hidden="true"
        />
      )}
      {!blurDataUrl && !loaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 animate-pulse" />
      )}

      {/* Main image */}
      {!error ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={clsx(
            "w-full h-full object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </div>
      )}
    </div>
  );
}
