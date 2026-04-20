"use client";

import { useEffect, useState } from "react";
import { Sparkles, History, UsersRound, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Only show if user is logged in and hasn't seen the tour
    if (user && typeof window !== "undefined") {
      const seen = localStorage.getItem(`surevision.tour_seen_${user.id}`);
      if (!seen) {
        setOpen(true);
      }
    }
  }, [user]);

  function closeTour() {
    if (user) {
      localStorage.setItem(`surevision.tour_seen_${user.id}`, "true");
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[600px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
        <div className="p-6 text-slate-200">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10">
            <Sparkles className="h-6 w-6 text-emerald-300" />
          </div>
          <h2 className="text-center text-2xl font-semibold text-foreground">Welcome to SureVision AI</h2>
          <p className="text-center text-sm text-slate-400 mt-2">
            The intelligent platform for enterprise decision making. Here is how everything works:
          </p>

          <div className="grid gap-6 py-8">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <Send className="h-5 w-5 text-cyan-200" />
              </div>
              <div>
                <h4 className="font-medium text-slate-100">1. Analyze Decisions</h4>
                <p className="text-sm text-slate-400 mt-1">Submit your enterprise proposals with complete stakeholders context, and our AI will model best/worst scenarios, compliance risks, and hidden costs instantly.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <Sparkles className="h-5 w-5 text-emerald-200" />
              </div>
              <div>
                <h4 className="font-medium text-slate-100">2. Run What-If Simulations</h4>
                <p className="text-sm text-slate-400 mt-1">Use the What-If engine to calculate risk-delta and ROI from potential vendor replacements or restructuring.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <History className="h-5 w-5 text-purple-200" />
              </div>
              <div>
                <h4 className="font-medium text-slate-100">3. Filter Your History</h4>
                <p className="text-sm text-slate-400 mt-1">Easily search your entire historical log of decision intelligence to export reports directly to PDF and CSV formats.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                <UsersRound className="h-5 w-5 text-amber-200" />
              </div>
              <div>
                <h4 className="font-medium text-slate-100">4. Admin Controls</h4>
                <p className="text-sm text-slate-400 mt-1">Administrators can view comprehensive audit logs and grant access roles to new users joining the workspace.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center border-t border-white/10 pt-6">
            <Button onClick={closeTour} size="lg" className="w-full sm:w-auto px-8">
              Let&apos;s get started
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
