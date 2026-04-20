import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { UserRole } from "../models/User";

export type JwtUser = {
  userId: string;
  role: UserRole;
  email: string;
};

export function signAccessToken(payload: JwtUser) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: JwtUser) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtUser;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtUser;
}

