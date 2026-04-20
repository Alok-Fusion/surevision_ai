import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { JwtUser } from "../utils/tokens";
import { verifyAccessToken } from "../utils/tokens";
import type { UserRole } from "../models/User";

export type AuthenticatedRequest = Request & {
  user?: JwtUser;
};

export const authenticate: RequestHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}

