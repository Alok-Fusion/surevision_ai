"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BrainCircuit, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import type { DecisionPayload } from "@/types";

const initialForm: DecisionPayload = {
  title: "",
  description: "",
  department: "Finance",
  industry: "Banking",
  timeHorizon: 90,
  stakeholdersAffected: "",
  budgetImpact: 250000,
  urgency: "medium",
  complianceSensitivity: "medium",
  currentPainPoint: ""
};

export function DecisionForm() {
  const router = useRouter();
  const [form, setForm] = useState<DecisionPayload>(initialForm);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post<{ decision: { _id: string } }>("/decision", form);
      toast.success("Decision intelligence generated");
      router.push(`/results/${response.decision._id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Decision analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10">
            <BrainCircuit className="h-5 w-5 text-emerald-200" />
          </span>
          <div>
            <CardTitle>Analyze Decision</CardTitle>
            <p className="text-sm text-muted-foreground">Model executive outcomes, hidden risks, and safer rollout paths.</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <form className="grid gap-5 lg:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="title">Decision Title</Label>
            <Input id="title" placeholder='e.g., "Automate Vendor AP Reconciliation using AI"' value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="description">Decision Description</Label>
            <Textarea
              id="description"
              placeholder='e.g., "We process 3,000 invoices locally per month with 18% exception rate. We want to cut this to 5%."'
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select id="department" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })}>
              {["Finance", "Operations", "Compliance", "Procurement", "HR", "Trade Finance", "Claims", "Logistics", "IT/Security", "Legal", "Marketing", "R&D", "Sales"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Select id="industry" value={form.industry} onChange={(event) => setForm({ ...form, industry: event.target.value })}>
              {["Banking", "Insurance", "Logistics", "Manufacturing", "Healthcare", "Retail", "Technology", "Public Sector", "Energy", "Real Estate", "Education"].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeHorizon">Time Horizon</Label>
            <Select
              id="timeHorizon"
              value={String(form.timeHorizon)}
              onChange={(event) => setForm({ ...form, timeHorizon: Number(event.target.value) as 30 | 90 | 365 })}
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">365 days</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="budgetImpact">Estimated Budget Impact</Label>
            <Input
              id="budgetImpact"
              type="number"
              min={0}
              value={form.budgetImpact}
              onChange={(event) => setForm({ ...form, budgetImpact: Number(event.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="urgency">Urgency</Label>
            <Select id="urgency" value={form.urgency} onChange={(event) => setForm({ ...form, urgency: event.target.value as DecisionPayload["urgency"] })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="complianceSensitivity">Compliance Sensitivity</Label>
            <Select
              id="complianceSensitivity"
              value={form.complianceSensitivity}
              onChange={(event) =>
                setForm({ ...form, complianceSensitivity: event.target.value as DecisionPayload["complianceSensitivity"] })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="stakeholdersAffected">Stakeholders Affected</Label>
            <Input
              id="stakeholdersAffected"
              placeholder='e.g., "AP Team, Vendor Relations"'
              value={form.stakeholdersAffected}
              onChange={(event) => setForm({ ...form, stakeholdersAffected: event.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentPainPoint">Current Pain Point</Label>
            <Input
              id="currentPainPoint"
              placeholder='e.g., "Late payment penalties"'
              value={form.currentPainPoint}
              onChange={(event) => setForm({ ...form, currentPainPoint: event.target.value })}
              required
            />
          </div>
          <div className="lg:col-span-2">
            <Button disabled={loading} size="lg">
              <Send className="h-4 w-4" />
              {loading ? "Analyzing" : "Generate Decision Intelligence"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
