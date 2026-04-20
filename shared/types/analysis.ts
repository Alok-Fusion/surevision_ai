export type Recommendation = "Approve" | "Revise" | "Reject" | "Pilot";

export type TimeHorizon = 30 | 90 | 365;

export type Urgency = "low" | "medium" | "high" | "critical";

export type DecisionPayload = {
  title: string;
  description: string;
  department: string;
  industry: string;
  timeHorizon: TimeHorizon;
  stakeholdersAffected: string;
  budgetImpact: number;
  urgency: Urgency;
  complianceSensitivity: "low" | "medium" | "high";
  currentPainPoint: string;
};

export type BoardroomViewpoint = {
  role: "CFO" | "COO" | "CHRO" | "Compliance Head";
  stance: string;
  concern: string;
};

export type AnalysisResult = {
  recommendation: Recommendation;
  riskScore: number;
  trustScore: number;
  complianceScore: number;
  roiScore: number;
  humanImpactScore: number;
  bestCase: string;
  likelyCase: string;
  worstCase: string;
  hiddenRisks: string[];
  silentPatterns: string[];
  saferAlternative: string;
  rolloutPlan: string[];
  executiveSummary: string;
  boardroomDebate?: BoardroomViewpoint[];
};

export type WhatIfScenario = {
  scenario: string;
  department?: string;
  baselineCost?: number;
  baselineRisk?: number;
};

export type WhatIfResult = {
  costSaved: number;
  riskDelta: number;
  slaImpact: string;
  customerImpact: string;
  recommendation: string;
};

