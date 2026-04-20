import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function scoreTone(score: number) {
  if (score >= 75) return "text-rose-300 bg-rose-500/10 border-rose-400/25";
  if (score >= 55) return "text-amber-200 bg-amber-500/10 border-amber-400/25";
  return "text-emerald-200 bg-emerald-500/10 border-emerald-400/25";
}

export function recommendationTone(recommendation: string) {
  if (recommendation === "Approve") return "text-emerald-200 bg-emerald-500/10 border-emerald-400/25";
  if (recommendation === "Pilot") return "text-cyan-200 bg-cyan-500/10 border-cyan-400/25";
  if (recommendation === "Revise") return "text-amber-200 bg-amber-500/10 border-amber-400/25";
  return "text-rose-200 bg-rose-500/10 border-rose-400/25";
}
