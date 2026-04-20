import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

const tones = {
  neutral: "border-white/10 bg-white/10 text-muted-foreground",
  success: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  warning: "border-amber-400/25 bg-amber-500/10 text-amber-200",
  danger: "border-rose-400/25 bg-rose-500/10 text-rose-200",
  info: "border-cyan-400/25 bg-cyan-500/10 text-cyan-200"
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", tones[tone], className)}
      {...props}
    />
  );
}
