import { Router } from "express";
import { exportCsv, exportPdf } from "../controllers/exportController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const exportRoutes = Router();

exportRoutes.post("/pdf", authenticate, asyncHandler(exportPdf));
exportRoutes.post("/csv", authenticate, asyncHandler(exportCsv));

