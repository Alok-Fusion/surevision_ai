"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { EmployeeEvaluationRow, EmployeeDetail, EvaluationRecommendation } from "@/types";

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

const REC_ICONS: Record<string, React.ElementType> = {
  promote: CheckCircle2,
  salary_hike: TrendingUp,
  maintain: CheckCircle2,
  pip: AlertTriangle,
  role_change: TrendingUp,
  demote: AlertTriangle
};

interface Props {
  evaluation: EmployeeEvaluationRow;
  compact?: boolean;
}

export function EvaluationCard({ evaluation, compact }: Props) {
  const [expanded, setExpanded] = useState(false);
  const ev = evaluation;
  const RecIcon = REC_ICONS[ev.recommendation] ?? CheckCircle2;
  const empDetail = typeof ev.employeeRef === "object" ? ev.employeeRef as EmployeeDetail : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-200 hover:border-white/20">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${REC_COLORS[ev.recommendation]}`}>
          <RecIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {empDetail && (
              <Link
                href={`/employees/${(ev.employeeRef as EmployeeDetail)._id ?? ""}`}
                className="font-medium text-foreground hover:text-cyan-200 transition"
                onClick={(e) => e.stopPropagation()}
              >
                {empDetail.name}
              </Link>
            )}
            <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-semibold ${REC_COLORS[ev.recommendation]}`}>
              {REC_LABELS[ev.recommendation] ?? ev.recommendation}
            </span>
            {ev.salaryHikePercent != null && ev.salaryHikePercent > 0 && (
              <span className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-xs font-semibold text-sky-300">
                +{ev.salaryHikePercent}%
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            {empDetail && <span>{empDetail.department} · {empDetail.designation}</span>}
            <span>Score: <strong className="text-foreground">{ev.overallScore}</strong>/100</span>
            <span>Confidence: <strong className="text-foreground">{ev.confidenceLevel}%</strong></span>
            <span>{new Date(ev.evaluationDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="hidden w-32 sm:block">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                ev.confidenceLevel >= 75 ? "bg-emerald-400" : ev.confidenceLevel >= 50 ? "bg-amber-400" : "bg-red-400"
              }`}
              style={{ width: `${ev.confidenceLevel}%` }}
            />
          </div>
        </div>

        {expanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
      </button>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-white/10 p-5 space-y-5">
          {/* Score Breakdown */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Score Breakdown</p>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {[
                ["Attendance", ev.attendanceScore],
                ["Punctuality", ev.punctualityScore],
                ["Productivity", ev.productivityScore],
                ["Quality", ev.qualityScore],
                ["Collaboration", ev.collaborationScore],
                ["Overall", ev.overallScore]
              ].map(([label, score]) => (
                <div key={label as string} className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-xl font-bold text-foreground">{score}</p>
                  <p className="mt-1 text-xs text-slate-400">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Executive Summary</p>
            <p className="text-sm leading-6 text-slate-300">{ev.executiveSummary}</p>
          </div>

          {/* Trend Analysis */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Trend Analysis</p>
            <p className="text-sm leading-6 text-slate-300">{ev.trendAnalysis}</p>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">Strengths</p>
              <ul className="space-y-1">
                {ev.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">Weaknesses</p>
              <ul className="space-y-1">
                {ev.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Items */}
          {ev.actionItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2">Action Items</p>
              <ul className="space-y-1">
                {ev.actionItems.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk Flags */}
          {ev.riskFlags.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">Risk Flags</p>
              <div className="flex flex-wrap gap-2">
                {ev.riskFlags.map((f, i) => (
                  <span key={i} className="rounded-lg border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-xs font-medium text-red-300">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Periods Covered */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Periods covered:</span>
            {ev.periodsCovered.map((p) => (
              <span key={p} className="rounded border border-white/10 bg-white/5 px-2 py-0.5">{p}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
