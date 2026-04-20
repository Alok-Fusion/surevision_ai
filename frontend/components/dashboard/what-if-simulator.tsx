"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Activity, Banknote, Gauge, Users, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

const scenarios = [
  "If process X is automated",
  "If vendor Y is replaced",
  "If staff reduced by 20%",
  "If pricing increases by 5%"
];

type Result = {
  costSaved: number;
  riskDelta: number;
  slaImpact: string;
  customerImpact: string;
  recommendation: string;
};

export function WhatIfSimulator() {
  const [scenario, setScenario] = useState(scenarios[0]);
  const [baselineCost, setBaselineCost] = useState(1000000);
  const [baselineRisk, setBaselineRisk] = useState(55);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const response = await api.post<Result>("/whatif", { scenario, baselineCost, baselineRisk });
      setResult(response);
      toast.success("Scenario forecast generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Scenario forecast failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>What-If Simulator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="scenario">Scenario</Label>
            <Select id="scenario" value={scenario} onChange={(event) => setScenario(event.target.value)}>
              {scenarios.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Baseline Cost</Label>
            <Input id="cost" type="number" value={baselineCost} onChange={(event) => setBaselineCost(Number(event.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risk">Baseline Risk</Label>
            <Input id="risk" type="number" min={0} max={100} value={baselineRisk} onChange={(event) => setBaselineRisk(Number(event.target.value))} />
          </div>
          <Button onClick={run} disabled={loading}>
            <Gauge className="h-4 w-4" />
            {loading ? "Forecasting" : "Run Simulation"}
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Outcome icon={Banknote} label="Cost Saved" value={formatCurrency(result.costSaved)} />
          <Outcome icon={Activity} label="Risk Increase / Decrease" value={`${result.riskDelta > 0 ? "+" : ""}${result.riskDelta} pts`} />
          <Outcome icon={Gauge} label="SLA Impact" value={result.slaImpact} text />
          <Outcome icon={Users} label="Customer Impact" value={result.customerImpact} text />
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">{result.recommendation}</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={Gauge}
          title="Run a scenario"
          description="Generate a Gemini-backed forecast to compare cost, risk, SLA, and customer impact."
        />
      )}
    </div>
  );
}

function Outcome({ icon: Icon, label, value, text = false }: { icon: LucideIcon; label: string; value: string; text?: boolean }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10">
          <Icon className="h-5 w-5 text-emerald-200" />
        </span>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className={text ? "mt-4 text-sm leading-6 text-foreground" : "mt-4 text-3xl font-semibold text-foreground"}>{value}</p>
    </Card>
  );
}
