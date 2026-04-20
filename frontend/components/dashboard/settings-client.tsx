"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, KeyRound, Moon, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import type { SettingsResponse } from "@/types";

export function SettingsClient() {
  const updateUser = useAuthStore((state) => state.updateUser);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [removingKey, setRemovingKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "viewer",
    emailVerified: false,
    notificationsEnabled: true,
    companyName: "",
    phone: "",
    socials: "",
    createdAt: "",
    hasPersonalGeminiKey: false,
    geminiKeyLast4: null as string | null,
    geminiKeyUpdatedAt: null as string | null
  });
  const [geminiKey, setGeminiKey] = useState("");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<SettingsResponse>("/settings");
      setProfile(response.profile);
      updateUser({
        id: response.profile.id,
        name: response.profile.name,
        email: response.profile.email,
        role: response.profile.role,
        emailVerified: response.profile.emailVerified,
        profileCompleted: !!response.profile.companyName
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load settings.");
    } finally {
      setLoading(false);
    }
  }, [updateUser]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const response = await api.put<SettingsResponse>("/settings/profile", {
        name: profile.name,
        notificationsEnabled: profile.notificationsEnabled,
        companyName: profile.companyName,
        phone: profile.phone,
        socials: profile.socials
      });
      setProfile(response.profile);
      updateUser({
        id: response.profile.id,
        name: response.profile.name,
        email: response.profile.email,
        role: response.profile.role,
        emailVerified: response.profile.emailVerified,
        profileCompleted: !!response.profile.companyName
      });
      toast.success("Profile updated");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Could not save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveGeminiKey() {
    setSavingKey(true);
    try {
      const response = await api.put<SettingsResponse>("/settings/gemini-key", { apiKey: geminiKey });
      setProfile(response.profile);
      setGeminiKey("");
      toast.success(response.message ?? "Gemini API key saved");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Could not save Gemini API key.");
    } finally {
      setSavingKey(false);
    }
  }

  async function removeGeminiKey() {
    setRemovingKey(true);
    try {
      const response = await api.del<SettingsResponse>("/settings/gemini-key");
      setProfile(response.profile);
      setGeminiKey("");
      toast.success(response.message ?? "Gemini API key removed");
    } catch (removeError) {
      toast.error(removeError instanceof Error ? removeError.message : "Could not remove Gemini API key.");
    } finally {
      setRemovingKey(false);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Skeleton className="h-72" />
        <div className="space-y-6">
          <Skeleton className="h-52" />
          <Skeleton className="h-40" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  if (error) {
    return <EmptyState icon={UserRound} title="Settings unavailable" description={error} action={{ label: "Retry", onClick: () => void loadSettings() }} />;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10">
              <UserRound className="h-5 w-5 text-emerald-200" />
            </span>
            <div>
              <p className="font-medium text-foreground">{profile.name}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="info">{profile.role}</Badge>
            <Badge tone={profile.emailVerified ? "success" : "warning"}>{profile.emailVerified ? "Email verified" : "Verification pending"}</Badge>
            {profile.createdAt && (
              <Badge tone="info">Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</Badge>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" value={profile.companyName} onChange={(event) => setProfile((current) => ({ ...current, companyName: event.target.value }))} placeholder="e.g. Acme Corp" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} placeholder="e.g. +1 (555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socials">LinkedIn / Socials</Label>
              <Input id="socials" value={profile.socials} onChange={(event) => setProfile((current) => ({ ...current, socials: event.target.value }))} placeholder="e.g. linkedin.com/in/yourprofile" />
            </div>
          </div>
          <Button variant="secondary" onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? "Saving" : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-4">
              <Moon className="h-5 w-5 text-emerald-200" />
              <p className="mt-3 font-medium text-foreground">Executive Dark</p>
              <p className="mt-1 text-sm text-muted-foreground">Optimized for command centers, board reviews, and risk operations.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium text-foreground">Density</p>
              <Select className="mt-3" defaultValue="comfortable">
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-emerald-200" />
              <div>
                <p className="font-medium text-foreground">Risk alerts</p>
                <p className="text-sm text-muted-foreground">Compliance, cost leakage, and vendor concentration signals.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setProfile((current) => ({ ...current, notificationsEnabled: !current.notificationsEnabled }))}
              className={`h-7 w-12 rounded-full border p-1 transition ${
                profile.notificationsEnabled ? "border-emerald-300/40 bg-emerald-300/25" : "border-white/10 bg-white/10"
              }`}
              title="Toggle notifications"
            >
              <span className={`block h-5 w-5 rounded-full bg-white transition ${profile.notificationsEnabled ? "translate-x-5" : ""}`} />
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gemini API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-emerald-200" />
                <div>
                  <p className="font-medium text-foreground">Google AI Studio</p>
                  <p className="text-sm text-muted-foreground">Store your personal Gemini API key server-side for authenticated analyses.</p>
                </div>
              </div>
              <Badge tone={profile.hasPersonalGeminiKey ? "success" : "warning"}>
                {profile.hasPersonalGeminiKey ? `Saved ••••${profile.geminiKeyLast4 ?? ""}` : "Not configured"}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gemini-key">Personal API key</Label>
              <Input
                id="gemini-key"
                type="password"
                placeholder="AIza..."
                value={geminiKey}
                onChange={(event) => setGeminiKey(event.target.value)}
              />
            </div>
            {profile.geminiKeyUpdatedAt ? (
              <p className="text-xs text-muted-foreground">
                Last updated {new Date(profile.geminiKeyUpdatedAt).toLocaleString()}.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={saveGeminiKey} disabled={savingKey || !geminiKey.trim()}>
                {savingKey ? "Saving" : "Save Key"}
              </Button>
              <Button variant="ghost" onClick={removeGeminiKey} disabled={removingKey || !profile.hasPersonalGeminiKey}>
                {removingKey ? "Removing" : "Remove Key"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
