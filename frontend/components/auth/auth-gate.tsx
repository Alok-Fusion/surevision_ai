"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { User } from "@/types";

type MeResponse = {
  user: User;
};

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const hydrate = useAuthStore((state) => state.hydrate);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [ready, setReady] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
    setReady(true);
  }, [hydrate]);

  useEffect(() => {
    if (!ready) return;

    if (!accessToken && !refreshToken) {
      clearSession();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (user || (!accessToken && !refreshToken)) return;

    let active = true;
    setVerifying(true);
    setAuthError(null);

    api
      .get<MeResponse>("/auth/me")
      .then((response) => {
        if (!active) return;
        updateUser(response.user);
      })
      .catch((error) => {
        if (!active) return;
        clearSession();
        setAuthError(error instanceof Error ? error.message : "Your session is no longer valid.");
      })
      .finally(() => {
        if (active) setVerifying(false);
      });

    return () => {
      active = false;
    };
  }, [accessToken, clearSession, pathname, ready, refreshToken, router, updateUser, user]);

  useEffect(() => {
    if (!authError) return;
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [authError, pathname, router]);

  if (!ready || verifying || (!user && (accessToken || refreshToken))) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Session required"
        description="Sign in to access SureVision AI workspace data."
      />
    );
  }

  if (!user.profileCompleted && pathname !== "/complete-profile" && pathname !== "/settings") {
    router.replace("/complete-profile");
    return (
      <div className="space-y-6">
        <Skeleton className="h-28" />
      </div>
    );
  }

  return <>{children}</>;
}
