"use client";

import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string | number;
  delta: string;
  direction?: "up" | "down";
  icon: LucideIcon;
  trend: number[];
  accent?: "cyan" | "emerald" | "violet" | "amber";
  prefix?: string;
  suffix?: string;
};

const accents = {
  cyan: {
    text: "text-cyan-200",
    glow: "from-cyan-300/20 via-cyan-300/5 to-transparent",
    stroke: "#67e8f9",
    icon: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
  },
  emerald: {
    text: "text-emerald-200",
    glow: "from-emerald-300/20 via-emerald-300/5 to-transparent",
    stroke: "#6ee7b7",
    icon: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
  },
  violet: {
    text: "text-violet-200",
    glow: "from-violet-300/20 via-violet-300/5 to-transparent",
    stroke: "#c4b5fd",
    icon: "border-violet-300/25 bg-violet-300/10 text-violet-100"
  },
  amber: {
    text: "text-amber-200",
    glow: "from-amber-300/20 via-amber-300/5 to-transparent",
    stroke: "#fcd34d",
    icon: "border-amber-300/25 bg-amber-300/10 text-amber-100"
  }
};

export function MetricCard({ title, value, delta, direction = "up", icon: Icon, trend, accent = "cyan", prefix = "", suffix = "" }: Props) {
  const TrendIcon = direction === "up" ? ArrowUpRight : ArrowDownRight;
  const numericValue = typeof value === "number" ? value : Number.parseFloat(String(value).replace(/[^0-9.]/g, ""));
  const animated = useAnimatedCounter(Number.isFinite(numericValue) ? numericValue : 0);
  const palette = accents[accent];
  const displayValue = typeof value === "number" ? `${prefix}${animated.toLocaleString()}${suffix}` : value;

  return (
    <Card className="group relative overflow-hidden p-5">
      <div className={cn("absolute inset-x-0 top-0 h-24 bg-gradient-to-b opacity-80 transition group-hover:opacity-100", palette.glow)} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">{title}</p>
          <p className="counter-rise mt-3 text-3xl font-semibold tracking-normal text-foreground">{displayValue}</p>
        </div>
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl border", palette.icon)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="relative mt-5 flex items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
          <TrendIcon className={direction === "up" ? "h-4 w-4 shrink-0 text-emerald-300" : "h-4 w-4 shrink-0 text-amber-300"} />
          <span className="truncate">{delta}</span>
        </div>
        <Sparkline values={trend} stroke={palette.stroke} />
      </div>
    </Card>
  );
}

function useAnimatedCounter(target: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 700;
    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}

function Sparkline({ values, stroke }: { values: number[]; stroke: string }) {
  const points = useMemo(() => {
    const safeValues = values.length ? values : [0];
    const width = 92;
    const height = 34;
    const min = Math.min(...safeValues);
    const max = Math.max(...safeValues);
    const range = max - min || 1;

    return safeValues
      .map((value, index) => {
        const x = (index / Math.max(safeValues.length - 1, 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [values]);

  return (
    <svg className="h-10 w-24 shrink-0 overflow-visible" viewBox="0 0 92 34" role="img" aria-label="Metric trend sparkline">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,34 ${points} 92,34`} fill={stroke} opacity="0.08" />
    </svg>
  );
}
