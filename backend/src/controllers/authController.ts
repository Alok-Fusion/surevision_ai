import bcrypt from "bcryptjs";
import type { RequestHandler } from "express";
import { env } from "../config/env";
import { AppError } from "../middleware/error";
import type { AuthenticatedRequest } from "../middleware/auth";
import { AuditLog } from "../models/AuditLog";
import { User } from "../models/User";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/emailService";
import { createEmailVerificationToken, hashEmailVerificationToken, createPasswordResetToken } from "../utils/emailVerification";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

function sanitizeUser(user: { _id: unknown; name: string; email: string; role: string; emailVerified?: boolean; createdAt?: Date; companyName?: string | null; googleId?: string | null }) {
  // Profile is complete if they have a companyName, OR if they aren't a Google-only user
  const isGoogleOnly = !!user.googleId;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified ?? false,
    profileCompleted: !!user.companyName || !isGoogleOnly,
    createdAt: user.createdAt
  };
}

export const register: RequestHandler = async (req, res) => {
  const { name, email, password, companyName, phone, socials } = req.body;
  if (!name || !email || !password || !companyName || !phone || !socials) {
    throw new AppError("All fields including company name, phone, and socials are required", 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verification = createEmailVerificationToken();
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash,
    role: "analyst",
    emailVerified: false,
    companyName: companyName || null,
    phone: phone || null,
    socials: socials || null,
    emailVerificationTokenHash: verification.tokenHash,
    emailVerificationExpiresAt: verification.expiresAt
  });

  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${verification.token}`;
  await sendVerificationEmail({
    to: user.email,
    name: user.name,
    verificationUrl
  });

  res.status(201).json({
    user: sanitizeUser(user),
    verificationRequired: true,
    message: "Account created. Please verify your email before signing in."
  });
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.emailVerified) {
    throw new AppError("Please verify your email before signing in", 403);
  }

  const payload = { userId: String(user._id), role: user.role, email: user.email };
  res.json({
    user: sanitizeUser(user),
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  });
};

export const googleLogin: RequestHandler = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    throw new AppError("Google credential is required", 400);
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new AppError("Invalid Google token", 400);
  }

  let user = await User.findOne({ email: payload.email.toLowerCase() });

  if (user) {
    if (!user.googleId) {
      user.googleId = payload.sub;
      user.emailVerified = true;
      await user.save();
    }
  } else {
    // Create new user since Google verified them
    user = await User.create({
      name: payload.name || "Google User",
      email: payload.email.toLowerCase(),
      googleId: payload.sub,
      role: "analyst",
      emailVerified: true
    });
  }

  const jwtPayload = { userId: String(user._id), role: user.role, email: user.email };
  res.json({
    user: sanitizeUser(user),
    accessToken: signAccessToken(jwtPayload),
    refreshToken: signRefreshToken(jwtPayload)
  });
};

export const refresh: RequestHandler = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError("Refresh token is required", 400);
  }

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.userId);
  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  if (!user.emailVerified) {
    throw new AppError("Please verify your email before refreshing session", 403);
  }

  res.json({
    user: sanitizeUser(user),
    accessToken: signAccessToken({ userId: String(user._id), role: user.role, email: user.email }),
    refreshToken: signRefreshToken({ userId: String(user._id), role: user.role, email: user.email })
  });
};

export const completeProfile: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const { companyName, phone, socials } = req.body;
  if (!companyName || !phone || !socials) {
    throw new AppError("All profile fields are required", 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { companyName, phone, socials },
    { new: true }
  );

  if (!user) throw new AppError("User not found", 404);

  res.json({ user: sanitizeUser(user) });
};

export const verifyEmail: RequestHandler = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    throw new AppError("Verification token is required", 400);
  }

  const tokenHash = hashEmailVerificationToken(token);
  const user = await User.findOne({
    emailVerificationTokenHash: tokenHash,
    emailVerificationExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    throw new AppError("Verification link is invalid or has expired", 400);
  }

  user.emailVerified = true;
  user.emailVerificationTokenHash = null;
  user.emailVerificationExpiresAt = null;
  await user.save();

  const payload = { userId: String(user._id), role: user.role, email: user.email };
  res.json({
    user: sanitizeUser(user),
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    message: "Email verified successfully"
  });
};

export const resendVerification: RequestHandler = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.json({ message: "If an account exists for this email, a verification message has been sent." });
    return;
  }

  if (user.emailVerified) {
    res.json({ message: "This email is already verified." });
    return;
  }

  const verification = createEmailVerificationToken();
  user.emailVerificationTokenHash = verification.tokenHash;
  user.emailVerificationExpiresAt = verification.expiresAt;
  await user.save();

  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${verification.token}`;
  await sendVerificationEmail({
    to: user.email,
    name: user.name,
    verificationUrl
  });

  res.json({ message: "Verification email sent. Please check your inbox." });
};

export const me: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    throw new AppError("Authentication required", 401);
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  if (!user.emailVerified) {
    throw new AppError("Please verify your email before accessing SureVision AI", 403);
  }

  res.json({ user: sanitizeUser(user) });
};

export const logout: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (req.user?.userId) {
    await AuditLog.create({
      userId: req.user.userId,
      action: "auth.logout",
      metadata: { source: "frontend" }
    });
  }

  res.status(204).send();
};

export const forgotPassword: RequestHandler = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new AppError("Email is required", 400);
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  
  if (!user) {
    // Return success to prevent email enumeration
    res.json({ message: "If an account exists, a password reset link has been sent." });
    return;
  }

  const resetParams = createPasswordResetToken();
  user.passwordResetTokenHash = resetParams.tokenHash;
  user.passwordResetExpiresAt = resetParams.expiresAt;
  await user.save();

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetParams.token}`;
  await sendPasswordResetEmail({
    to: user.email,
    name: user.name,
    resetUrl
  });

  res.json({ message: "If an account exists, a password reset link has been sent." });
};

export const resetPassword: RequestHandler = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    throw new AppError("Token and new password are required", 400);
  }

  const tokenHash = hashEmailVerificationToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() }
  });

  if (!user) {
    throw new AppError("Reset link is invalid or has expired", 400);
  }

  if (!user.emailVerified) {
    user.emailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpiresAt = null;
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  await user.save();

  res.json({ message: "Password has been successfully reset. You may now log in." });
};
