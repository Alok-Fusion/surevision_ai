import { Router } from "express";
import { createDecision, deleteDecision, getDecision, updateDecision } from "../controllers/decisionController";
import { getObjections, submitObjection, resolveObjection, dismissObjection } from "../controllers/dissentController";
import { authenticate, requireRole } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const decisionRoutes = Router();

decisionRoutes.post("/", authenticate, requireRole("admin", "analyst"), asyncHandler(createDecision));
decisionRoutes.get("/:id", authenticate, asyncHandler(getDecision));
decisionRoutes.put("/:id", authenticate, requireRole("admin", "analyst"), asyncHandler(updateDecision));
decisionRoutes.delete("/:id", authenticate, requireRole("admin"), asyncHandler(deleteDecision));

// Stakeholder Dissent Routes
decisionRoutes.get("/:id/dissent", authenticate, asyncHandler(getObjections));
decisionRoutes.post("/:id/dissent", authenticate, asyncHandler(submitObjection));
decisionRoutes.patch("/:id/dissent/:objectionId/resolve", authenticate, requireRole("admin"), asyncHandler(resolveObjection));
decisionRoutes.patch("/:id/dissent/:objectionId/dismiss", authenticate, requireRole("admin"), asyncHandler(dismissObjection));

