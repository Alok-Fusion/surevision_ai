import { Router } from "express";
import { history } from "../controllers/historyController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const historyRoutes = Router();

historyRoutes.get("/", authenticate, asyncHandler(history));

