import { Router } from "express";
import { auditLogs, deleteUser, featureFlags, systemHealth, updateUserRole, users } from "../controllers/adminController";
import { authenticate, requireRole } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const adminRoutes = Router();

adminRoutes.use(authenticate, requireRole("admin"));
adminRoutes.get("/users", asyncHandler(users));
adminRoutes.patch("/users/:id/role", asyncHandler(updateUserRole));
adminRoutes.delete("/users/:id", asyncHandler(deleteUser));
adminRoutes.get("/audit-logs", asyncHandler(auditLogs));
adminRoutes.get("/feature-flags", asyncHandler(featureFlags));
adminRoutes.get("/system-health", asyncHandler(systemHealth));
