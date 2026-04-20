"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUpDown,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
  Upload,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EvaluationCard } from "@/components/employees/evaluation-card";
import { EmployeeUploadForm } from "@/components/employees/employee-upload-form";
import { WorkforceCharts } from "@/components/employees/workforce-charts";
import { api } from "@/lib/api";
import type {
  EmployeeRow,
  EmployeeListResponse,
  EmployeeEvaluationRow,
  WorkforceDashboard,
  EvaluationRecommendation
} from "@/types";
import { toast } from "sonner";

const TABS = ["overview", "upload", "directory", "evaluations"] as const;
type Tab = (typeof TABS)[number];

const TAB_META: Record<Tab, { label: string; icon: React.ElementType }> = {
  overview: { label: "Overview", icon: BarChart3 },
  upload: { label: "Upload Data", icon: Upload },
  directory: { label: "Directory", icon: Users },
  evaluations: { label: "Evaluations", icon: Sparkles }
};

const REC_COLORS: Record<string, string> = {
  promote: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  salary_hike: "bg-sky-400/15 text-sky-300 border-sky-400/30",
  maintain: "bg-slate-400/15 text-slate-300 border-slate-400/30",
  pip: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  role_change: "bg-violet-400/15 text-violet-300 border-violet-400/30",
  demote: "bg-red-400/15 text-red-300 border-red-400/30"
};

const REC_LABELS: Record<string, string> = {
  promote: "Promote",
  salary_hike: "Salary Hike",
  maintain: "Maintain",
  pip: "PIP",
  role_change: "Role Change",
  demote: "Demote"
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  probation: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  pip: "bg-red-400/15 text-red-300 border-red-400/30",
  exited: "bg-slate-400/15 text-slate-400 border-slate-400/30"
};

