import { Router, type RequestHandler } from "express";
import { analyzeDecision } from "../services/aiEngineService";
import { asyncHandler } from "../middleware/error";

export const desktopRoutes = Router();

/**
 * POST /api/desktop/analyze
 * No-auth endpoint for the local desktop copilot.
 * Accepts decision fields extracted from a file and runs AI analysis.
 */
const desktopAnalyze: RequestHandler = async (req, res) => {
  const {
    title,
    description,
    department = "Operations",
    industry = "Enterprise",
    timeHorizon = 90,
    stakeholdersAffected = "Cross-functional teams",
    budgetImpact = 0,
    urgency = "medium",
    complianceSensitivity = "medium",
    currentPainPoint = "",
    fileContent = "",
    fileName = "Untitled"
  } = req.body;

  // Build a decision-like object from the file + user input
  const decision = {
    title: title || fileName,
    description: description || fileContent.slice(0, 3000),
    department,
    industry,
    timeHorizon,
    stakeholdersAffected,
    budgetImpact,
    urgency,
    complianceSensitivity,
    currentPainPoint: currentPainPoint || `Analysis of ${fileName}`
  } as any;

  const analysis = await analyzeDecision(decision, 0);

  res.json({
    decision: {
      title: decision.title,
      description: decision.description,
      department: decision.department,
      industry: decision.industry,
      fileName
    },
    analysis
  });
};

desktopRoutes.post("/analyze", asyncHandler(desktopAnalyze));
