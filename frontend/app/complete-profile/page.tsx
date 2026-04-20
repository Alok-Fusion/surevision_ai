"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { User } from "@/types";

type ProfileResponse = {
  user: User;
};

export default function CompleteProfilePage() {
  const router = useRouter();
  const updateUser = useAuthStore((state) => state.updateUser);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ companyName: "", phone: "", socials: "" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.put<ProfileResponse>("/auth/profile", form);
      updateUser(response.user);
      toast.success("Profile completed! Welcome to SureVision AI.");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profile update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-card/80 p-6 shadow-panel backdrop-blur-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Building2 className="h-7 w-7 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Complete your profile</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We need a few more details before you can access the SureVision AI platform.
            </p>
          </div>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="e.g. Acme Corp"
                value={form.companyName}
                onChange={(event) => setForm({ ...form, companyName: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. +1 (555) 123-4567"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socials">LinkedIn / Socials</Label>
              <Input
                id="socials"
                placeholder="e.g. linkedin.com/in/yourprofile"
                value={form.socials}
                onChange={(event) => setForm({ ...form, socials: event.target.value })}
                required
              />
            </div>
            <Button className="w-full" disabled={loading}>
              <Building2 className="h-4 w-4" />
              {loading ? "Saving..." : "Complete Profile & Continue"}
            </Button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Your data is protected by enterprise-grade encryption.
        </p>
      </div>
    </main>
  );
}
