"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";

type RegisterResponse = {
  verificationRequired: boolean;
  message: string;
  user: {
    email: string;
  };
};

export function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", companyName: "", phone: "", socials: "" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post<RegisterResponse>("/auth/register", form, { auth: false });
      toast.success(response.message);
      router.push(`/verify-email?sent=1&email=${encodeURIComponent(response.user.email)}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) return;
    setLoading(true);
    try {
      const session = await api.post<any>("/auth/google", { credential: credentialResponse.credential }, { auth: false });
      useAuthStore.getState().setSession(session);
      toast.success("Welcome to SureVision AI");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          minLength={8}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="companyName">Company Name</Label>
        <Input id="companyName" value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="socials">LinkedIn/Socials</Label>
        <Input id="socials" value={form.socials} onChange={(event) => setForm({ ...form, socials: event.target.value })} required />
      </div>
      <Button className="w-full" disabled={loading}>
        <UserPlus className="h-4 w-4" />
        {loading ? "Creating account" : "Create account"}
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-muted-foreground/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or sign up with</span>
        </div>
      </div>

      <div className="flex justify-center w-full">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error("Google sign up failed")}
          useOneTap
        />
      </div>

      <p className="text-center text-xs text-muted-foreground">New registrations must verify email before first sign-in.</p>
      <p className="text-center text-sm text-muted-foreground">
        Already have access?{" "}
        <Link href="/login" className="text-emerald-200 hover:text-emerald-100">
          Sign in
        </Link>
      </p>
    </form>
  );
}
