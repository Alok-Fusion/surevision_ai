"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrainCircuit, Gauge, History, LayoutDashboard, Settings, ShieldCheck, UploadCloud, Users, UsersRound } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/analyze", label: "Analyze", icon: BrainCircuit },
  { href: "/what-if", label: "What-If", icon: Gauge },
  { href: "/history", label: "History", icon: History },
  { href: "/employees", label: "Workforce AI", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings }
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const items = user?.role === "admin" ? [...navItems, { href: "/admin", label: "Admin", icon: UsersRound }] : navItems;

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/10 bg-slate-950/75 p-5 backdrop-blur-2xl lg:block">
      <Logo />
      <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>AI Control Plane</span>
          <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-emerald-200">Live</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-200" />
        </div>
      </div>
      <nav className="mt-7 space-y-1.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-slate-400 transition duration-200 hover:bg-white/10 hover:text-foreground",
                active && "border border-cyan-300/20 bg-cyan-300/10 text-cyan-50 shadow-glow"
              )}
              title={item.label}
            >
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition group-hover:border-cyan-300/30 group-hover:text-cyan-100",
                  active && "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                )}
              >
                <item.icon className="h-4 w-4" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/10 bg-gradient-to-br from-cyan-300/10 via-slate-900/80 to-violet-300/10 p-4 shadow-panel">
        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
          <ShieldCheck className="h-4 w-4" />
          Governance Active
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          RBAC, audit trails, export controls, and Gemini-backed analysis are active for authenticated users.
        </p>
      </div>
    </aside>
  );
}
