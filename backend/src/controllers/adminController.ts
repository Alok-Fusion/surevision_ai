import type { RequestHandler } from "express";
import axios from "axios";
import mongoose from "mongoose";
import { env } from "../config/env";
import { Alert } from "../models/Alert";
import { AuditLog } from "../models/AuditLog";
import { User } from "../models/User";

/** Runtime feature flags driven by environment variables with safe defaults. */
const FEATURE_FLAGS = [
  {
    key: "gemini_whatif_enabled",
    label: "Gemini What-If Simulation",
    description: "Enable AI-backed what-if scenario forecasting for analysts.",
    owner: "AI Platform",
    enabled: true
  },
  {
    key: "csv_export_enabled",
    label: "CSV Export",
    description: "Allow decision reports to be exported as CSV spreadsheets.",
    owner: "Data Operations",
    enabled: true
  },
  {
    key: "pdf_export_enabled",
    label: "PDF Export",
    description: "Generate board-ready PDF reports for completed decision analyses.",
    owner: "Executive Reporting",
    enabled: true
  },
  {
    key: "email_reporting_enabled",
    label: "Email Report Delivery",
    description: "Queue and deliver decision reports to stakeholders via SMTP.",
    owner: "Compliance",
    // Enabled only when SMTP is configured
    enabled: Boolean(
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    )
  },
  {
    key: "personal_gemini_key_enabled",
    label: "Personal Gemini API Keys",
    description: "Allow users to store personal Gemini API Studio keys for analyst-level runs.",
    owner: "Security",
    enabled: true
  },
  {
    key: "document_friction_insights",
    label: "Document Friction Insights",
    description: "Run AI pandas-based friction and silent pattern detection on uploaded files.",
    owner: "AI Platform",
    enabled: true
  }
] as const;

export const users: RequestHandler = async (_req, res) => {
  res.json(await User.find().select("-passwordHash").sort({ createdAt: -1 }));
};

export const updateUserRole: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!["admin", "analyst", "viewer"].includes(role)) {
    res.status(400).json({ message: "Invalid role specified" });
    return;
  }
  
  const user = await User.findById(id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  
  user.role = role;
  await user.save();
  // Don't leak too much
  res.json({ message: `Role updated to ${role}`, user: { id: user._id, role: user.role } });
};

export const deleteUser: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json({ message: "User deleted successfully" });
};

export const auditLogs: RequestHandler = async (_req, res) => {
  res.json(
    await AuditLog.find()
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .limit(100)
  );
};

export const featureFlags: RequestHandler = (_req, res) => {
  res.json(FEATURE_FLAGS);
};

export const systemHealth: RequestHandler = async (_req, res) => {
  let aiEngine = "degraded";
  let defaultGeminiKeyConfigured = false;

  try {
    const health = await axios.get<{ defaultGeminiKeyConfigured?: boolean }>(
      `${env.AI_ENGINE_URL}/health`,
      { timeout: 3000 }
    );
    aiEngine = health.status === 200 ? "operational" : "degraded";
    defaultGeminiKeyConfigured = Boolean(health.data.defaultGeminiKeyConfigured);
  } catch {
    aiEngine = "degraded";
  }

  res.json({
    api: "operational",
    database: mongoose.connection.readyState === 1 ? "connected" : "degraded",
    aiEngine,
    email:
      env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
        ? "configured"
        : "not_configured",
    defaultGeminiKeyConfigured,
    openAlerts: await Alert.countDocuments({ resolved: false }),
    checkedAt: new Date().toISOString()
  });
};
