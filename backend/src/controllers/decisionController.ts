import type { RequestHandler } from "express";
import { Analysis } from "../models/Analysis";
import { AuditLog } from "../models/AuditLog";
import { Decision } from "../models/Decision";
import { AppError } from "../middleware/error";
import type { AuthenticatedRequest } from "../middleware/auth";
import { analyzeDecision } from "../services/aiEngineService";
import { getUserGeminiApiKey } from "../services/userSettingsService";

export const createDecision: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const historicalCount = await Decision.countDocuments({
    department: req.body.department,
    industry: req.body.industry
  });

  const decision = await Decision.create({
    ...req.body,
    createdBy: req.user.userId
  });

  const geminiApiKey = await getUserGeminiApiKey(req.user.userId);
  const analysisPayload = await analyzeDecision(decision, historicalCount, geminiApiKey);
  const analysis = await Analysis.create({
    ...analysisPayload,
    decisionId: decision._id
  });

  await AuditLog.create({
    userId: req.user.userId,
    action: "decision.created",
    metadata: { decisionId: decision._id, recommendation: analysis.recommendation }
  });

  res.status(201).json({ decision, analysis });
};

export const getDecision: RequestHandler = async (req: AuthenticatedRequest, res) => {
  const decision = await Decision.findById(req.params.id).populate("createdBy", "name email role");
  if (!decision) throw new AppError("Decision not found", 404);

  if (decision.createdBy._id.toString() !== req.user?.userId && req.user?.role !== "admin") {
    throw new AppError("Forbidden: You do not have access to this decision.", 403);
  }

  const analysis = await Analysis.findOne({ decisionId: decision._id });
  res.json({ decision, analysis });
};

export const updateDecision: RequestHandler = async (req: AuthenticatedRequest, res) => {
  let decision = await Decision.findById(req.params.id);
  if (!decision) throw new AppError("Decision not found", 404);

  if (decision.createdBy.toString() !== req.user?.userId && req.user?.role !== "admin") {
    throw new AppError("Forbidden: You do not have access to modify this decision.", 403);
  }

  decision = await Decision.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!decision) throw new AppError("Decision not found after update", 404);

  await AuditLog.create({
    userId: req.user?.userId,
    action: "decision.updated",
    metadata: { decisionId: decision._id }
  });

  res.json({ decision });
};

export const deleteDecision: RequestHandler = async (req: AuthenticatedRequest, res) => {
  const decision = await Decision.findById(req.params.id);
  if (!decision) throw new AppError("Decision not found", 404);

  if (decision.createdBy.toString() !== req.user?.userId && req.user?.role !== "admin") {
    throw new AppError("Forbidden: You do not have access to delete this decision.", 403);
  }

  await Decision.findByIdAndDelete(req.params.id);

  await Analysis.deleteMany({ decisionId: decision._id });
  await AuditLog.create({
    userId: req.user?.userId,
    action: "decision.deleted",
    metadata: { decisionId: decision._id }
  });

  res.status(204).send();
};
