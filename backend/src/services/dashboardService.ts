import { Analysis } from "../models/Analysis";
import { Alert } from "../models/Alert";
import { Decision } from "../models/Decision";
import { Upload } from "../models/Upload";
import { Types } from "mongoose";

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });

export async function getDashboard(userId?: string) {
  const decisionFilter: Record<string, unknown> = {};
  if (userId) decisionFilter.createdBy = new Types.ObjectId(userId);

  // Get user-scoped decision IDs for analysis queries
  const userDecisionIds = userId
    ? (await Decision.find(decisionFilter).select("_id").lean()).map(d => d._id)
    : null;

  const analysisFilter: Record<string, unknown> = {};
  if (userDecisionIds) analysisFilter.decisionId = { $in: userDecisionIds };

  const [totalAnalyses, avgRisk, complianceAlerts, vendorAlerts, costAlerts, openAlerts, pendingReviews] = await Promise.all([
    Analysis.countDocuments(analysisFilter),
    Analysis.aggregate<{ avg: number }>([
      ...(userDecisionIds ? [{ $match: { decisionId: { $in: userDecisionIds } } }] : []),
      { $group: { _id: null, avg: { $avg: "$riskScore" } } }
    ]),
    Alert.countDocuments({ resolved: false, type: "compliance" }),
    Alert.countDocuments({ resolved: false, type: "vendor" }),
    Alert.countDocuments({ resolved: false, type: "cost" }),
    Alert.find({ resolved: false, severity: { $in: ["high", "critical"] } }).sort({ createdAt: -1 }).limit(8).lean(),
    Analysis.countDocuments({ ...analysisFilter, recommendation: { $in: ["Pilot", "Revise"] } })
  ]);

  const [departmentRisk, riskTrend, uploadCategories, recentDecisions] = await Promise.all([
    Analysis.aggregate<{ department: string; risk: number }>([
      ...(userDecisionIds ? [{ $match: { decisionId: { $in: userDecisionIds } } }] : []),
      {
        $lookup: {
          from: "decisions",
          localField: "decisionId",
          foreignField: "_id",
          as: "decision"
        }
      },
      { $unwind: "$decision" },
      { $group: { _id: "$decision.department", risk: { $avg: "$riskScore" } } },
      { $project: { _id: 0, department: "$_id", risk: { $round: ["$risk", 0] } } },
      { $sort: { risk: -1 } },
      { $limit: 6 }
    ]),
    Analysis.aggregate<{ risk: number; trust: number; year: number; month: number }>([
      ...(userDecisionIds ? [{ $match: { decisionId: { $in: userDecisionIds } } }] : []),
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          risk: { $avg: "$riskScore" },
          trust: { $avg: "$trustScore" }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          risk: { $round: ["$risk", 0] },
          trust: { $round: ["$trust", 0] }
        }
      },
      { $sort: { year: 1, month: 1 } },
      { $limit: 12 }
    ]),
    Upload.aggregate<{ name: string; value: number }>([
      { $group: { _id: "$category", value: { $sum: 1 } } },
      { $project: { _id: 0, name: "$_id", value: 1 } },
      { $sort: { value: -1, name: 1 } },
      { $limit: 6 }
    ]),
    Decision.find(decisionFilter).sort({ createdAt: -1 }).limit(7).lean()
  ]);

  const recentAnalyses = await Analysis.find({
    decisionId: { $in: recentDecisions.map((decision) => decision._id) }
  }).lean();
  const analysesByDecisionId = new Map(recentAnalyses.map((analysis) => [String(analysis.decisionId), analysis]));

  return {
    metrics: {
      totalAnalyses,
      avgRiskScore: Math.round(avgRisk[0]?.avg ?? 0),
      complianceAlerts,
      costLeakageOpportunities: costAlerts,
      vendorRiskCount: vendorAlerts,
      decisionsPendingReview: pendingReviews
    },
    riskTrend: riskTrend.map((bucket) => ({
      month: monthFormatter.format(new Date(bucket.year, bucket.month - 1, 1)),
      risk: bucket.risk,
      trust: bucket.trust
    })),
    departmentRisk,
    costLeakage: uploadCategories,
    recentDecisions: recentDecisions.map((decision) => ({
      ...decision,
      analysis: analysesByDecisionId.get(String(decision._id))
    })),
    highPriorityAlerts: openAlerts
  };
}
