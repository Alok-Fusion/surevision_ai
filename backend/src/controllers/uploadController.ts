import type { RequestHandler } from "express";
import { AppError } from "../middleware/error";
import type { AuthenticatedRequest } from "../middleware/auth";
import { AuditLog } from "../models/AuditLog";
import { Upload } from "../models/Upload";

function extractPreview(file?: Express.Multer.File) {
  if (!file) return {};
  const content = file.buffer.toString("utf8").slice(0, 5000);
  const rows = content
    .split(/\r?\n/)
    .slice(0, 6)
    .map((row) => row.split(",").map((cell) => cell.trim()));

  return {
    size: file.size,
    encoding: file.encoding,
    previewRows: file.mimetype.includes("csv") || file.originalname.endsWith(".csv") ? rows : [],
    previewText: file.mimetype.includes("pdf") ? "PDF metadata stored. Full OCR can be connected through the AI engine." : content.slice(0, 600)
  };
}

export const uploadFile: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  if (!req.file) throw new AppError("File is required", 400);
  if (!req.body.category) throw new AppError("Category is required", 400);

  const upload = await Upload.create({
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    category: req.body.category,
    extractedData: extractPreview(req.file),
    uploadedBy: req.user.userId
  });

  await AuditLog.create({
    userId: req.user.userId,
    action: "upload.created",
    metadata: { uploadId: upload._id, fileName: upload.fileName }
  });

  res.status(201).json({ upload });
};

