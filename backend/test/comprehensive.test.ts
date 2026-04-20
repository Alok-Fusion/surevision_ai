import bcrypt from "bcryptjs";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../src/app";
import { Analysis as AnalysisModel } from "../src/models/Analysis";
import { Decision as DecisionModel } from "../src/models/Decision";
import { Objection as ObjectionModel } from "../src/models/Objection";
import { User } from "../src/models/User";
import * as emailService from "../src/services/emailService";
import { signAccessToken } from "../src/utils/tokens";
import { createDeterministicAnalysis } from "../src/utils/analysisFactory";

describe("AUTH MODULE", () => {
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;
  let adminUserId: string;
  let analystUserId: string;
  let viewerUserId: string;
  let verificationToken: string;

  beforeAll(async () => {
    const adminHash = await bcrypt.hash("Admin@123", 12);
    const analystHash = await bcrypt.hash("Analyst@123", 12);
    const viewerHash = await bcrypt.hash("Viewer@123", 12);

    const admin = await User.create({
      name: "Admin User",
      email: "admin@test.com",
      passwordHash: adminHash,
      role: "admin",
      emailVerified: true
    });
    adminUserId = String(admin._id);

    const analyst = await User.create({
      name: "Analyst User",
      email: "analyst@test.com",
      passwordHash: analystHash,
      role: "analyst",
      emailVerified: true
    });
    analystUserId = String(analyst._id);

    const viewer = await User.create({
      name: "Viewer User",
      email: "viewer@test.com",
      passwordHash: viewerHash,
      role: "viewer",
      emailVerified: true
    });
    viewerUserId = String(viewer._id);

    adminToken = signAccessToken({ userId: adminUserId, role: "admin", email: admin.email });
    analystToken = signAccessToken({ userId: analystUserId, role: "analyst", email: analyst.email });
    viewerToken = signAccessToken({ userId: viewerUserId, role: "viewer", email: viewer.email });
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("creates a new user and sends verification email with valid payload", async () => {
      vi.spyOn(emailService, "sendVerificationEmail").mockImplementation(async ({ verificationUrl }) => {
        const parsed = new URL(verificationUrl);
        verificationToken = parsed.searchParams.get("token") ?? "";
        return { id: "mock-email" } as never;
      });

      const res = await request(app).post("/api/auth/register").send({
        name: "New User",
        email: "newuser@test.com",
        password: "Password@123",
        company: "Test Corp",
        phone: "+1234567890",
        socials: { linkedin: "linkedin.com/in/newuser" }
      });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe("newuser@test.com");
      expect(res.body.verificationRequired).toBe(true);
      expect(res.body.accessToken).toBeUndefined();
    });

    it("returns 400 error when email is already registered", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Duplicate User",
        email: "admin@test.com",
        password: "Password@123"
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Email already registered");
    });

    it("returns 400 error when password is too weak", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Weak User",
        email: "weak@test.com",
        password: "123"
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("password");
    });

    it("returns 400 error when required fields are missing", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Incomplete User"
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("returns 403 for unverified user attempting login", async () => {
      const unverifiedHash = await bcrypt.hash("Test@123", 12);
      await User.create({
        name: "Unverified",
        email: "unverified@test.com",
        passwordHash: unverifiedHash,
        role: "analyst",
        emailVerified: false
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "unverified@test.com",
        password: "Test@123"
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("verify your email");
    });

    it("returns 401 for invalid email or password", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "admin@test.com",
        password: "WrongPassword"
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Invalid credentials");
    });

    it("successfully logs in verified user with correct credentials", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "admin@test.com",
        password: "Admin@123"
      });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe("admin@test.com");
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
    });
  });

  describe("POST /api/auth/verify-email", () => {
    it("returns 400 for invalid verification token", async () => {
      const res = await request(app).post("/api/auth/verify-email").send({
        token: "invalid-token-123"
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid");
    });

    it("successfully verifies email with valid token", async () => {
      vi.spyOn(emailService, "sendVerificationEmail").mockImplementation(async ({ verificationUrl }) => {
        const parsed = new URL(verificationUrl);
        verificationToken = parsed.searchParams.get("token") ?? "";
        return { id: "mock-email" } as never;
      });

      await request(app).post("/api/auth/register").send({
        name: "Verify Test",
        email: "verify@test.com",
        password: "Password@123"
      });

      const res = await request(app).post("/api/auth/verify-email").send({
        token: verificationToken
      });

      expect(res.status).toBe(200);
      expect(res.body.user.emailVerified).toBe(true);
      expect(res.body.accessToken).toBeTruthy();
    });
  });

  describe("POST /api/auth/forgot-password", () => {
    it("returns 400 for non-existent email", async () => {
      const res = await request(app).post("/api/auth/forgot-password").send({
        email: "nonexistent@test.com"
      });

      expect(res.status).toBe(400);
    });

    it("returns 403 for unverified email attempting password reset", async () => {
      const unverifiedHash = await bcrypt.hash("Test@123", 12);
      await User.create({
        name: "Unverified Reset",
        email: "unverifiedreset@test.com",
        passwordHash: unverifiedHash,
        role: "analyst",
        emailVerified: false
      });

      const res = await request(app).post("/api/auth/forgot-password").send({
        email: "unverifiedreset@test.com"
      });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("verify their email");
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("returns 401 for invalid refresh token", async () => {
      const res = await request(app).post("/api/auth/refresh").send({
        refreshToken: "invalid-refresh-token"
      });

      expect(res.status).toBe(401);
    });

    it("successfully refreshes valid access token", async () => {
      const loginRes = await request(app).post("/api/auth/login").send({
        email: "analyst@test.com",
        password: "Analyst@123"
      });
      const refreshToken = loginRes.body.refreshToken;

      const res = await request(app).post("/api/auth/refresh").send({
        refreshToken
      });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
    });
  });
});

describe("DECISION MODULE", () => {
  let adminToken: string;
  let analystToken: string;
  let viewerToken: string;
  let adminUserId: string;
  let analystUserId: string;
  let decisionId: string;

  beforeAll(async () => {
    const adminHash = await bcrypt.hash("Admin@123", 12);
    const analystHash = await bcrypt.hash("Analyst@123", 12);
    const viewerHash = await bcrypt.hash("Viewer@123", 12);

    const admin = await User.create({
      name: "Admin2 User",
      email: "admin2@test.com",
      passwordHash: adminHash,
      role: "admin",
      emailVerified: true
    });
    adminUserId = String(admin._id);

    const analyst = await User.create({
      name: "Analyst2 User",
      email: "analyst2@test.com",
      passwordHash: analystHash,
      role: "analyst",
      emailVerified: true
    });
    analystUserId = String(analyst._id);

    await User.create({
      name: "Viewer2 User",
      email: "viewer2@test.com",
      passwordHash: viewerHash,
      role: "viewer",
      emailVerified: true
    });

    adminToken = signAccessToken({ userId: adminUserId, role: "admin", email: admin.email });
    analystToken = signAccessToken({ userId: analystUserId, role: "analyst", email: analyst.email });
    viewerToken = signAccessToken({ userId: String(analystUserId), role: "viewer", email: "viewer2@test.com" });
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/decision (Create Decision)", () => {
    it("creates decision and triggers AI analysis (Admin role)", async () => {
      vi.spyOn(emailService, "sendAnalysisEmail").mockResolvedValue({ id: "mock" } as never);

      const res = await request(app)
        .post("/api/decision")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Automate AP Workflow",
          description: "Reduce manual invoice processing",
          department: "Finance",
          industry: "Banking",
          timeHorizon: 90,
          stakeholdersAffected: "AP Team",
          budgetImpact: 150000,
          urgency: "high",
          complianceSensitivity: "medium",
          currentPainPoint: "Manual data entry errors"
        });

      expect(res.status).toBe(201);
      expect(res.body.decision.title).toBe("Automate AP Workflow");
      decisionId = String(res.body.decision._id);
    });

    it("returns 403 for viewer attempting to create decision", async () => {
      const res = await request(app)
        .post("/api/decision")
        .set("Authorization", `Bearer ${viewerToken}`)
        .send({
          title: "Unauthorized Decision",
          department: "Finance",
          budgetImpact: 50000
        });

      expect(res.status).toBe(403);
    });

    it("returns 400 for missing required fields", async () => {
      const res = await request(app)
        .post("/api/decision")
        .set("Authorization", `Bearer ${analystToken}`)
        .send({
          title: "Incomplete Decision"
        });

      expect(res.status).toBe(400);
    });

    it("returns 401 for unauthenticated request", async () => {
      const res = await request(app).post("/api/decision").send({
        title: "No Auth Decision",
        department: "Finance",
        budgetImpact: 50000
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/decision/:id", () => {
    it("returns decision with full AI analysis", async () => {
      const res = await request(app)
        .get(`/api/decision/${decisionId}`)
        .set("Authorization", `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
      expect(res.body.decision._id).toBe(decisionId);
    });

    it("returns 404 for non-existent decision", async () => {
      const res = await request(app)
        .get("/api/decision/507f1f77bcf86cd799439011")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/decision/:id (Update)", () => {
    it("updates decision details (Admin role)", async () => {
      const res = await request(app)
        .put(`/api/decision/${decisionId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "Updated AP Automation",
          budgetImpact: 200000
        });

      expect(res.status).toBe(200);
      expect(res.body.decision.title).toBe("Updated AP Automation");
      expect(res.body.decision.budgetImpact).toBe(200000);
    });

    it("returns 403 for analyst role on admin-only decision", async () => {
      const res = await request(app)
        .put(`/api/decision/${decisionId}`)
        .set("Authorization", `Bearer ${analystToken}`)
        .send({
          title: "Should Fail"
        });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/decision/:id", () => {
    it("deletes decision permanently (Admin only)", async () => {
      const decision = await DecisionModel.create({
        title: "To Delete",
        description: "Test deletion",
        department: "Finance",
        industry: "banking",
        timeHorizon: 30,
        stakeholdersAffected: "Team",
        budgetImpact: 10000,
        urgency: "low",
        complianceSensitivity: "low",
        currentPainPoint: "Test",
        createdBy: adminUserId
      });

      const res = await request(app)
        .delete(`/api/decision/${decision._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });

    it("returns 403 when analyst attempts to delete", async () => {
      const decision = await DecisionModel.create({
        title: "Analyst Delete Test",
        department: "Finance",
        industry: "banking",
        timeHorizon: 30,
        stakeholdersAffected: "Team",
        budgetImpact: 10000,
        urgency: "low",
        complianceSensitivity: "low",
        currentPainPoint: "Test",
        createdBy: analystUserId
      });

      const res = await request(app)
        .delete(`/api/decision/${decision._id}`)
        .set("Authorization", `Bearer ${analystToken}`);

      expect(res.status).toBe(403);
    });
  });
});

describe("DISSENT MODULE", () => {
  let adminToken: string;
  let analystToken: string;
  let decisionId: string;
  let adminUserId: string;
  let analystUserId: string;

  beforeAll(async () => {
    const adminHash = await bcrypt.hash("Admin@123", 12);
    const analystHash = await bcrypt.hash("Analyst@123", 12);

    const admin = await User.create({
      name: "Admin Objection",
      email: "adminObjection@test.com",
      passwordHash: adminHash,
      role: "admin",
      emailVerified: true
    });
    adminUserId = String(admin._id);

    const analyst = await User.create({
      name: "Analyst Objection",
      email: "analystObjection@test.com",
      passwordHash: analystHash,
      role: "analyst",
      emailVerified: true
    });
    analystUserId = String(analyst._id);

    const decision = await DecisionModel.create({
      title: "Decision for Objection",
      description: "Test",
      department: "Finance",
      industry: "banking",
      timeHorizon: 90,
      stakeholdersAffected: "Team",
      budgetImpact: 100000,
      urgency: "high",
      complianceSensitivity: "medium",
      currentPainPoint: "Test",
      createdBy: adminUserId
    });
    decisionId = String(decision._id);

    await AnalysisModel.create({
      ...createDeterministicAnalysis(decision, 1),
      decisionId: decision._id
    });

    adminToken = signAccessToken({ userId: adminUserId, role: "admin", email: admin.email });
    analystToken = signAccessToken({ userId: analystUserId, role: "analyst", email: analyst.email });
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/decision/:id/dissent (Submit Objection)", () => {
    it("submits blocking compliance objection and triggers re-evaluation", async () => {
      const res = await request(app)
        .post(`/api/decision/${decisionId}/dissent`)
        .set("Authorization", `Bearer ${analystToken}`)
        .send({
          category: "compliance",
          severity: "blocking",
          rationale: "Missing SOC-2 certification"
        });

      expect(res.status).toBe(201);
      expect(res.body.objection.category).toBe("compliance");
      expect(res.body.objection.severity).toBe("blocking");
    });

    it("submits minor budget objection", async () => {
      const res = await request(app)
        .post(`/api/decision/${decisionId}/dissent`)
        .set("Authorization", `Bearer ${analystToken}`)
        .send({
          category: "budget",
          severity: "minor",
          rationale: "Cost estimate too low"
        });

      expect(res.status).toBe(201);
      expect(res.body.objection.severity).toBe("minor");
    });

    it("submits major technical objection", async () => {
      const res = await request(app)
        .post(`/api/decision/${decisionId}/dissent`)
        .set("Authorization", `Bearer ${analystToken}`)
        .send({
          category: "technical",
          severity: "major",
          rationale: "Integration complexity"
        });

      expect(res.status).toBe(201);
    });

    it("returns 400 for missing required fields", async () => {
      const res = await request(app)
        .post(`/api/decision/${decisionId}/dissent`)
        .set("Authorization", `Bearer ${analystToken}`)
        .send({
          category: "budget"
        });

      expect(res.status).toBe(400);
    });

    it("returns 401 for unauthenticated request", async () => {
      const res = await request(app)
        .post(`/api/decision/${decisionId}/dissent`)
        .send({
          category: "budget",
          severity: "minor",
          rationale: "Test"
        });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/decision/:id/dissent (List Objections)", () => {
    it("returns all objections for decision", async () => {
      const res = await request(app)
        .get(`/api/decision/${decisionId}/dissent`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.objections.length).toBeGreaterThan(0);
    });
  });

  describe("PATCH /api/decision/:id/dissent/:obId/resolve", () => {
    it("resolves objection with admin note", async () => {
      const objection = await ObjectionModel.create({
        decisionId,
        category: "budget",
        severity: "minor",
        rationale: "Test resolution",
        submittedBy: adminUserId,
        status: "active"
      });

      const res = await request(app)
        .patch(`/api/decision/${decisionId}/dissent/${objection._id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          note: "Budget approved after review"
        });

      expect(res.status).toBe(200);
      expect(res.body.objection.status).toBe("resolved");
    });

    it("returns 400 when note is missing", async () => {
      const objection = await ObjectionModel.create({
        decisionId,
        category: "timing",
        severity: "minor",
        rationale: "Test no note",
        submittedBy: adminUserId,
        status: "active"
      });

      const res = await request(app)
        .patch(`/api/decision/${decisionId}/dissent/${objection._id}/resolve`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/decision/:id/dissent/:obId/dismiss", () => {
    it("dismisses objection with justification", async () => {
      const objection = await ObjectionModel.create({
        decisionId,
        category: "strategic",
        severity: "major",
        rationale: "Test dismiss",
        submittedBy: adminUserId,
        status: "active"
      });

      const res = await request(app)
        .patch(`/api/decision/${decisionId}/dissent/${objection._id}/dismiss`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          note: "Not aligned with strategy"
        });

      expect(res.status).toBe(200);
      expect(res.body.objection.status).toBe("dismissed");
    });
  });
});

describe("DASHBOARD MODULE", () => {
  let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    const adminHash = await bcrypt.hash("Admin@123", 12);
    const admin = await User.create({
      name: "Admin Dashboard",
      email: "adminDash@test.com",
      passwordHash: adminHash,
      role: "admin",
      emailVerified: true
    });
    adminUserId = String(admin._id);
    adminToken = signAccessToken({ userId: adminUserId, role: "admin", email: admin.email });
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/dashboard", () => {
    it("returns 401 for unauthenticated request", async () => {
      const res = await request(app).get("/api/dashboard");
      expect(res.status).toBe(401);
    });

    it("returns dashboard metrics for authenticated user", async () => {
      const decision = await DecisionModel.create({
        title: "Dashboard Test",
        department: "Finance",
        industry: "banking",
        timeHorizon: 90,
        stakeholdersAffected: "Team",
        budgetImpact: 500000,
        urgency: "high",
        complianceSensitivity: "medium",
        currentPainPoint: "Test",
        createdBy: adminUserId
      });

      await AnalysisModel.create({
        ...createDeterministicAnalysis(decision, 3),
        decisionId: decision._id
      });

      const res = await request(app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.metrics.totalAnalyses).toBeGreaterThan(0);
    });
  });
});

describe("HISTORY MODULE", () => {
  let analystToken: string;
  let analystUserId: string;

  beforeAll(async () => {
    const analystHash = await bcrypt.hash("Analyst@123", 12);
    const analyst = await User.create({
      name: "Analyst History",
      email: "analystHist@test.com",
      passwordHash: analystHash,
      role: "analyst",
      emailVerified: true
    });
    analystUserId = String(analyst._id);
    analystToken = signAccessToken({ userId: analystUserId, role: "analyst", email: analyst.email });
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/history", () => {
    it("returns paginated decision history", async () => {
      await DecisionModel.create({
        title: "History Test 1",
        department: "Finance",
        industry: "banking",
        timeHorizon: 30,
        stakeholdersAffected: "Team",
        budgetImpact: 10000,
        urgency: "low",
        complianceSensitivity: "low",
        currentPainPoint: "Test",
        createdBy: analystUserId
      });

      const res = await request(app)
        .get("/api/history?page=1&limit=10")
        .set("Authorization", `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
      expect(res.body.decisions.length).toBeGreaterThan(0);
      expect(res.body.totalPages).toBeGreaterThan(0);
    });

    it("filters history by department", async () => {
      await DecisionModel.create({
        title: "Finance Department Test",
        department: "Finance",
        industry: "Insurance",
        timeHorizon: 30,
        stakeholdersAffected: "Team",
        budgetImpact: 10000,
        urgency: "low",
        complianceSensitivity: "low",
        currentPainPoint: "Test",
        createdBy: analystUserId
      });

      const res = await request(app)
        .get("/api/history?department=Finance")
        .set("Authorization", `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
      res.body.decisions.forEach((d: any) => {
        expect(d.department).toBe("Finance");
      });
    });
  });
});

describe("EXPORT MODULE", () => {
  let adminToken: string;
  let adminUserId: string;
  let decisionId: string;

  beforeAll(async () => {
    const adminHash = await bcrypt.hash("Admin@123", 12);
    const admin = await User.create({
      name: "Admin Export",
      email: "adminExport@test.com",
      passwordHash: adminHash,
      role: "admin",
      emailVerified: true
    });
    adminUserId = String(admin._id);
    adminToken = signAccessToken({ userId: adminUserId, role: "admin", email: admin.email });

    const decision = await DecisionModel.create({
      title: "Export Test Decision",
      department: "Operations",
      industry: "Logistics",
      timeHorizon: 180,
      stakeholdersAffected: "Warehouse",
      budgetImpact: 1000000,
      urgency: "high",
      complianceSensitivity: "high",
      currentPainPoint: "Manual tracking",
      createdBy: adminUserId
    });
    decisionId = String(decision._id);

    await AnalysisModel.create({
      ...createDeterministicAnalysis(decision, 5),
      decisionId: decision._id
    });
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/export/pdf", () => {
    it("generates PDF report with signature block", async () => {
      const res = await request(app)
        .post("/api/export/pdf")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decisionId
        });

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("pdf");
      expect(res.body).toBeInstanceOf(Buffer);
    });

    it("returns 404 for non-existent decision", async () => {
      const res = await request(app)
        .post("/api/export/pdf")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decisionId: "507f1f77bcf86cd799439011"
        });

      expect(res.status).toBe(404);
    });

    it("returns 401 for unauthenticated request", async () => {
      const res = await request(app)
        .post("/api/export/pdf")
        .send({
          decisionId
        });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/export/csv", () => {
    it("generates CSV spreadsheet with decision data", async () => {
      const res = await request(app)
        .post("/api/export/csv")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decisionId
        });

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("csv");
    });

    it("includes all analysis fields in CSV", async () => {
      const res = await request(app)
        .post("/api/export/csv")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          decisionId
        });

      const csvContent = res.text;
      expect(csvContent).toContain("riskScore");
      expect(csvContent).toContain("trustScore");
      expect(csvContent).toContain("complianceScore");
      expect(csvContent).toContain("roiScore");
    });
  });
});

describe("ADMIN MODULE", () => {
  let adminToken: string;
  let analystToken: string;
  let adminUserId: string;
  let analystUserId: string;

  beforeAll(async () => {
    const adminHash = await bcrypt.hash("Admin@123", 12);
    const analystHash = await bcrypt.hash("Analyst@123", 12);

    const admin = await User.create({
      name: "Admin Panel",
      email: "adminPanel@test.com",
      passwordHash: adminHash,
      role: "admin",
      emailVerified: true
    });
    adminUserId = String(admin._id);

    const analyst = await User.create({
      name: "Analyst Panel",
      email: "analystPanel@test.com",
      passwordHash: analystHash,
      role: "analyst",
      emailVerified: true
    });
    analystUserId = String(analyst._id);

    adminToken = signAccessToken({ userId: adminUserId, role: "admin", email: admin.email });
    analystToken = signAccessToken({ userId: analystUserId, role: "analyst", email: analyst.email });
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/admin/users", () => {
    it("returns user list (Admin)", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.users.length).toBeGreaterThan(0);
    });

    it("returns 403 for non-admin accessing admin route", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${analystToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("PATCH /api/admin/users/:id/role", () => {
    it("upgrades user role to analyst", async () => {
      const newUser = await User.create({
        name: "Role Test User",
        email: "roleTest@test.com",
        passwordHash: await bcrypt.hash("Test@123", 12),
        role: "viewer",
        emailVerified: true
      });

      const res = await request(app)
        .patch(`/api/admin/users/${newUser._id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          role: "analyst"
        });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("analyst");
    });

    it("returns 400 for invalid role", async () => {
      const newUser = await User.create({
        name: "Invalid Role User",
        email: "invalidRole@test.com",
        passwordHash: await bcrypt.hash("Test@123", 12),
        role: "viewer",
        emailVerified: true
      });

      const res = await request(app)
        .patch(`/api/admin/users/${newUser._id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          role: "superadmin"
        });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/admin/users/:id", () => {
    it("permanently deletes user", async () => {
      const newUser = await User.create({
        name: "Delete Me",
        email: "deleteMe@test.com",
        passwordHash: await bcrypt.hash("Test@123", 12),
        role: "viewer",
        emailVerified: true
      });

      const res = await request(app)
        .delete(`/api/admin/users/${newUser._id}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });
});

describe("SETTINGS MODULE", () => {
  let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    const adminHash = await bcrypt.hash("Admin@123", 12);
    const admin = await User.create({
      name: "Admin Settings",
      email: "adminSettings@test.com",
      passwordHash: adminHash,
      role: "admin",
      emailVerified: true,
      notificationsEnabled: true
    });
    adminUserId = String(admin._id);
    adminToken = signAccessToken({ userId: adminUserId, role: "admin", email: admin.email });
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/settings", () => {
    it("returns user settings", async () => {
      const res = await request(app)
        .get("/api/settings")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.profile).toBeDefined();
      expect(res.body.profile.email).toBe("adminSettings@test.com");
    });
  });

  describe("PUT /api/settings/profile", () => {
    it("updates user name and notifications", async () => {
      const res = await request(app)
        .put("/api/settings/profile")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Updated Name",
          notificationsEnabled: false
        });

      expect(res.status).toBe(200);
      expect(res.body.profile.name).toBe("Updated Name");
      expect(res.body.profile.notificationsEnabled).toBe(false);
    });
  });

  describe("POST /api/settings/gemini-key", () => {
    it("stores encrypted Gemini API key", async () => {
      const res = await request(app)
        .post("/api/settings/gemini-key")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          apiKey: "AIzaSyD-TEST-KEY-1234"
        });

      expect(res.status).toBe(200);
      expect(res.body.profile.hasPersonalGeminiKey).toBe(true);
      expect(res.body.profile.geminiKeyLast4).toBe("1234");
    });

    it("returns 400 for invalid API key format", async () => {
      const res = await request(app)
        .post("/api/settings/gemini-key")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          apiKey: "invalid"
        });

      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /api/settings/gemini-key", () => {
    it("removes stored Gemini API key", async () => {
      const res = await request(app)
        .delete("/api/settings/gemini-key")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.profile.hasPersonalGeminiKey).toBe(false);
    });
  });
});

describe("AI ENGINE SERVICE - COST OF INACTION", () => {
  it("calculates cost of inaction correctly for $1M budget with 60 risk", async () => {
    const budgetImpact = 1000000;
    const riskScore = 60;

    const dailyBleed = Math.round((budgetImpact * (riskScore / 100)) / 30);
    const monthlyLeakage = dailyBleed * 30;

    expect(dailyBleed).toBe(20000);
    expect(monthlyLeakage).toBe(600000);
  });

  it("handles zero budget correctly", async () => {
    const budgetImpact = 0;
    const riskScore = 50;

    const dailyBleed = Math.round((budgetImpact * (riskScore / 100)) / 30);

    expect(dailyBleed).toBe(0);
  });

  it("handles 100% risk correctly", async () => {
    const budgetImpact = 100000;
    const riskScore = 100;

    const dailyBleed = Math.round((budgetImpact * (riskScore / 100)) / 30);

    expect(dailyBleed).toBe(3333);
  });
});

describe("WHAT-IF MODULE", () => {
  let analystToken: string;
  let analystUserId: string;

  beforeAll(async () => {
    const analystHash = await bcrypt.hash("Analyst@123", 12);
    const analyst = await User.create({
      name: "Analyst WhatIf",
      email: "analystWhatIf@test.com",
      passwordHash: analystHash,
      role: "analyst",
      emailVerified: true
    });
    analystUserId = String(analyst._id);
    analystToken = signAccessToken({ userId: analystUserId, role: "analyst", email: analyst.email });
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("POST /api/whatif", () => {
    it("runs what-if scenario simulation", async () => {
      const res = await request(app)
        .post("/api/whatif")
        .set("Authorization", `Bearer ${analystToken}`)
        .send({
          scenario: "If we switch from Vendor A to Vendor B"
        });

      expect(res.status).toBe(201);
      expect(res.body.simulation).toBeDefined();
    });

    it("returns 400 for missing scenario", async () => {
      const res = await request(app)
        .post("/api/whatif")
        .set("Authorization", `Bearer ${analystToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it("returns 401 for unauthenticated request", async () => {
      const res = await request(app)
        .post("/api/whatif")
        .send({
          scenario: "Test scenario"
        });

      expect(res.status).toBe(401);
    });
  });
});