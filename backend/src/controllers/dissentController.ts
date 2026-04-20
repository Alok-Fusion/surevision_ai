import type { RequestHandler } from "express";
import { Objection } from "../models/Objection";
import { Decision } from "../models/Decision";
import { Analysis } from "../models/Analysis";
import { AppError } from "../middleware/error";
import type { AuthenticatedRequest } from "../middleware/auth";
import { runDissentReevaluation } from "../services/aiEngineService";
import { getUserGeminiApiKey } from "../services/userSettingsService";

export const getObjections: RequestHandler = async (req: AuthenticatedRequest, res) => {
  const objections = await Objection.find({ decisionId: req.params.id })
    .populate("submittedBy", "name email role")
    .sort({ createdAt: -1 });
  
  res.json({ objections });
};

async function syncDecisionDissent(decisionId: string, geminiApiKey?: string) {
  const objections = await Objection.find({ decisionId }).lean();
  
  const analysis = await Analysis.findOne({ decisionId });
  if (!analysis) throw new AppError("Analysis not found for decision", 404);

  // Use the original AI score from Analysis, since trustScore inside Decision.dissentSummary
  // represents the dynamically penalized score.
  // Wait, the trustScore in Analysis IS the original score.
  const originalTrustScore = analysis.trustScore;

  const result = await runDissentReevaluation(
    originalTrustScore,
    objections,
    geminiApiKey
  );

  const minorCount = objections.filter(o => o.severity === "minor" && o.status === "active").length;
  const majorCount = objections.filter(o => o.severity === "major" && o.status === "active").length;
  const blockingCount = objections.filter(o => o.severity === "blocking" && o.status === "active").length;

  await Decision.findByIdAndUpdate(decisionId, {
    "dissentSummary.minorCount": minorCount,
    "dissentSummary.majorCount": majorCount,
    "dissentSummary.blockingCount": blockingCount,
    "dissentSummary.trustScoreDelta": result.delta
  });

  return result;
}

export const submitObjection: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const decisionId = req.params.id;
  const { category, severity, rationale } = req.body;

  const objection = await Objection.create({
    decisionId,
    submittedBy: req.user.userId,
    category,
    severity,
    rationale,
    status: "active"
  });

  const geminiApiKey = await getUserGeminiApiKey(req.user.userId);
  const aiResult = await syncDecisionDissent(decisionId, geminiApiKey);

  res.status(201).json({ objection, ...aiResult });
};

export const resolveObjection: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const { adminNote } = req.body;
  const { id: decisionId, objectionId } = req.params;

  const objection = await Objection.findByIdAndUpdate(objectionId, {
    status: "resolved",
    adminNote
  }, { new: true });

  if (!objection) throw new AppError("Objection not found", 404);

  const geminiApiKey = await getUserGeminiApiKey(req.user.userId);
  const aiResult = await syncDecisionDissent(decisionId, geminiApiKey);

  res.json({ message: "Objection resolved", objection, ...aiResult });
};

export const dismissObjection: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const { adminNote } = req.body;
  const { id: decisionId, objectionId } = req.params;

  const objection = await Objection.findByIdAndUpdate(objectionId, {
    status: "dismissed",
    adminNote
  }, { new: true });

  if (!objection) throw new AppError("Objection not found", 404);

  const geminiApiKey = await getUserGeminiApiKey(req.user.userId);
  const aiResult = await syncDecisionDissent(decisionId, geminiApiKey);

  res.json({ message: "Objection dismissed", objection, ...aiResult });
};
