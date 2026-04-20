"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkforceDashboard, EmployeeRecordRow } from "@/types";

const CHART_COLORS = ["#22d3ee", "#34d399", "#a78bfa", "#fbbf24", "#f87171", "#60a5fa"];

const tooltipStyle = {
  contentStyle: {
    background: "rgba(15, 23, 42, 0.95)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#e2e8f0",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
  },
  itemStyle: { color: "#e2e8f0" }
};

/* ─── Dashboard Charts ─── */

export function WorkforceCharts({ dashboard }: { dashboard: WorkforceDashboard }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {/* Performance Distribution */}
      {dashboard.performanceDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
            <CardDescription>Employee count by overall score range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dashboard.performanceDistribution} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="range" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.2)" }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.2)" }} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" name="Employees" radius={[6, 6, 0, 0]}>
                  {dashboard.performanceDistribution.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Department Performance */}
      {dashboard.departmentPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
            <CardDescription>Average performance score by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dashboard.departmentPerformance} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.2)" }} />
                <YAxis type="category" dataKey="department" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.2)" }} width={100} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="avgScore" name="Avg Score" radius={[0, 6, 6, 0]} fill="#22d3ee" fillOpacity={0.75} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Individual Employee Charts ─── */

export function ScoreRadarChart({ scores }: { scores: { label: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={scores} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
        <PolarGrid stroke="rgba(148,163,184,0.15)" />
        <PolarAngleAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#22d3ee"
          fill="#22d3ee"
          fillOpacity={0.25}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function EmployeeTrendChart({ records }: { records: EmployeeRecordRow[] }) {
  const data = records.map((r) => ({
    period: r.period,
    completionRate: r.tasksAssigned > 0 ? Math.round((r.tasksCompleted / r.tasksAssigned) * 100) : 0,
    quality: r.qualityScore,
    attendance: r.totalWorkingDays > 0 ? Math.round((r.attendanceDays / r.totalWorkingDays) * 100) : 0,
    avgHours: r.avgWorkingHours
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
        <XAxis dataKey="period" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.2)" }} />
        <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.2)" }} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
        <Line type="monotone" dataKey="completionRate" name="Completion %" stroke="#22d3ee" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="quality" name="Quality" stroke="#34d399" strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="attendance" name="Attendance %" stroke="#a78bfa" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RecommendationPieChart({ data }: { data: { recommendation: string; count: number }[] }) {
  const REC_CHART_COLORS: Record<string, string> = {
    promote: "#34d399",
    salary_hike: "#60a5fa",
    maintain: "#94a3b8",
    pip: "#fbbf24",
    role_change: "#a78bfa",
    demote: "#f87171"
  };

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="recommendation"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={50}
          paddingAngle={2}
          label={({ recommendation, count }) => `${recommendation} (${count})`}
          labelLine={{ stroke: "#64748b" }}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={REC_CHART_COLORS[entry.recommendation] ?? "#64748b"} fillOpacity={0.85} />
          ))}
        </Pie>
        <Tooltip {...tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  );
}
