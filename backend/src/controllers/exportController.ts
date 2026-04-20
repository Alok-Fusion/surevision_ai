import type { RequestHandler } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import { Analysis } from "../models/Analysis";
import { Decision } from "../models/Decision";
import { Objection } from "../models/Objection";
import { AppError } from "../middleware/error";
import { createCsvReport, createPdfReport } from "../services/exportService";

async function loadReport(decisionId: string, userId?: string, userRole?: string) {
  const decision = await Decision.findById(decisionId);
  if (!decision) throw new AppError("Decision not found", 404);

  if (userRole !== "admin" && decision.createdBy.toString() !== userId) {
    throw new AppError("Forbidden: You do not have access to export this decision.", 403);
  }

  const analysis = await Analysis.findOne({ decisionId: decision._id });
  if (!analysis) throw new AppError("Analysis not found", 404);

  const objections = await Objection.find({ decisionId: decision._id, status: "active" }).populate("submittedBy", "name").lean();

  return { decision, analysis, objections };
}

export const exportPdf: RequestHandler = async (req: AuthenticatedRequest, res) => {
  const { decision, analysis, objections } = await loadReport(req.body.decisionId, req.user?.userId, req.user?.role);
  const buffer = await createPdfReport(decision, analysis, objections);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="surevision-${decision._id}.pdf"`);
  res.send(buffer);
};

export const exportCsv: RequestHandler = async (req: AuthenticatedRequest, res) => {
  const { decision, analysis } = await loadReport(req.body.decisionId, req.user?.userId, req.user?.role);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="surevision-${decision._id}.csv"`);
  res.send(createCsvReport(decision, analysis));
};

