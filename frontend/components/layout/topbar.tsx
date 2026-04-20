"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Command, LogOut, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export function Topbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [searchQuery, setSearchQuery] = useState("");

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // The client session is still cleared even if the audit call fails.
    } finally {
      clearSession();
      router.replace("/login");
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/history?search=${encodeURIComponent(q)}`);
      setSearchQuery("");
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/70 px-4 py-4 backdrop-blur-2xl md:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-200/80">
            <Command className="h-3.5 w-3.5" />
            Enterprise Operations Intelligence
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-foreground">SureVision AI Command Center</h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form onSubmit={handleSearch} className="relative min-w-0 sm:w-72">
            <button
              type="submit"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
            >
              <Search className="h-4 w-4" />
            </button>
            <Input
              className="border-white/10 bg-slate-950/70 pl-9"
              placeholder="Search decisions, vendors, risks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <Button asChild variant="secondary">
            <Link href="/analyze">
              <Sparkles className="h-4 w-4" />
              New Analysis
            </Link>
          </Button>
          <Button variant="ghost" size="icon" title="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <div className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-muted-foreground md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.8)]" />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">{user?.name ?? "Signed In"}</p>
              <p className="truncate text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" title="Sign out" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
