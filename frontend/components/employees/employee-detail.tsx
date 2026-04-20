"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Loader2,
  Mail,
  Sparkles,
  User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EvaluationCard } from "@/components/employees/evaluation-card";
import { ScoreRadarChart, EmployeeTrendChart } from "@/components/employees/workforce-charts";
import { api } from "@/lib/api";
import type { EmployeeDetailResponse } from "@/types";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  probation: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  pip: "bg-red-400/15 text-red-300 border-red-400/30",
  exited: "bg-slate-400/15 text-slate-400 border-slate-400/30"
};

export function EmployeeDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<EmployeeDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadEmployee() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<EmployeeDetailResponse>(`/employees/${id}`);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employee");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEmployee();
  }, [id]);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      await api.post(`/employees/${id}/evaluate`);
      toast.success("Evaluation complete");
      void loadEmployee();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-48" />
        <div className="grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Employee not found"
        description={error ?? "This employee could not be loaded."}
        action={{ label: "Go Back", onClick: () => router.push("/employees") }}
      />
    );
  }

  const { employee, records, evaluations } = data;
  const latestEval = evaluations[0] ?? null;
  const tenure = Math.round((Date.now() - new Date(employee.dateOfJoining).getTime()) / (1000 * 60 * 60 * 24 * 365.25) * 10) / 10;

  const radarData = latestEval
    ? [
        { label: "Attendance", value: latestEval.attendanceScore },
        { label: "Punctuality", value: latestEval.punctualityScore },
        { label: "Productivity", value: latestEval.productivityScore },
        { label: "Quality", value: latestEval.qualityScore },
        { label: "Collaboration", value: latestEval.collaborationScore }
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/employees")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Directory
      </Button>

      {/* Header Card */}
      <Card className="overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
                <User className="h-8 w-8 text-cyan-200" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{employee.name}</h1>
                <p className="mt-1 text-sm text-slate-400">{employee.designation} · {employee.department}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {employee.email}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined {new Date(employee.dateOfJoining).toLocaleDateString()}</span>
                  <span>{tenure} years tenure</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[employee.status]}`}>
                    {employee.status}
                  </span>
                  <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-mono text-slate-400">
                    {employee.employeeId}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {latestEval && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{latestEval.overallScore}</p>
                  <p className="text-xs text-slate-500">Overall Score</p>
                </div>
              )}
              <Button variant="primary" onClick={handleEvaluate} disabled={evaluating || records.length === 0}>
                {evaluating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Run Evaluation
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Charts */}
      {(radarData.length > 0 || records.length > 0) && (
        <div className="grid gap-6 xl:grid-cols-2">
          {radarData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Score Breakdown</CardTitle>
                <CardDescription>Multi-dimensional performance profile</CardDescription>
              </CardHeader>
              <CardContent>
                <ScoreRadarChart scores={radarData} />
              </CardContent>
            </Card>
          )}
          {records.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance Trend</CardTitle>
                <CardDescription>Metrics over evaluated periods</CardDescription>
              </CardHeader>
              <CardContent>
                <EmployeeTrendChart records={records} />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Records Table */}
      {records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Records</CardTitle>
            <CardDescription>{records.length} period(s) of data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Ratings</TableHead>
                    <TableHead>OT</TableHead>
                    <TableHead>Late</TableHead>
                    <TableHead>Leaves</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium text-foreground">{r.period}</TableCell>
                      <TableCell>{r.attendanceDays}/{r.totalWorkingDays}</TableCell>
                      <TableCell>{r.avgWorkingHours}h ({r.avgLoginTime}–{r.avgLogoutTime})</TableCell>
                      <TableCell>{r.tasksCompleted}/{r.tasksAssigned}</TableCell>
                      <TableCell>{r.qualityScore}</TableCell>
                      <TableCell>P:{r.peerRating} M:{r.managerRating}</TableCell>
                      <TableCell>{r.overtimeHours}h</TableCell>
                      <TableCell>{r.lateArrivals}</TableCell>
                      <TableCell>{r.leavesUsed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evaluations History */}
      {evaluations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Evaluation History</CardTitle>
            <CardDescription>{evaluations.length} evaluation(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {evaluations.map((ev) => (
              <EvaluationCard key={ev._id} evaluation={ev} />
            ))}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No evaluations yet"
          description={records.length > 0 ? "Click 'Run Evaluation' to generate an AI-powered assessment." : "Upload performance data first, then run an evaluation."}
        />
      )}
    </div>
  );
}
