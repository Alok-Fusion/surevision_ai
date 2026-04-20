import { Router } from "express";
import { emailReport } from "../controllers/emailController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const emailRoutes = Router();

emailRoutes.post("/", authenticate, asyncHandler(emailReport));

