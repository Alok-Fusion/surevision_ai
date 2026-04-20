"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Banknote, ClipboardCheck, FileStack, Hourglass, Radar, RefreshCcw, ShieldAlert, TrendingUp } from "lucide-react";
import { DepartmentRiskChart } from "@/components/charts/department-risk-chart";
import { CostLeakageChart } from "@/components/charts/cost-leakage-chart";
import { RiskTrendChart } from "@/components/charts/risk-trend-chart";
import { AlertsTable } from "@/components/dashboard/alerts-table";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RecentDecisionsTable } from "@/components/dashboard/recent-decisions-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { DashboardData } from "@/types";

const emptyDashboard: DashboardData = {
  metrics: {
    totalAnalyses: 0,
    avgRiskScore: 0,
    complianceAlerts: 0,
    costLeakageOpportunities: 0,
    vendorRiskCount: 0,
    decisionsPendingReview: 0
  },
  riskTrend: [],
  departmentRisk: [],
  costLeakage: [],
  recentDecisions: [],
  highPriorityAlerts: []
};

export function DashboardClient() {
  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<DashboardData>("/dashboard");
      setData(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <Skeleton className="h-96 xl:col-span-2" />
          <Skeleton className="h-96" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Dashboard unavailable"
        description={error}
        action={{ label: "Retry", onClick: () => void loadDashboard() }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="grid gap-6 p-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">AI Risk Desk</Badge>
              <Badge tone="success">Controls Online</Badge>
              <Badge tone="warning">Executive Feed</Badge>
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-normal text-foreground">Operational intelligence in one command center.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              SureVision AI reflects live records from decisions, analyses, uploads, and alerts across your workspace.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Risk Velocity", `${data.riskTrend.at(-1)?.risk ?? 0}`, "latest monthly average"],
              ["Leakage Signals", `${data.metrics.costLeakageOpportunities}`, "open cost alerts"],
              ["Control Trust", `${data.riskTrend.at(-1)?.trust ?? 0}`, "latest monthly average"]
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
                <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
                <p className="mt-1 text-xs text-slate-400">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Total Analyses"
          value={data.metrics.totalAnalyses}
          delta="Stored decision analyses"
          icon={FileStack}
          trend={[data.metrics.totalAnalyses]}
          accent="cyan"
        />
        <MetricCard
          title="Avg Risk Score"
          value={data.metrics.avgRiskScore}
          delta="Average across saved analyses"
          direction="down"
          icon={ShieldAlert}
          trend={data.riskTrend.length ? data.riskTrend.map((point) => point.risk).slice(-7) : [data.metrics.avgRiskScore]}
          accent="emerald"
        />
        <MetricCard
          title="Compliance Alerts"
          value={data.metrics.complianceAlerts}
          delta="Unresolved compliance signals"
          icon={AlertTriangle}
          trend={[data.metrics.complianceAlerts]}
          accent="amber"
        />
        <MetricCard
          title="Cost Leakage"
          value={data.metrics.costLeakageOpportunities}
          delta="Open cost leakage opportunities"
          icon={Banknote}
          trend={[data.metrics.costLeakageOpportunities]}
          accent="violet"
        />
        <MetricCard
          title="Vendor Risk Count"
          value={data.metrics.vendorRiskCount}
          delta="Open vendor concentration alerts"
          icon={ClipboardCheck}
          trend={[data.metrics.vendorRiskCount]}
          accent="cyan"
        />
        <MetricCard
          title="Pending Review"
          value={data.metrics.decisionsPendingReview}
          delta="Pilot and revise recommendations"
          icon={Hourglass}
          trend={[data.metrics.decisionsPendingReview]}
          accent="emerald"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Risk and Trust Trend</CardTitle>
              <CardDescription>Composite posture across recorded decision workflows</CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-cyan-200" />
          </CardHeader>
          <CardContent>
            {data.riskTrend.length ? (
              <RiskTrendChart data={data.riskTrend} />
            ) : (
              <EmptyState
                icon={RefreshCcw}
                title="No trend data yet"
                description="Monthly risk and trust trends appear after analyses are stored over time."
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <CardTitle>Upload Footprint</CardTitle>
            <Banknote className="h-5 w-5 text-violet-200" />
          </CardHeader>
          <CardContent>
            {data.costLeakage.length ? (
              <CostLeakageChart data={data.costLeakage} />
            ) : (
              <EmptyState
                icon={Banknote}
                title="No upload categories yet"
                description="Upload operational files to see the current category mix."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Department Risk</CardTitle>
              <CardDescription>Weighted risk by ownership domain</CardDescription>
            </div>
            <Radar className="h-5 w-5 text-emerald-200" />
          </CardHeader>
          <CardContent>
            {data.departmentRisk.length ? (
              <DepartmentRiskChart data={data.departmentRisk} />
            ) : (
              <EmptyState
                icon={Radar}
                title="No department risk yet"
                description="Department averages appear once at least one decision has a saved analysis."
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>High Priority Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {data.highPriorityAlerts.length ? (
              <AlertsTable rows={data.highPriorityAlerts} />
            ) : (
              <EmptyState
                icon={AlertTriangle}
                title="No high-priority alerts"
                description="There are no open alerts with high or critical severity right now."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Decisions</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentDecisions.length ? (
            <RecentDecisionsTable rows={data.recentDecisions} />
          ) : (
            <EmptyState
              icon={FileStack}
              title="No decisions analyzed"
              description="New executive decisions will appear here after analysts create and save them."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
