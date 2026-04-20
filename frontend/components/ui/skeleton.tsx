import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl border border-white/10 bg-white/10 shadow-panel", className)} />;
}
