import { useId } from "react";
import clsx from "clsx";

// Built-in logo presets. Inline SVGs so they ship without extra
// requests and re-tint with the active accent through `currentColor`.
// Inspired by Discord server icons: pick one of N glyph + colour combos,
// or upload your own.
const LOGO_PRESETS = [
  {
    id: "book",
    grad: ["#3b82f6", "#7c3aed"],
    shape: (
      <>
        <path d="M16 20.5C16 18.567 17.567 17 19.5 17H30v26H19.5C17.567 43 16 41.433 16 39.5V20.5Z" fill="#ffffff" fillOpacity={0.92} />
        <path d="M34 17h10.5C46.433 17 48 18.567 48 20.5V39.5C48 41.433 46.433 43 44.5 43H34V17Z" fill="#ffffff" fillOpacity={0.78} />
        <path d="M30 17v26" stroke="#1e293b" strokeWidth={1.4} strokeOpacity={0.18} />
        <path d="M37 22h7M37 27h7M37 32h5" stroke="#1e293b" strokeWidth={1.6} strokeLinecap="round" strokeOpacity={0.45} />
        <path d="M20 22h7M20 27h7M20 32h5" stroke="#1e293b" strokeWidth={1.6} strokeLinecap="round" strokeOpacity={0.45} />
        <path d="M40 17l4 0v9l-2-1.6L40 26v-9Z" fill="#fbbf24" />
      </>
    ),
  },
  {
    id: "stack",
    grad: ["#10b981", "#0ea5e9"],
    shape: (
      <>
        <rect x="14" y="18" width="36" height="6" rx="2" fill="#ffffff" fillOpacity={0.95} />
        <rect x="16" y="28" width="32" height="6" rx="2" fill="#ffffff" fillOpacity={0.7} />
        <rect x="20" y="38" width="24" height="6" rx="2" fill="#ffffff" fillOpacity={0.5} />
      </>
    ),
  },
  {
    id: "bookmark",
    grad: ["#f43f5e", "#a855f7"],
    shape: (
      <>
        <path d="M21 14h22a3 3 0 0 1 3 3v33l-14-8-14 8V17a3 3 0 0 1 3-3Z" fill="#ffffff" fillOpacity={0.95} />
        <path d="M32 18v18M26 24h12" stroke="#1e293b" strokeWidth={1.8} strokeLinecap="round" strokeOpacity={0.45} />
      </>
    ),
  },
  {
    id: "spark",
    grad: ["#f59e0b", "#ef4444"],
    shape: (
      <>
        <path d="M32 14l4 10 10 4-10 4-4 10-4-10-10-4 10-4 4-10Z" fill="#ffffff" fillOpacity={0.95} />
      </>
    ),
  },
  {
    id: "letter-p",
    grad: ["#6366f1", "#8b5cf6"],
    shape: (
      <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" fontFamily="Inter, system-ui, sans-serif" fontWeight={900} fontSize={36} fill="#ffffff">P</text>
    ),
  },
  {
    id: "manga",
    grad: ["#0ea5e9", "#22d3ee"],
    shape: (
      <>
        <circle cx="32" cy="32" r="14" fill="#ffffff" fillOpacity={0.95} />
        <path d="M27 30c-1.5 0-2.5 1-2.5 2.5M37 30c1.5 0 2.5 1 2.5 2.5" stroke="#1e293b" strokeWidth={2.2} strokeLinecap="round" />
      </>
    ),
  },
  {
    id: "minimal",
    grad: ["#475569", "#0f172a"],
    shape: (
      <>
        <rect x="20" y="20" width="24" height="24" rx="6" fill="none" stroke="#ffffff" strokeWidth={2.5} strokeOpacity={0.9} />
        <path d="M26 32h12" stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" strokeOpacity={0.9} />
      </>
    ),
  },
  {
    id: "comic",
    grad: ["#ec4899", "#fb923c"],
    shape: (
      <>
        <path d="M18 22a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H30l-6 6v-6h-2a4 4 0 0 1-4-4V22Z" fill="#ffffff" fillOpacity={0.95} />
        <circle cx="27" cy="30" r="2.2" fill="#1e293b" fillOpacity={0.7} />
        <circle cx="37" cy="30" r="2.2" fill="#1e293b" fillOpacity={0.7} />
      </>
    ),
  },
] as const;

export type LogoPresetId = typeof LOGO_PRESETS[number]["id"];

export const LOGO_PRESET_IDS = LOGO_PRESETS.map((p) => p.id);

export function getLogoPresetById(id: string) {
  return LOGO_PRESETS.find((p) => p.id === id) ?? null;
}

interface PresetLogoProps {
  id: string;
  size?: number;
  className?: string;
}

/** Inline SVG renderer for a logo preset id (e.g. "book"). */
export function PresetLogo({ id, size = 36, className }: PresetLogoProps) {
  const preset = getLogoPresetById(id) ?? LOGO_PRESETS[0];
  // Per-instance gradient id so multiple PresetLogos on the same page
  // (e.g. sidebar + Settings preview + the picker grid) don't collide.
  const reactId = useId();
  const gradId = `pl-logo-${preset.id}-${reactId.replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={preset.grad[0]} />
          <stop offset="100%" stopColor={preset.grad[1]} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${gradId})`} />
      {preset.shape}
    </svg>
  );
}

interface BrandLogoProps {
  value: string | null | undefined;
  size?: number;
  className?: string;
  rounded?: "lg" | "xl" | "2xl" | "full";
}

/** Renders whatever the user has stored as their library logo: a preset
 *  reference ("preset:<id>"), an inlined image (data URL or absolute URL),
 *  or the default book preset when nothing is set. */
export function BrandLogo({ value, size = 36, className, rounded = "xl" }: BrandLogoProps) {
  const roundedClass = rounded === "full" ? "rounded-full" : rounded === "2xl" ? "rounded-2xl" : rounded === "lg" ? "rounded-lg" : "rounded-xl";
  if (!value) {
    return <PresetLogo id="book" size={size} className={clsx(roundedClass, className)} />;
  }
  if (value.startsWith("preset:")) {
    return <PresetLogo id={value.slice(7)} size={size} className={clsx(roundedClass, className)} />;
  }
  return (
    <img
      src={value}
      alt=""
      width={size}
      height={size}
      className={clsx("object-cover", roundedClass, className)}
      style={{ width: size, height: size }}
    />
  );
}

interface SelectorProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
}

/** Grid of logo presets used in the Branding section of Settings. */
export function LogoPresetGrid({ value, onChange }: SelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {LOGO_PRESETS.map((p) => {
        const id = `preset:${p.id}`;
        const active = value === id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(id)}
            className={clsx(
              "rounded-2xl transition-transform",
              active ? "ring-2 ring-accent ring-offset-2 ring-offset-ink-900 scale-105" : "hover:scale-105 opacity-90 hover:opacity-100",
            )}
            aria-label={`Logo ${p.id}`}
          >
            <PresetLogo id={p.id} size={56} className="rounded-2xl" />
          </button>
        );
      })}
    </div>
  );
}
