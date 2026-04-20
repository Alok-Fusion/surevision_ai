import crypto from "crypto";

export function createEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  return {
    token,
    tokenHash,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24)
  };
}

export function hashEmailVerificationToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  return {
    token,
    tokenHash,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60) // 1 hour
  };
}

