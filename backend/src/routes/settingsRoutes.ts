import { Router } from "express";
import { deleteGeminiApiKey, getSettings, saveGeminiApiKey, updateProfile } from "../controllers/settingsController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const settingsRoutes = Router();

settingsRoutes.use(authenticate);
settingsRoutes.get("/", asyncHandler(getSettings));
settingsRoutes.put("/profile", asyncHandler(updateProfile));
settingsRoutes.put("/gemini-key", asyncHandler(saveGeminiApiKey));
settingsRoutes.delete("/gemini-key", asyncHandler(deleteGeminiApiKey));
