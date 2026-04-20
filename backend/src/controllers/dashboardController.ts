import type { RequestHandler } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import { getDashboard } from "../services/dashboardService";

export const dashboard: RequestHandler = async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.role === "admin" ? undefined : req.user?.userId;
  res.json(await getDashboard(userId));
};

