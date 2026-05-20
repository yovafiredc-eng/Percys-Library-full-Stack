import clsx from "clsx";
import { memo } from "react";

interface Props {
  label: string;
  onClick?: (label: string) => void;
  variant?: "default" | "compact" | "outlined";
  color?: string;
}

const colorPalette = [
  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "bg-rose-500/20 text-rose-400 border-rose-500/30",
  "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export const CategoryBadge = memo(function CategoryBadge({
  label,
  onClick,
  variant = "default",
  color,
}: Props) {
  const colorClass = color ?? colorPalette[hashString(label) % colorPalette.length];

  return (
    <button
      type="button"
      onClick={() => onClick?.(label)}
      className={clsx(
        "inline-flex items-center rounded-full border font-semibold transition-all duration-200 hover:scale-105 active:scale-95",
        variant === "default" && "px-2.5 py-1 text-[10px]",
        variant === "compact" && "px-2 py-0.5 text-[9px]",
        variant === "outlined" && "px-2 py-0.5 text-[9px] bg-transparent",
        !onClick && "cursor-default",
        colorClass,
      )}
    >
      <span className="truncate max-w-[80px]">{label}</span>
    </button>
  );
});
