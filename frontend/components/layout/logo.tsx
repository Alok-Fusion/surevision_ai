import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/25 bg-slate-950 shadow-glow transition group-hover:border-cyan-200/50">
        <span className="absolute inset-1 rounded-xl bg-gradient-to-br from-cyan-300/25 via-violet-300/20 to-emerald-300/20" />
        <span className="relative h-4 w-4 rounded-md bg-gradient-to-br from-cyan-200 via-emerald-200 to-amber-200" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold tracking-normal text-foreground">SureVision AI</span>
        <span className="block text-xs text-slate-400">Executive Intelligence</span>
      </span>
    </Link>
  );
}