export function EmployeesClient() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [dashboard, setDashboard] = useState<WorkforceDashboard | null>(null);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [employeesMeta, setEmployeesMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [dirLoading, setDirLoading] = useState(false);
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [batchEvaluating, setBatchEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.get<WorkforceDashboard>("/employees/dashboard");
      setDashboard(data);
    } catch {
      /* silent */
    }
  }, []);

  const loadEmployees = useCallback(async (page = 1) => {
    setDirLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (deptFilter) params.set("department", deptFilter);
      if (statusFilter) params.set("status", statusFilter);
      const data = await api.get<EmployeeListResponse>(`/employees?${params}`);
      setEmployees(data.employees);
      setEmployeesMeta({ total: data.total, page: data.page, totalPages: data.totalPages });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees");
    } finally {
      setDirLoading(false);
    }
  }, [search, deptFilter, statusFilter]);

  useEffect(() => {
    setLoading(true);
    // Silently sync all employee statuses from their latest evaluations (fixes stale status data)
    void api.post("/employees/sync-statuses").catch(() => { /* silent */ });
    Promise.all([loadDashboard(), loadEmployees()]).finally(() => setLoading(false));
  }, []);

  // Refresh data when switching tabs
  useEffect(() => {
    if (activeTab === "overview" || activeTab === "evaluations") {
      void loadDashboard();
    }
    if (activeTab === "directory") {
      void loadEmployees();
    }
  }, [activeTab]);

  // Debounced search/filter for directory tab
  useEffect(() => {
    if (activeTab === "directory") {
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => void loadEmployees(), 350);
    }
  }, [search, deptFilter, statusFilter]);

  const handleEvaluate = async (id: string) => {
    setEvaluating(id);
    try {
      await api.post(`/employees/${id}/evaluate`);
      toast.success("Evaluation complete");
      void loadDashboard();
      void loadEmployees(employeesMeta.page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setEvaluating(null);
    }
  };

  const handleBatchEvaluate = async () => {
    setBatchEvaluating(true);
    try {
      const result = await api.post<{ results: unknown[]; skippedCount: number; errors: string[] }>("/employees/evaluate-all");
      
      if (result.results.length === 0 && result.skippedCount > 0) {
        toast.info(`All ${result.skippedCount} employees are already up-to-date.`);
      } else {
        toast.success(`Evaluated ${result.results.length} employees` + (result.skippedCount > 0 ? ` (${result.skippedCount} skipped)` : ""));
      }
      if (result.errors.length > 0) toast.warning(`${result.errors.length} employees had errors`);
      void loadDashboard();
      void loadEmployees(employeesMeta.page);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Batch evaluation failed");
    } finally {
      setBatchEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error && !dashboard && employees.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Unable to load workforce data"
        description={error}
        action={{ label: "Retry", onClick: () => { setError(null); void loadDashboard(); void loadEmployees(); } }}
      />
    );
  }

  const metrics = dashboard?.metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="grid gap-6 p-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">Workforce AI</Badge>
              <Badge tone="success">Decision Engine</Badge>
            </div>
            <h2 className="mt-5 text-3xl font-semibold tracking-normal text-foreground">
              Employee Decision Support System
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Upload employee performance data, analyze trends with AI, and get intelligent recommendations for promotions, salary adjustments, and improvement plans.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Employees", `${metrics?.totalEmployees ?? 0}`, "total tracked"],
              ["Avg Score", `${metrics?.avgPerformanceScore ?? 0}`, "performance average"],
              ["PIPs Active", `${metrics?.pipCount ?? 0}`, "improvement plans"]
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

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-1.5">
        {TABS.map((tab) => {
          const meta = TAB_META[tab];
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                active
                  ? "border border-cyan-300/20 bg-cyan-300/10 text-cyan-50 shadow-glow"
                  : "text-slate-400 hover:bg-white/10 hover:text-foreground"
              }`}
            >
              <meta.icon className="h-4 w-4" />
              {meta.label}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleBatchEvaluate}
            disabled={batchEvaluating || (metrics?.totalEmployees ?? 0) === 0}
          >
            {batchEvaluating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Evaluate All
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab dashboard={dashboard} />
      )}
      {activeTab === "upload" && (
        <EmployeeUploadForm onSuccess={() => { void loadDashboard(); void loadEmployees(); setActiveTab("directory"); }} />
      )}
      {activeTab === "directory" && (
        <DirectoryTab
          employees={employees}
          meta={employeesMeta}
          search={search}
          onSearchChange={setSearch}
          deptFilter={deptFilter}
          onDeptChange={setDeptFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          evaluating={evaluating}
          onEvaluate={handleEvaluate}
          onPageChange={(p) => void loadEmployees(p)}
          loading={dirLoading}
          departments={dashboard?.departments ?? []}
        />
      )}
      {activeTab === "evaluations" && (
        <EvaluationsTab dashboard={dashboard} />
      )}
    </div>
  );
}

/* ─── Overview Tab ─── */

function OverviewTab({ dashboard }: { dashboard: WorkforceDashboard | null }) {
  if (!dashboard || dashboard.metrics.totalEmployees === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No workforce data yet"
        description="Upload employee CSV data to see workforce analytics and AI-powered insights."
      />
    );
  }

  const { metrics } = dashboard;

  const metricCards = [
    { title: "Total Employees", value: metrics.totalEmployees, icon: Users, accent: "cyan" as const, desc: "Tracked in system" },
    { title: "Active", value: metrics.activeEmployees, icon: UserCheck, accent: "emerald" as const, desc: "Currently active" },
    { title: "PIPs Active", value: metrics.pipCount, icon: UserMinus, accent: "amber" as const, desc: "On improvement plans" },
    { title: "Departments", value: metrics.departmentCount, icon: BarChart3, accent: "violet" as const, desc: "Distinct departments" },
    { title: "Avg Performance", value: metrics.avgPerformanceScore, icon: TrendingUp, accent: "emerald" as const, desc: "Across all evaluated" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((m) => (
          <Card key={m.title}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{m.title}</p>
                  <p className="mt-2 text-3xl font-bold text-foreground counter-rise">{m.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{m.desc}</p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-${m.accent}-400/10`}>
                  <m.icon className={`h-5 w-5 text-${m.accent}-300`} />
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <WorkforceCharts dashboard={dashboard} />

      {/* Recommendation Breakdown */}
      {dashboard.recommendationBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendation Distribution</CardTitle>
            <CardDescription>Current recommendation breakdown across all evaluated employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {dashboard.recommendationBreakdown.map((item) => (
                <div key={item.recommendation} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${REC_COLORS[item.recommendation] ?? "bg-slate-400/15 text-slate-300"}`}>
                      {REC_LABELS[item.recommendation] ?? item.recommendation}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ─── Directory Tab ─── */

interface DirectoryTabProps {
  employees: EmployeeRow[];
  meta: { total: number; page: number; totalPages: number };
  search: string;
  onSearchChange: (v: string) => void;
  deptFilter: string;
  onDeptChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  evaluating: string | null;
  onEvaluate: (id: string) => void;
  onPageChange: (page: number) => void;
  loading: boolean;
  departments: string[];
}

function DirectoryTab({ employees, meta, search, onSearchChange, deptFilter, onDeptChange, statusFilter, onStatusChange, evaluating, onEvaluate, onPageChange, loading, departments }: DirectoryTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Employee Directory</CardTitle>
            <CardDescription>{meta.total} employees found</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search employees..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-56 pl-9"
              />
            </div>
            <Select value={deptFilter} onChange={(e) => onDeptChange(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="pip">PIP</option>
              <option value="exited">Exited</option>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees found"
            description="Upload employee data or adjust your filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Recommendation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp._id} className="group">
                      <TableCell>
                        <Link href={`/employees/${emp._id}`} className="flex flex-col hover:text-cyan-200 transition">
                          <span className="font-medium text-foreground">{emp.name}</span>
                          <span className="text-xs text-slate-500">{emp.employeeId} · {emp.email}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="text-slate-300">{emp.department}</TableCell>
                      <TableCell className="text-slate-300">{emp.designation}</TableCell>
                      <TableCell>
                        <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[emp.status] ?? ""}`}>
                          {emp.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {emp.latestEval ? (
                          <span className="text-lg font-bold text-foreground">{emp.latestEval.overallScore}</span>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {emp.latestEval ? (
                          <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-semibold ${REC_COLORS[emp.latestEval.recommendation] ?? ""}`}>
                            {REC_LABELS[emp.latestEval.recommendation] ?? emp.latestEval.recommendation}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Not evaluated</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEvaluate(emp._id)}
                          disabled={evaluating === emp._id}
                        >
                          {evaluating === emp._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => onPageChange(meta.page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-400">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() => onPageChange(meta.page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Evaluations Tab ─── */

function EvaluationsTab({ dashboard }: { dashboard: WorkforceDashboard | null }) {
  const [evaluations, setEvaluations] = useState<EmployeeEvaluationRow[]>([]);
  const [evalMeta, setEvalMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [evalSearch, setEvalSearch] = useState("");
  const [evalDept, setEvalDept] = useState("");
  const [evalRec, setEvalRec] = useState("");
  const [evalLoading, setEvalLoading] = useState(true);
  const evalSearchTimer = useRef<ReturnType<typeof setTimeout>>();

  const loadEvaluations = useCallback(async (page = 1) => {
    setEvalLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (evalSearch) params.set("search", evalSearch);
      if (evalDept) params.set("department", evalDept);
      if (evalRec) params.set("recommendation", evalRec);
      const data = await api.get<{
        evaluations: EmployeeEvaluationRow[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/employees/evaluations?${params}`);
      setEvaluations(data.evaluations);
      setEvalMeta({ total: data.total, page: data.page, totalPages: data.totalPages });
    } catch {
      /* silent */
    } finally {
      setEvalLoading(false);
    }
  }, [evalSearch, evalDept, evalRec]);

  useEffect(() => {
    clearTimeout(evalSearchTimer.current);
    evalSearchTimer.current = setTimeout(() => void loadEvaluations(), 350);
  }, [evalSearch, evalDept, evalRec]);

  const departments = dashboard?.departments ?? [];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>AI Evaluations</CardTitle>
            <CardDescription>{evalMeta.total} evaluations found</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search employees..."
                value={evalSearch}
                onChange={(e) => setEvalSearch(e.target.value)}
                className="w-56 pl-9"
              />
            </div>
            <Select value={evalDept} onChange={(e) => setEvalDept(e.target.value)}>
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </Select>
            <Select value={evalRec} onChange={(e) => setEvalRec(e.target.value)}>
              <option value="">All Recommendations</option>
              <option value="promote">Promote</option>
              <option value="salary_hike">Salary Hike</option>
              <option value="maintain">Maintain</option>
              <option value="pip">PIP</option>
              <option value="role_change">Role Change</option>
              <option value="demote">Demote</option>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {evalLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : evaluations.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No evaluations found"
            description="Run AI evaluations on employees or adjust your filters."
          />
        ) : (
          <>
            <div className="space-y-4">
              {evaluations.map((ev) => (
                <EvaluationCard key={ev._id} evaluation={ev} />
              ))}
            </div>

            {/* Pagination */}
            {evalMeta.totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={evalMeta.page <= 1}
                  onClick={() => void loadEvaluations(evalMeta.page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-400">
                  Page {evalMeta.page} of {evalMeta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={evalMeta.page >= evalMeta.totalPages}
                  onClick={() => void loadEvaluations(evalMeta.page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

