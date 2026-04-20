import { Router } from "express";
import { forgotPassword, login, logout, me, refresh, register, resendVerification, resetPassword, verifyEmail, googleLogin, completeProfile } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/error";

export const authRoutes = Router();

authRoutes.post("/register", asyncHandler(register));
authRoutes.post("/login", asyncHandler(login));
authRoutes.post("/google", asyncHandler(googleLogin));
authRoutes.post("/refresh", asyncHandler(refresh));
authRoutes.post("/verify-email", asyncHandler(verifyEmail));
authRoutes.post("/resend-verification", asyncHandler(resendVerification));
authRoutes.post("/forgot-password", asyncHandler(forgotPassword));
authRoutes.post("/reset-password", asyncHandler(resetPassword));
authRoutes.get("/me", authenticate, asyncHandler(me));
authRoutes.put("/profile", authenticate, asyncHandler(completeProfile));
authRoutes.post("/logout", authenticate, asyncHandler(logout));

