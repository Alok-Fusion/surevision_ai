import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/surevision-ai"),
  JWT_SECRET: z.string().min(16).default("dev-access-secret-change-me"),
  JWT_REFRESH_SECRET: z.string().min(16).default("dev-refresh-secret-change-me"),
  SETTINGS_ENCRYPTION_SECRET: z.string().min(16).default("dev-settings-encryption-secret-change-me"),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value === true || value === "true"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().default("SureVision AI <reports@surevision.ai>"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  AI_ENGINE_URL: z.string().url().default("http://localhost:8000"),
  GOOGLE_CLIENT_ID: z.string().optional()
});

export const env = envSchema.parse(process.env);
