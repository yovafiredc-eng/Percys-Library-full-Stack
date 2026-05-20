import { api } from "../../lib/api";

interface Props {
  /** When the user opens the reader from the library grid we already
   * know the title; showing it on the loading screen feels more honest
   * than a generic "Cargando…" spinner. */
  title?: string | null;
  comicId?: string | null;
}

/**
 * Cinematic full-screen loading state with blurred cover backdrop,
 * comic title and elegant dot pulse — inspired by premium streaming apps.
 */
export function ReaderLoading({ title, comicId }: Props) {
  const coverUrl = comicId ? api.coverUrl(comicId) : null;

  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden bg-[#030408]">
      {/* Blurred cover backdrop */}
      {coverUrl && (
        <>
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${coverUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(60px) saturate(1.3)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030408] via-[#030408]/80 to-transparent" />
        </>
      )}

      <div className="relative z-10 flex flex-col items-center gap-6 px-6">
        {/* Cover thumbnail */}
        <div className="relative h-48 w-36 md:h-60 md:w-44 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 animate-scale-in">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-white/[0.04] grid place-items-center">
              <span className=""><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg></span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
            Cargando cómic
          </div>
          <div
            className="line-clamp-2 max-w-[16rem] text-lg font-bold text-white"
            title={title ?? undefined}
          >
            {title?.trim() || "Preparando lectura"}
          </div>
          {/* Elegant dot pulse */}
          <div className="mt-2 flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block h-1.5 w-1.5 rounded-full bg-white/60"
                style={{
                  animation: `bounceSoft 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
