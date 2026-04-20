import type { RequestHandler } from "express";
import { AppError } from "../middleware/error";
import type { AuthenticatedRequest } from "../middleware/auth";
import { AuditLog } from "../models/AuditLog";
import { User } from "../models/User";
import { getUserSettings, removeUserGeminiApiKey, storeUserGeminiApiKey } from "../services/userSettingsService";

function requireUserId(req: AuthenticatedRequest) {
  if (!req.user?.userId) {
    throw new AppError("Authentication required", 401);
  }

  return req.user.userId;
}

export const getSettings: RequestHandler = async (req: AuthenticatedRequest, res) => {
  res.json(await getUserSettings(requireUserId(req)));
};

export const updateProfile: RequestHandler = async (req: AuthenticatedRequest, res) => {
  const userId = requireUserId(req);
  const { name, notificationsEnabled, companyName, phone, socials } = req.body as {
    name?: string;
    notificationsEnabled?: boolean;
    companyName?: string;
    phone?: string;
    socials?: string;
  };

  if (!name?.trim()) {
    throw new AppError("Display name is required", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.name = name.trim();
  if (typeof notificationsEnabled === "boolean") {
    user.notificationsEnabled = notificationsEnabled;
  }
  if (companyName !== undefined) user.companyName = companyName.trim() || null;
  if (phone !== undefined) user.phone = phone.trim() || null;
  if (socials !== undefined) user.socials = socials.trim() || null;
  await user.save();

  await AuditLog.create({
    userId,
    action: "settings.profile.updated",
    metadata: { notificationsEnabled: user.notificationsEnabled }
  });

  res.json(await getUserSettings(userId));
};

export const saveGeminiApiKey: RequestHandler = async (req: AuthenticatedRequest, res) => {
  const userId = requireUserId(req);
  const apiKey = String(req.body?.apiKey ?? "").trim();

  if (!apiKey) {
    throw new AppError("Gemini API key is required", 400);
  }

  const settings = await storeUserGeminiApiKey(userId, apiKey);
  await AuditLog.create({
    userId,
    action: "settings.gemini_key.updated",
    metadata: { keyLast4: apiKey.slice(-4) }
  });

  res.json({
    ...settings,
    message: "Gemini API key saved securely."
  });
};

export const deleteGeminiApiKey: RequestHandler = async (req: AuthenticatedRequest, res) => {
  const userId = requireUserId(req);
  const settings = await removeUserGeminiApiKey(userId);

  await AuditLog.create({
    userId,
    action: "settings.gemini_key.deleted",
    metadata: {}
  });

  res.json({
    ...settings,
    message: "Gemini API key removed."
  });
};
