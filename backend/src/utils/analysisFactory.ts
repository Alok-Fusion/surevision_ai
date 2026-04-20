import type { IDecision } from "../models/Decision";
import type { Recommendation } from "../models/Analysis";

type DecisionLike = Pick<
  IDecision,
  | "title"
  | "description"
  | "department"
  | "industry"
  | "timeHorizon"
  | "budgetImpact"
  | "urgency"
  | "complianceSensitivity"
  | "currentPainPoint"
  | "stakeholdersAffected"
>;

const urgencyWeight = {
  low: 8,
  medium: 18,
  high: 30,
  critical: 42
} as const;

const complianceWeight = {
  low: 5,
  medium: 16,
  high: 28
} as const;

function clamp(value: number) {
  return Math.max(4, Math.min(96, Math.round(value)));
}

function scoreFromText(text: string) {
  return Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 23;
}

export function createDeterministicAnalysis(decision: DecisionLike, historicalCount = 0) {
  const textSignal = scoreFromText(`${decision.title}${decision.department}${decision.currentPainPoint}`);
  const budgetSignal = Math.min(22, Math.round(Math.log10(Math.max(1, decision.budgetImpact)) * 5));
  const riskScore = clamp(urgencyWeight[decision.urgency] + complianceWeight[decision.complianceSensitivity] + budgetSignal + textSignal);
  const complianceScore = clamp(96 - complianceWeight[decision.complianceSensitivity] - textSignal / 2);
  const roiScore = clamp(62 + Math.min(22, decision.budgetImpact / 250000) - riskScore / 8);
  const trustScore = clamp(88 - riskScore / 3 + historicalCount * 2);
  const humanImpactScore = clamp(72 - (decision.urgency === "critical" ? 18 : 4) + (decision.timeHorizon === 365 ? 8 : 0));

  let recommendation: Recommendation = "Approve";
  if (riskScore >= 74) recommendation = "Reject";
  else if (riskScore >= 58) recommendation = "Pilot";
  else if (complianceScore < 62) recommendation = "Revise";

  return {
    recommendation,
    riskScore,
    trustScore,
    complianceScore,
    roiScore,
    humanImpactScore,
    bestCase: `${decision.department} realizes measurable efficiency gains within ${decision.timeHorizon} days while keeping governance controls visible to the executive team.`,
    likelyCase: `The initiative improves the current pain point around ${decision.currentPainPoint.toLowerCase()} but needs staged adoption and owner-level accountability.`,
    worstCase: `Operational change outpaces controls, creating exception backlogs, stakeholder resistance, and audit scrutiny in ${decision.industry}.`,
    hiddenRisks: [
      "Downstream policy exceptions may not be visible in the source data.",
      "Vendor or team dependency concentration can delay remediation.",
      "Budget savings may be overstated if transition costs are absorbed by adjacent teams."
    ],
    silentPatterns: [
      historicalCount > 0 ? `${historicalCount} similar decisions exist in institutional history.` : "No close historical precedent was found in the seeded memory.",
      "High urgency decisions tend to under-document handoff ownership.",
      "Compliance-sensitive workflows show risk spikes when rollout phases are compressed."
    ],
    saferAlternative: "Run a governed pilot with measurable exit criteria, exception review cadence, and finance-owned benefit tracking.",
    rolloutPlan: [
      "Phase 1: Baseline process, risk, and cost metrics with named control owners.",
      "Phase 2: Pilot one operating unit with weekly compliance review.",
      "Phase 3: Expand only after SLA, exception, and adoption thresholds are met."
    ],
    executiveSummary: `SureVision AI recommends ${recommendation.toLowerCase()} for "${decision.title}" with a risk score of ${riskScore}. The decision has meaningful upside, but should be governed through phased controls, stakeholder communication, and tracked ROI.`,
    boardroomDebate: [
      {
        role: "CFO" as const,
        stance: roiScore > 68 ? "Support with tracked savings" : "Conditional support",
        concern: "Requires auditable savings attribution and budget leakage controls."
      },
      {
        role: "COO" as const,
        stance: "Pilot before scale",
        concern: "Operational dependencies and SLA drift need early detection."
      },
      {
        role: "CHRO" as const,
        stance: humanImpactScore > 65 ? "Manageable people impact" : "Needs workforce plan",
        concern: "Role changes and adoption friction must be communicated early."
      },
      {
        role: "Compliance Head" as const,
        stance: complianceScore > 70 ? "Proceed with controls" : "Revise governance",
        concern: "Control mapping and exception ownership need explicit sign-off."
      }
    ]
  };
}

