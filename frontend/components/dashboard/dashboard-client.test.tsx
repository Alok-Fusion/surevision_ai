import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { api } from "@/lib/api";
import type { DashboardData } from "@/types";

vi.mock("@/components/charts/risk-trend-chart", () => ({
  RiskTrendChart: () => <div data-testid="risk-trend-chart" />
}));

vi.mock("@/components/charts/department-risk-chart", () => ({
  DepartmentRiskChart: () => <div data-testid="department-risk-chart" />
}));

vi.mock("@/components/charts/cost-leakage-chart", () => ({
  CostLeakageChart: () => <div data-testid="cost-leakage-chart" />
}));

vi.mock("@/components/dashboard/metric-card", () => ({
  MetricCard: ({ title, value }: { title: string; value: string | number }) => (
    <div>
      {title}:{value}
    </div>
  )
}));

vi.mock("@/components/dashboard/recent-decisions-table", () => ({
  RecentDecisionsTable: ({ rows }: { rows: Array<unknown> }) => <div>Recent decisions:{rows.length}</div>
}));

vi.mock("@/components/dashboard/alerts-table", () => ({
  AlertsTable: ({ rows }: { rows: Array<unknown> }) => <div>Alerts:{rows.length}</div>
}));

const liveData: DashboardData = {
  metrics: {
    totalAnalyses: 99,
    avgRiskScore: 41,
    complianceAlerts: 4,
    costLeakageOpportunities: 3,
    vendorRiskCount: 2,
    decisionsPendingReview: 5
  },
  riskTrend: [{ month: "Apr", risk: 41, trust: 78 }],
  departmentRisk: [{ department: "Finance", risk: 44 }],
  costLeakage: [{ name: "invoice", value: 2 }],
  recentDecisions: [
    {
      _id: "dec-1",
      title: "Automate invoice routing",
      department: "Finance",
      industry: "Banking",
      urgency: "high",
      createdAt: new Date().toISOString()
    }
  ],
  highPriorityAlerts: [
    {
      _id: "alert-1",
      type: "compliance",
      severity: "high",
      message: "Backlog threshold exceeded",
      resolved: false,
      createdAt: new Date().toISOString()
    }
  ]
};

describe("DashboardClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads dashboard data from the backend", async () => {
    const apiSpy = vi.spyOn(api, "get").mockResolvedValue(liveData);

    render(<DashboardClient />);

    expect(await screen.findByText("Total Analyses:99")).toBeInTheDocument();
    expect(screen.getByText("Avg Risk Score:41")).toBeInTheDocument();
    expect(screen.getByText("Alerts:1")).toBeInTheDocument();
    expect(apiSpy).toHaveBeenCalledWith("/dashboard");
  });

  it("renders empty states when real tables are empty", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      ...liveData,
      riskTrend: [],
      departmentRisk: [],
      costLeakage: [],
      recentDecisions: [],
      highPriorityAlerts: []
    });

    render(<DashboardClient />);

    await waitFor(() => {
      expect(screen.getByText("No trend data yet")).toBeInTheDocument();
      expect(screen.getByText("No high-priority alerts")).toBeInTheDocument();
      expect(screen.getByText("No decisions analyzed")).toBeInTheDocument();
    });
  });

  it("shows an error state when the dashboard request fails", async () => {
    vi.spyOn(api, "get").mockRejectedValue(new Error("Dashboard offline"));

    render(<DashboardClient />);

    expect(await screen.findByText("Dashboard unavailable")).toBeInTheDocument();
    expect(screen.getByText("Dashboard offline")).toBeInTheDocument();
  });
});
