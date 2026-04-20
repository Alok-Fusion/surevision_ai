import { Router } from "express";
import multer from "multer";
import {
  uploadEmployeeData,
  listEmployees,
  getEmployee,
  evaluateSingleEmployee,
  evaluateAllEmployees,
  getEvaluations,
  getWorkforceDashboard,
  deleteEmployee,
  syncAllStatuses,
  listAllEvaluations
} from "../controllers/employeeController";
import { authenticate, requireRole } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === "text/csv" || /\.csv$/i.test(file.originalname));
  }
});

export const employeeRoutes = Router();

// Dashboard (must be before /:id to avoid conflicts)
employeeRoutes.get("/dashboard", authenticate, requireRole("admin", "analyst"), asyncHandler(getWorkforceDashboard));

// Filtered evaluations list
employeeRoutes.get("/evaluations", authenticate, asyncHandler(listAllEvaluations));

// Batch evaluate
employeeRoutes.post("/evaluate-all", authenticate, requireRole("admin"), asyncHandler(evaluateAllEmployees));

// Retroactive status sync
employeeRoutes.post("/sync-statuses", authenticate, requireRole("admin"), asyncHandler(syncAllStatuses));

// Upload CSV
employeeRoutes.post("/upload", authenticate, requireRole("admin", "analyst"), upload.single("file"), asyncHandler(uploadEmployeeData));

// List employees
employeeRoutes.get("/", authenticate, asyncHandler(listEmployees));

// Single employee
employeeRoutes.get("/:id", authenticate, asyncHandler(getEmployee));
employeeRoutes.delete("/:id", authenticate, requireRole("admin"), asyncHandler(deleteEmployee));

// Evaluate & history
employeeRoutes.post("/:id/evaluate", authenticate, requireRole("admin", "analyst"), asyncHandler(evaluateSingleEmployee));
employeeRoutes.get("/:id/evaluations", authenticate, asyncHandler(getEvaluations));
