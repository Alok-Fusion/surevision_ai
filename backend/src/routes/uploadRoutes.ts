import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/uploadController";
import { authenticate, requireRole } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "text/csv",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel"
    ];
    cb(null, allowed.includes(file.mimetype) || /\.(csv|pdf|xlsx)$/i.test(file.originalname));
  }
});

export const uploadRoutes = Router();

uploadRoutes.post("/", authenticate, requireRole("admin", "analyst"), upload.single("file"), asyncHandler(uploadFile));

