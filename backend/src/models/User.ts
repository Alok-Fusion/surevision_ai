import { Schema, model, type Document } from "mongoose";

export type UserRole = "admin" | "analyst" | "viewer";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string | null;
  role: UserRole;
  emailVerified: boolean;
  notificationsEnabled: boolean;
  companyName?: string | null;
  phone?: string | null;
  socials?: string | null;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpiresAt?: Date | null;
  passwordResetTokenHash?: string | null;
  passwordResetExpiresAt?: Date | null;
  geminiApiKeyCiphertext?: string | null;
  geminiApiKeyLast4?: string | null;
  geminiApiKeyUpdatedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ["admin", "analyst", "viewer"], default: "analyst" },
    emailVerified: { type: Boolean, default: false, index: true },
    notificationsEnabled: { type: Boolean, default: true },
    companyName: { type: String, default: null },
    phone: { type: String, default: null },
    socials: { type: String, default: null },
    emailVerificationTokenHash: { type: String, default: null },
    emailVerificationExpiresAt: { type: Date, default: null },
    passwordResetTokenHash: { type: String, default: null },
    passwordResetExpiresAt: { type: Date, default: null },
    geminiApiKeyCiphertext: { type: String, default: null, select: false },
    geminiApiKeyLast4: { type: String, default: null },
    geminiApiKeyUpdatedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
