import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from "express";
import { env } from "../config/env";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function asyncHandler<T extends RequestHandler>(handler: T): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  res.status(statusCode).json({
    message: err.message || "Unexpected server error",
    stack: env.NODE_ENV === "production" ? undefined : err.stack
  });
};

