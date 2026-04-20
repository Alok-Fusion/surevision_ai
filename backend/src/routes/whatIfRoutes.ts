import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";
import { runWhatIf } from "../services/aiEngineService";
import { getUserGeminiApiKey } from "../services/userSettingsService";

export const whatIfRoutes = Router();

whatIfRoutes.post(
  "/",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const geminiApiKey = req.user?.userId ? await getUserGeminiApiKey(req.user.userId) : undefined;
    res.json(await runWhatIf(req.body, geminiApiKey));
  })
);
