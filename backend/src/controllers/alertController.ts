import type { RequestHandler } from "express";
import { Alert } from "../models/Alert";

export const alerts: RequestHandler = async (_req, res) => {
  const rows = await Alert.find().sort({ resolved: 1, createdAt: -1 }).limit(50);
  res.json(rows);
};

