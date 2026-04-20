import { Router } from "express";
import { dashboard } from "../controllers/dashboardController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const dashboardRoutes = Router();

dashboardRoutes.get("/", authenticate, asyncHandler(dashboard));

