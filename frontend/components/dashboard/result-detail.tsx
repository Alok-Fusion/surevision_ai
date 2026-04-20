"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, FileDown, Mail, ShieldCheck } from "lucide-react";
import { DissentPanel } from "@/components/decision/dissent-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { formatCurrency, recommendationTone, scoreTone } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { AnalysisResult, DecisionRow } from "@/types";

type DetailResponse = {
  decision: DecisionRow & {
    description?: string;
    budgetImpact?: number;
    stakeholdersAffected?: string;
    currentPainPoint?: string;
  };
  analysis: AnalysisResult | null;
};

const scorecards: { key: keyof AnalysisResult; label: string }[] = [
  { key: "riskScore", label: "Risk Score" },
  { key: "trustScore", label: "Trust Score" },
  { key: "complianceScore", label: "Compliance Score" },
  { key: "roiScore", label: "ROI Score" },
  { key: "humanImpactScore", label: "Human Impact Score" }
];

export function ResultDetail({ id }: { id: string }) {
  const user = useAuthStore((state) => state.user);
  const [decision, setDecision] = useState<DetailResponse["decision"] | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    api
      .get<DetailResponse>(`/decision/${id}`)
      .then((response) => {
        if (!active) return;
        setDecision(response.decision);
        setAnalysis(response.analysis);
      })
      .catch((loadError) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load this report.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  async function exportReport(kind: "pdf" | "csv") {
    try {
      const blob = await api.post<Blob>(`/export/${kind}`, { decisionId: id });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `surevision-${id}.${kind}`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success(`${kind.toUpperCase()} export ready`);
    } catch (exportError) {
      toast.error(exportError instanceof Error ? exportError.message : `Could not export ${kind.toUpperCase()}.`);
    }
  }

  async function emailReport() {
    try {
      if (!user?.email) {
        toast.error("You must be logged in to send emails.");
        return;
      }
      await api.post("/email", { decisionId: id, to: user.email });
      toast.success(`Report queued to ${user.email}`);
    } catch (sendError) {
      toast.error(sendError instanceof Error ? sendError.message : "Could not queue the email report.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-72" />
        <div className="grid gap-6 xl:grid-cols-3">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      </div>
    );
  }

  if (error || !decision) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Report unavailable"
        description={error ?? "The requested decision report could not be found."}
      />
    );
  }

  if (!analysis) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Analysis not ready"
        description="This decision exists, but its analysis payload has not been saved yet."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="border-b border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge className={recommendationTone(analysis.recommendation)}>Recommendation: {analysis.recommendation}</Badge>
              <h2 className="mt-4 max-w-4xl text-3xl font-semibold text-foreground">{decision.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                {decision.department} decision for {decision.industry}. Budget exposure{" "}
                {formatCurrency(decision.budgetImpact ?? 0)}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => exportReport("pdf")}>
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
              <Button variant="secondary" onClick={() => exportReport("csv")}>
                <FileDown className="h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="secondary" onClick={emailReport}>
                <Mail className="h-4 w-4" />
                Email Report
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="grid gap-4 pt-5 md:grid-cols-2 xl:grid-cols-5">
          {scorecards.map((score) => {
            const value = Number(analysis[score.key]);
            return (
              <div key={score.key} className={`rounded-2xl border p-4 ${scoreTone(value)}`}>
                <p className="text-sm font-medium">{score.label}</p>
                <p className="mt-3 text-3xl font-semibold">{value}</p>
                <Progress value={value} className="mt-4 bg-black/20" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="mt-8">
        <TabsList className="grid w-full grid-cols-5 mb-8 bg-white/5 border border-white/10 rounded-xl p-1">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="scenarios" className="rounded-lg">Scenarios</TabsTrigger>
          <TabsTrigger value="risks" className="rounded-lg">Risks & Patterns</TabsTrigger>
          <TabsTrigger value="strategy" className="rounded-lg">Strategy & Rollout</TabsTrigger>
          <TabsTrigger value="dissent" className="rounded-lg">Dissent Panel</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0 space-y-6">
          <Section title="Executive Summary" body={analysis.executiveSummary} large />
        </TabsContent>

        <TabsContent value="scenarios" className="mt-0">
          <div className="grid gap-6 xl:grid-cols-3">
            <Section title="Best Case Scenario" body={analysis.bestCase} />
            <Section title="Most Likely Scenario" body={analysis.likelyCase} />
            <Section title="Worst Case Scenario" body={analysis.worstCase} />
          </div>
        </TabsContent>

        <TabsContent value="risks" className="mt-0 space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <ListSection title="Hidden Risks" items={analysis.hiddenRisks} />
            <ListSection title="Silent Patterns Detected" items={analysis.silentPatterns} />
          </div>
          <Section title="Suggested Safer Alternative" body={analysis.saferAlternative} />
        </TabsContent>

        <TabsContent value="strategy" className="mt-0 space-y-6">
          <ListSection title="Phased Rollout Plan" items={analysis.rolloutPlan} />
          <Card>
            <CardHeader>
              <CardTitle>Boardroom Debate Mode</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {(analysis.boardroomDebate ?? []).map((view) => (
                <div key={view.role} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <ShieldCheck className="h-4 w-4 text-emerald-200" />
                    {view.role}
                  </div>
                  <p className="mt-3 text-sm font-medium text-cyan-100">{view.stance}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{view.concern}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dissent" className="mt-0">
          <DissentPanel decisionId={id} initialTrustScore={analysis.trustScore} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Section({ title, body, large = false }: { title: string; body: string; large?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`${large ? "text-base" : "text-sm"} leading-7 text-muted-foreground`}>{body}</p>
      </CardContent>
    </Card>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-muted-foreground">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
            No items were returned for this section.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
