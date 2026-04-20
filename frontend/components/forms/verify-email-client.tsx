"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, MailCheck, RotateCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { User } from "@/types";

type VerifyResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
  message: string;
};

export function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const token = searchParams.get("token");
  const sent = searchParams.get("sent");
  const initialEmail = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">(
    token ? "verifying" : sent ? "idle" : "error"
  );
  const [message, setMessage] = useState(
    token ? "Verifying your email link..." : sent ? "We sent a verification email to your inbox." : "Verification link missing."
  );
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) return;

    let active = true;
    setStatus("verifying");
    setMessage("Verifying your email link...");

    api
      .post<VerifyResponse>("/auth/verify-email", { token }, { auth: false })
      .then((session) => {
        if (!active) return;
        setSession(session);
        setStatus("success");
        setMessage(session.message);
        toast.success(session.message);
        window.setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      })
      .catch((error) => {
        if (!active) return;
        const errorMessage = error instanceof Error ? error.message : "Verification failed";
        setStatus("error");
        setMessage(errorMessage);
        toast.error(errorMessage);
      });

    return () => {
      active = false;
    };
  }, [router, setSession, token]);

  async function resendVerification() {
    setResending(true);
    try {
      const response = await api.post<{ message: string }>("/auth/resend-verification", { email }, { auth: false });
      setStatus("idle");
      setMessage(response.message);
      toast.success(response.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not resend verification email");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
          {status === "success" ? <CheckCircle2 className="h-6 w-6 text-emerald-200" /> : <MailCheck className="h-6 w-6 text-cyan-100" />}
        </span>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Verify Email</h2>
          <p className="mt-1 text-sm text-muted-foreground">Secure your SureVision AI access with email verification.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm leading-7 text-slate-300">{message}</p>
      </div>

      {status !== "success" ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="verification-email">Email</Label>
            <Input
              id="verification-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@company.com"
            />
          </div>
          <Button onClick={resendVerification} disabled={resending || !email}>
            <RotateCw className={`h-4 w-4 ${resending ? "animate-spin" : ""}`} />
            {resending ? "Sending" : "Resend Verification"}
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
            <ShieldCheck className="h-4 w-4" />
            Access approved
          </div>
          <p className="mt-2 text-sm text-slate-300">You will be redirected to the dashboard automatically.</p>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Already verified?{" "}
        <Link href="/login" className="text-emerald-200 hover:text-emerald-100">
          Sign in
        </Link>
      </p>
    </div>
  );
}
