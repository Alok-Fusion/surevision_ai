import { Router } from "express";
import { alerts } from "../controllers/alertController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const alertRoutes = Router();

alertRoutes.get("/", authenticate, asyncHandler(alerts));

