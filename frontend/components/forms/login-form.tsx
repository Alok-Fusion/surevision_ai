"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { User } from "@/types";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

type LoginResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "admin@surevision.ai", password: "Admin@123" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const session = await api.post<LoginResponse>("/auth/login", form, { auth: false });
      setSession(session);
      toast.success("Welcome back to SureVision AI");
      router.push(searchParams.get("next") || "/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) return;
    setLoading(true);
    try {
      const session = await api.post<LoginResponse>("/auth/google", { credential: credentialResponse.credential }, { auth: false });
      setSession(session);
      toast.success("Welcome to SureVision AI");
      router.push(searchParams.get("next") || "/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs text-emerald-200 hover:text-emerald-100">
            Forgot password
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            onClick={() => setShowPassword((value) => !value)}
            title="Toggle password"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
      <Button className="w-full" disabled={loading}>
        <LogIn className="h-4 w-4" />
        {loading ? "Signing in" : "Sign in"}
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-muted-foreground/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <div className="flex justify-center w-full">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error("Google sign in failed")}
          useOneTap
        />
      </div>

      <p className="text-center text-xs text-muted-foreground">Email verification is required for newly registered accounts.</p>
      <p className="text-center text-sm text-muted-foreground">
        New to SureVision?{" "}
        <Link href="/register" className="text-emerald-200 hover:text-emerald-100">
          Create an account
        </Link>
      </p>
    </form>
  );
}
