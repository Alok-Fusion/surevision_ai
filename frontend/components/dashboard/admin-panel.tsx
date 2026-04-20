"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Activity, Flag, Shield, UsersRound, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import type { AdminUserRow, AuditLogRow, FeatureFlagRow, SystemHealth } from "@/types";

type AdminData = {
  users: AdminUserRow[];
  auditLogs: AuditLogRow[];
  featureFlags: FeatureFlagRow[];
  systemHealth: SystemHealth | null;
};

export function AdminPanel() {
  const [data, setData] = useState<AdminData>({
    users: [],
    auditLogs: [],
    featureFlags: [],
    systemHealth: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState<string | null>(null);

  async function updateRole(userId: string, newRole: string) {
    setSavingUser(userId);
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      setData((prev) => ({
        ...prev,
        users: prev.users.map((u) => (u._id === userId ? { ...u, role: newRole as "admin" | "analyst" | "viewer" } : u))
      }));
      toast.success("User role updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSavingUser(null);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    setSavingUser(userId);
    try {
      await api.del(`/admin/users/${userId}`);
      setData(prev => ({ ...prev, users: prev.users.filter(u => u._id !== userId) }));
      toast.success("User deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setSavingUser(null);
    }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get<AdminUserRow[]>("/admin/users"),
      api.get<AuditLogRow[]>("/admin/audit-logs"),
      api.get<FeatureFlagRow[]>("/admin/feature-flags"),
      api.get<SystemHealth>("/admin/system-health")
    ])
      .then(([users, auditLogs, featureFlags, systemHealth]) => {
        if (!active) return;
        setData({ users, auditLogs, featureFlags, systemHealth });
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load admin controls.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error) {
    return <EmptyState icon={Shield} title="Admin data unavailable" description={error} />;
  }

  const systemHealth = data.systemHealth;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStat icon={UsersRound} label="Users" value={String(data.users.length)} />
        <AdminStat icon={Shield} label="Roles" value={String(new Set(data.users.map((user) => user.role)).size)} />
        <AdminStat icon={Flag} label="Feature Flags" value={String(data.featureFlags.length)} />
        <AdminStat icon={Activity} label="System Health" value={systemHealth?.aiEngine ?? "Unknown"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users and Roles</CardTitle>
          </CardHeader>
          <CardContent>
            {data.users.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((u) => {
                    // Provide a default string id for typing map
                    const userId = String(u._id ?? u.email);
                    return (
                    <TableRow key={userId}>
                      <TableCell>
                        <p className="font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        {(u.companyName || u.phone) && (
                          <p className="mt-1 text-xs text-slate-400">
                            {u.companyName} {u.phone && `• ${u.phone}`}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <select
                          className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-sm text-foreground disabled:opacity-50"
                          value={u.role}
                          onChange={(e) => updateRole(userId, e.target.value)}
                          disabled={savingUser === userId}
                        >
                          <option value="admin">Admin</option>
                          <option value="analyst">Analyst</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <Badge tone={u.emailVerified ? "success" : "warning"}>{u.emailVerified ? "Verified" : "Pending"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                          onClick={() => deleteUser(userId)}
                          disabled={savingUser === userId}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            ) : (
              <EmptyState icon={UsersRound} title="No users found" description="User records will appear here once the workspace is provisioned." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {data.auditLogs.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.auditLogs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{log.action}</p>
                        <p className="text-xs">{JSON.stringify(log.metadata ?? {})}</p>
                      </TableCell>
                      <TableCell>{log.userId?.name ?? log.userId?.email ?? "System"}</TableCell>
                      <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState icon={Shield} title="No audit logs yet" description="Security and workflow events will appear here as teams use the platform." />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Feature Flags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.featureFlags.length ? (
              data.featureFlags.map((flag) => (
                <div key={flag.key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <p className="font-medium text-foreground">{flag.label ?? flag.key}</p>
                    <p className="text-sm text-muted-foreground">{flag.description ?? flag.owner}</p>
                  </div>
                  <Badge tone={flag.enabled ? "success" : "neutral"}>{flag.enabled ? "Enabled" : "Disabled"}</Badge>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
                No feature flags are configured in this workspace.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemHealth ? (
              [
                ["API gateway", systemHealth.api],
                ["MongoDB", systemHealth.database],
                ["AI engine", systemHealth.aiEngine],
                ["SMTP", systemHealth.email],
                ["Workspace Gemini key", systemHealth.defaultGeminiKeyConfigured ? "configured" : "not configured"]
              ].map(([label, status]) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <Badge tone={status === "operational" || status === "connected" || status === "configured" ? "success" : "warning"}>
                    {status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
                System health data is not available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-emerald-200" />
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </Card>
  );
}
