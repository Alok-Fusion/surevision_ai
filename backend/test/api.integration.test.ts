import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app";
import { Analysis } from "../src/models/Analysis";
import { Alert } from "../src/models/Alert";
import { Decision } from "../src/models/Decision";
import { Upload } from "../src/models/Upload";
import { User } from "../src/models/User";
import * as emailService from "../src/services/emailService";
import { createDeterministicAnalysis } from "../src/utils/analysisFactory";
import { signAccessToken } from "../src/utils/tokens";

describe("backend API integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("registers a user, blocks login until verification, verifies email, and then refreshes tokens", async () => {
    let verificationToken = "";
    vi.spyOn(emailService, "sendVerificationEmail").mockImplementation(async ({ verificationUrl }) => {
      const parsed = new URL(verificationUrl);
      verificationToken = parsed.searchParams.get("token") ?? "";
      return { id: "mock-verification-email" } as never;
    });

    const registerResponse = await request(app).post("/api/auth/register").send({
      name: "Morgan Lee",
      email: "morgan.lee@surevision.ai",
      password: "Password@123"
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.user.email).toBe("morgan.lee@surevision.ai");
    expect(registerResponse.body.verificationRequired).toBe(true);
    expect(registerResponse.body.accessToken).toBeUndefined();
    expect(verificationToken).toBeTruthy();

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "morgan.lee@surevision.ai",
      password: "Password@123"
    });

    expect(loginResponse.status).toBe(403);
    expect(loginResponse.body.message).toContain("verify your email");

    const verifyResponse = await request(app).post("/api/auth/verify-email").send({
      token: verificationToken
    });

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.user.emailVerified).toBe(true);
    expect(verifyResponse.body.accessToken).toBeTruthy();
    expect(verifyResponse.body.refreshToken).toBeTruthy();

    const verifiedLoginResponse = await request(app).post("/api/auth/login").send({
      email: "morgan.lee@surevision.ai",
      password: "Password@123"
    });

    expect(verifiedLoginResponse.status).toBe(200);
    expect(verifiedLoginResponse.body.user.role).toBe("analyst");
    expect(verifiedLoginResponse.body.user.emailVerified).toBe(true);

    const refreshResponse = await request(app).post("/api/auth/refresh").send({
      refreshToken: verifiedLoginResponse.body.refreshToken
    });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.accessToken).toBeTruthy();
  });

  it("rejects unauthenticated dashboard access", async () => {
    const response = await request(app).get("/api/dashboard");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authentication required");
  });

  it("returns dashboard aggregations for an authenticated user", async () => {
    const passwordHash = await bcrypt.hash("Password@123", 10);
    const user = await User.create({
      name: "Avery Stone",
      email: "admin@surevision.ai",
      passwordHash,
      role: "admin",
      emailVerified: true
    });

    const decision = await Decision.create({
      title: "Automate invoice exception routing",
      description: "Reduce AP queue rework.",
      department: "Finance",
      industry: "Banking",
      timeHorizon: 90,
      stakeholdersAffected: "Finance Ops",
      budgetImpact: 450000,
      urgency: "high",
      complianceSensitivity: "medium",
      currentPainPoint: "manual rework",
      createdBy: user._id
    });

    await Analysis.create({
      ...createDeterministicAnalysis(decision, 2),
      decisionId: decision._id
    });

    await Alert.create([
      { type: "compliance", severity: "critical", message: "KYC backlog exceeds tolerance.", resolved: false },
      { type: "vendor", severity: "high", message: "Vendor dependency concentration detected.", resolved: false },
      { type: "cost", severity: "medium", message: "Duplicate fee leakage detected.", resolved: false }
    ]);

    await Upload.create({
      fileName: "exceptions.csv",
      fileType: "text/csv",
      category: "invoice",
      extractedData: { rows: 4 },
      uploadedBy: user._id
    });

    const token = signAccessToken({
      userId: String(user._id),
      role: user.role,
      email: user.email
    });

    const response = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.metrics.totalAnalyses).toBe(1);
    expect(response.body.metrics.complianceAlerts).toBe(1);
    expect(response.body.metrics.vendorRiskCount).toBe(1);
    expect(response.body.metrics.costLeakageOpportunities).toBe(1);
    expect(response.body.recentDecisions).toHaveLength(1);
    expect(response.body.departmentRisk[0].department).toBe("Finance");
  });

  it("returns current user state and persists encrypted Gemini settings", async () => {
    const passwordHash = await bcrypt.hash("Password@123", 10);
    const user = await User.create({
      name: "Lena Brooks",
      email: "lena.brooks@surevision.ai",
      passwordHash,
      role: "analyst",
      emailVerified: true
    });

    const token = signAccessToken({
      userId: String(user._id),
      role: user.role,
      email: user.email
    });

    const meResponse = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(meResponse.status).toBe(200);
    expect(meResponse.body.user.email).toBe(user.email);

    const settingsResponse = await request(app)
      .put("/api/settings/gemini-key")
      .set("Authorization", `Bearer ${token}`)
      .send({ apiKey: "AIzaSyDUMMY-KEY-1234" });

    expect(settingsResponse.status).toBe(200);
    expect(settingsResponse.body.profile.hasPersonalGeminiKey).toBe(true);
    expect(settingsResponse.body.profile.geminiKeyLast4).toBe("1234");

    const storedUser = await User.findById(user._id).select("+geminiApiKeyCiphertext");
    expect(storedUser?.geminiApiKeyCiphertext).toBeTruthy();
    expect(storedUser?.geminiApiKeyCiphertext).not.toContain("AIzaSyDUMMY-KEY-1234");

    const deleteResponse = await request(app).delete("/api/settings/gemini-key").set("Authorization", `Bearer ${token}`);
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.profile.hasPersonalGeminiKey).toBe(false);
  });
});
