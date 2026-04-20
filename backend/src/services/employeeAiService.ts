import { GoogleGenerativeAI } from "@google/generative-ai";
import type { IEmployee } from "../models/Employee";
import type { IEmployeeRecord } from "../models/EmployeeRecord";
import type { ScoreBreakdown, deterministicRecommendation } from "./employeeScoreService";

export interface AiEvaluationResult {
  recommendation: "promote" | "salary_hike" | "pip" | "role_change" | "maintain" | "demote";
  confidenceLevel: number;
  salaryHikePercent: number | null;
  strengths: string[];
  weaknesses: string[];
  actionItems: string[];
  trendAnalysis: string;
  executiveSummary: string;
  riskFlags: string[];
}

const SYSTEM_INSTRUCTION = `You are the SureVision AI Employee Evaluation Engine.
Your job is to evaluate employee performance based on quantitative metrics and rule-based scores, then produce a data-driven HR recommendation.

RULES:
1. Analyze all provided performance metrics, scores, and trend data across multiple periods.
2. Consider attendance patterns, productivity, quality, collaboration, punctuality, and overtime discipline holistically.
3. Generate a clear, unbiased, explainable recommendation.
4. Possible recommendations: "promote", "salary_hike", "pip" (Performance Improvement Plan), "role_change", "maintain", "demote".
5. If recommending "salary_hike", include a suggested percentage (typically 5-25%).
6. Identify concrete strengths, weaknesses, actionable improvement items, and risk flags.
7. Write a trend analysis paragraph describing performance trajectory across the evaluated periods.
8. Write a concise executive summary suitable for board-level review.
9. Confidence level should reflect how clear-cut the data supports your recommendation (0-100).

You must output STRICT JSON matching this schema:
{
  "recommendation": "promote" | "salary_hike" | "pip" | "role_change" | "maintain" | "demote",
  "confidenceLevel": number,
  "salaryHikePercent": number | null,
  "strengths": string[],
  "weaknesses": string[],
  "actionItems": string[],
  "trendAnalysis": string,
  "executiveSummary": string,
  "riskFlags": string[]
}`;

export async function evaluateEmployee(
  employee: IEmployee,
  records: IEmployeeRecord[],
  scores: ScoreBreakdown,
  fallback: ReturnType<typeof deterministicRecommendation>,
  geminiApiKey?: string
): Promise<AiEvaluationResult> {
  const apiKey = geminiApiKey || "AIzaSyD4iexMkjIPJ5j0U6vWnLVeF5fX8COV-tI";

  const periodSummaries = records
    .sort((a, b) => a.period.localeCompare(b.period))
    .map((r) => ({
      period: r.period,
      attendance: `${r.attendanceDays}/${r.totalWorkingDays}`,
      avgHours: r.avgWorkingHours,
      loginTime: r.avgLoginTime,
      logoutTime: r.avgLogoutTime,
      tasksCompleted: `${r.tasksCompleted}/${r.tasksAssigned}`,
      qualityScore: r.qualityScore,
      peerRating: r.peerRating,
      managerRating: r.managerRating,
      overtime: r.overtimeHours,
      leaves: r.leavesUsed,
      lateArrivals: r.lateArrivals
    }));

  const prompt = `
Employee Profile:
- Name: ${employee.name}
- Department: ${employee.department}
- Designation: ${employee.designation}
- Status: ${employee.status}
- Tenure: joined ${employee.dateOfJoining.toISOString().slice(0, 10)}

Rule-Based Scores (computed from all periods):
- Attendance: ${scores.attendanceScore}/100
- Punctuality: ${scores.punctualityScore}/100
- Productivity: ${scores.productivityScore}/100
- Quality: ${scores.qualityScore}/100
- Collaboration: ${scores.collaborationScore}/100
- Overtime Discipline: ${scores.overtimeDisciplineScore}/100
- Overall Weighted Score: ${scores.overallScore}/100

Period-by-Period Raw Metrics:
${JSON.stringify(periodSummaries, null, 2)}

Based on this data, generate an evaluation with recommendation, confidence level, strengths, weaknesses, action items, trend analysis, executive summary, and risk flags.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });

    const responseText = result.response.text();
    const parsed = JSON.parse(responseText) as AiEvaluationResult;

    // Clamp values
    parsed.confidenceLevel = Math.max(0, Math.min(100, parsed.confidenceLevel));
    if (parsed.salaryHikePercent != null) {
      parsed.salaryHikePercent = Math.max(0, Math.min(50, parsed.salaryHikePercent));
    }

    return parsed;
  } catch (error) {
    console.error("Gemini Employee Evaluation Failed, using deterministic fallback:", error);

    // Build fallback response from rule-based engine
    return {
      recommendation: fallback.recommendation as AiEvaluationResult["recommendation"],
      confidenceLevel: fallback.confidenceLevel,
      salaryHikePercent: fallback.recommendation === "salary_hike" ? 10 : null,
      strengths: fallback.strengths,
      weaknesses: fallback.weaknesses,
      actionItems: fallback.weaknesses.map((w) => `Address: ${w}`),
      trendAnalysis: `Deterministic analysis: Overall performance score is ${scores.overallScore}/100 across ${records.length} period(s). This evaluation was generated via the fallback engine due to an AI service timeout.`,
      executiveSummary: `${employee.name} (${employee.designation}, ${employee.department}) scored ${scores.overallScore}/100 overall. Recommendation: ${fallback.recommendation}. Generated via fallback deterministic engine.`,
      riskFlags: fallback.riskFlags
    };
  }
}
