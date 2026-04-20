import type { IEmployeeRecord } from "../models/EmployeeRecord";

export interface ScoreBreakdown {
  attendanceScore: number;
  punctualityScore: number;
  productivityScore: number;
  qualityScore: number;
  collaborationScore: number;
  overtimeDisciplineScore: number;
  overallScore: number;
}

const WEIGHTS = {
  attendance: 0.20,
  punctuality: 0.10,
  productivity: 0.25,
  quality: 0.20,
  collaboration: 0.15,
  overtimeDiscipline: 0.10
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.round(Math.max(min, Math.min(max, value)));
}

function computeAttendance(records: IEmployeeRecord[]): number {
  if (records.length === 0) return 0;
  const totalAttended = records.reduce((sum, r) => sum + r.attendanceDays, 0);
  const totalWorking = records.reduce((sum, r) => sum + r.totalWorkingDays, 0);
  return totalWorking > 0 ? clamp((totalAttended / totalWorking) * 100) : 0;
}

function computePunctuality(records: IEmployeeRecord[]): number {
  if (records.length === 0) return 0;
  const totalLate = records.reduce((sum, r) => sum + r.lateArrivals, 0);
  const totalWorking = records.reduce((sum, r) => sum + r.totalWorkingDays, 0);
  return totalWorking > 0 ? clamp(100 - (totalLate / totalWorking) * 100) : 0;
}

function computeProductivity(records: IEmployeeRecord[]): number {
  if (records.length === 0) return 0;
  const totalAssigned = records.reduce((sum, r) => sum + r.tasksAssigned, 0);
  const totalCompleted = records.reduce((sum, r) => sum + r.tasksCompleted, 0);
  return totalAssigned > 0 ? clamp((totalCompleted / totalAssigned) * 100) : 0;
}

function computeQuality(records: IEmployeeRecord[]): number {
  if (records.length === 0) return 0;
  const avg = records.reduce((sum, r) => sum + r.qualityScore, 0) / records.length;
  return clamp(avg);
}

function computeCollaboration(records: IEmployeeRecord[]): number {
  if (records.length === 0) return 0;
  const avgPeer = records.reduce((sum, r) => sum + r.peerRating, 0) / records.length;
  const avgManager = records.reduce((sum, r) => sum + r.managerRating, 0) / records.length;
  return clamp(((avgPeer + avgManager) / 10) * 100);
}

function computeOvertimeDiscipline(records: IEmployeeRecord[]): number {
  if (records.length === 0) return 0;
  const avgOvertime = records.reduce((sum, r) => sum + r.overtimeHours, 0) / records.length;
  // Optimal overtime is 0-10 hours/month. Excessive overtime (>30h) indicates burnout risk
  if (avgOvertime <= 10) return 100;
  if (avgOvertime <= 20) return clamp(100 - (avgOvertime - 10) * 3);
  if (avgOvertime <= 30) return clamp(70 - (avgOvertime - 20) * 4);
  return clamp(30 - (avgOvertime - 30) * 2);
}

export function computeScores(records: IEmployeeRecord[]): ScoreBreakdown {
  const attendanceScore = computeAttendance(records);
  const punctualityScore = computePunctuality(records);
  const productivityScore = computeProductivity(records);
  const qualityScore = computeQuality(records);
  const collaborationScore = computeCollaboration(records);
  const overtimeDisciplineScore = computeOvertimeDiscipline(records);

  const overallScore = clamp(
    attendanceScore * WEIGHTS.attendance +
    punctualityScore * WEIGHTS.punctuality +
    productivityScore * WEIGHTS.productivity +
    qualityScore * WEIGHTS.quality +
    collaborationScore * WEIGHTS.collaboration +
    overtimeDisciplineScore * WEIGHTS.overtimeDiscipline
  );

  return {
    attendanceScore,
    punctualityScore,
    productivityScore,
    qualityScore,
    collaborationScore,
    overtimeDisciplineScore,
    overallScore
  };
}

/**
 * Deterministic recommendation fallback when the AI engine is unavailable.
 * Uses overall score thresholds to generate a baseline recommendation.
 */
export function deterministicRecommendation(scores: ScoreBreakdown): {
  recommendation: string;
  confidenceLevel: number;
  strengths: string[];
  weaknesses: string[];
  riskFlags: string[];
} {
  const { overallScore, attendanceScore, punctualityScore, productivityScore, qualityScore, collaborationScore, overtimeDisciplineScore } = scores;

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const riskFlags: string[] = [];

  if (attendanceScore >= 90) strengths.push("Excellent attendance record");
  else if (attendanceScore < 70) { weaknesses.push("Below-average attendance"); riskFlags.push("Chronic absenteeism risk"); }

  if (punctualityScore >= 90) strengths.push("Consistently punctual");
  else if (punctualityScore < 70) weaknesses.push("Frequent late arrivals");

  if (productivityScore >= 90) strengths.push("High task completion rate");
  else if (productivityScore < 60) { weaknesses.push("Low task completion"); riskFlags.push("Productivity bottleneck"); }

  if (qualityScore >= 85) strengths.push("Delivers high-quality work");
  else if (qualityScore < 60) { weaknesses.push("Quality needs improvement"); riskFlags.push("Declining output quality"); }

  if (collaborationScore >= 80) strengths.push("Strong team collaboration");
  else if (collaborationScore < 50) weaknesses.push("Poor peer and manager ratings");

  if (overtimeDisciplineScore < 50) riskFlags.push("Burnout risk due to excessive overtime");

  let recommendation: string;
  let confidenceLevel: number;

  if (overallScore >= 85) {
    recommendation = "promote";
    confidenceLevel = Math.min(95, 70 + (overallScore - 85));
  } else if (overallScore >= 75) {
    recommendation = "salary_hike";
    confidenceLevel = Math.min(90, 65 + (overallScore - 75));
  } else if (overallScore >= 60) {
    recommendation = "maintain";
    confidenceLevel = 70;
  } else if (overallScore >= 45) {
    recommendation = "pip";
    confidenceLevel = Math.min(85, 60 + (60 - overallScore));
  } else {
    recommendation = "demote";
    confidenceLevel = Math.min(80, 55 + (45 - overallScore));
  }

  return { recommendation, confidenceLevel, strengths, weaknesses, riskFlags };
}
