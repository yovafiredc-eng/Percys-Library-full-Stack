import clsx from "clsx";

interface Props {
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-[150px]",
  md: "w-[190px]",
  lg: "w-[230px]",
};

export function SkeletonCard({ size = "md" }: Props) {
  return (
    <div className={clsx("group relative", sizeMap[size])}>
      <div className="relative block aspect-[2/3] w-full overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.05]">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 rounded-xl bg-white/[0.05] border border-white/[0.05]" />
        </div>
      </div>
      <div className="mt-3 px-1 space-y-2">
        <div className="h-4 w-full rounded-full bg-white/[0.05] animate-pulse" />
        <div className="h-3 w-3/4 rounded-full bg-white/[0.03] animate-pulse" />
        <div className="flex items-center gap-2 mt-2">
          <div className="h-1.5 flex-1 rounded-full bg-white/[0.03] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
