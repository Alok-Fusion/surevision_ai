"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      toast.error("Valid reset token not found in URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ message: string }>("/auth/reset-password", { token, newPassword }, { auth: false });
      toast.success(res.message);
      setTimeout(() => router.push("/login"), 1500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Password reset failed");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          No reset token found. Please use the exact link sent to your email.
        </div>
        <Button variant="secondary" className="w-full" onClick={() => router.push("/forgot-password")}>
          Request a new link
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />
      </div>
      <Button className="w-full" disabled={loading}>
        <KeyRound className="h-4 w-4" />
        {loading ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}
