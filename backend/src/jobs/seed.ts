import bcrypt from "bcryptjs";
import { connectDb } from "../config/db";
import { Analysis } from "../models/Analysis";
import { Alert } from "../models/Alert";
import { AuditLog } from "../models/AuditLog";
import { Decision } from "../models/Decision";
import { Upload } from "../models/Upload";
import { User, type UserRole } from "../models/User";
import { createDeterministicAnalysis } from "../utils/analysisFactory";

const users = [
  ["Avery Stone", "admin@surevision.ai", "admin"],
  ["Maya Raman", "maya.raman@surevision.ai", "analyst"],
  ["Jordan Lee", "jordan.lee@surevision.ai", "analyst"],
  ["Nora Patel", "nora.patel@surevision.ai", "viewer"],
  ["Elena Cruz", "elena.cruz@surevision.ai", "analyst"],
  ["Marcus Reid", "marcus.reid@surevision.ai", "viewer"],
  ["Priya Shah", "priya.shah@surevision.ai", "admin"],
  ["Tobias Grant", "tobias.grant@surevision.ai", "analyst"],
  ["Lina Okafor", "lina.okafor@surevision.ai", "viewer"],
  ["Samir Mehta", "samir.mehta@surevision.ai", "analyst"]
] as const;

const departments = ["Finance", "Operations", "Compliance", "Procurement", "HR", "Trade Finance", "Claims", "Logistics"];
const industries = ["Banking", "Insurance", "Logistics", "Manufacturing"];
const titles = [
  "Automate invoice exception routing",
  "Replace regional collections vendor",
  "Centralize KYC refresh operations",
  "Launch trade finance anomaly review",
  "Reduce claims manual adjudication",
  "Consolidate procurement approval tiers",
  "Introduce policy renewal risk scoring",
  "Move SLA penalty monitoring to AI workflow",
  "Outsource document QA sampling",
  "Create vendor concentration dashboard",
  "Automate sanctions pre-screening",
  "Pilot predictive cash application",
  "Renegotiate freight audit process",
  "Modernize employee onboarding controls",
  "Deploy compliance evidence vault",
  "Scale contract clause extraction",
  "Introduce branch risk heatmap",
  "Automate dispute triage",
  "Create board-level operations cockpit",
  "Use AI for payment reconciliation",
  "Reduce staff on seasonal review queue",
  "Increase pricing for expedited processing",
  "Replace manual policy binder checks",
  "Consolidate supplier master governance",
  "Launch enterprise exception command center"
];

async function seed() {
  await connectDb();
  await Promise.all([
    User.deleteMany({}),
    Decision.deleteMany({}),
    Analysis.deleteMany({}),
    Upload.deleteMany({}),
    Alert.deleteMany({}),
    AuditLog.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash("Admin@123", 12);
  const createdUsers = await User.insertMany(
    users.map(([name, email, role]) => ({
      name,
      email,
      role: role as UserRole,
      passwordHash,
      emailVerified: true
    }))
  );

  const decisions = await Decision.insertMany(
    titles.map((title, index) => ({
      title,
      description: `Enterprise decision to improve ${departments[index % departments.length].toLowerCase()} controls, throughput, and executive visibility using SureVision AI.`,
      department: departments[index % departments.length],
      industry: industries[index % industries.length],
      timeHorizon: ([30, 90, 365] as const)[index % 3],
      stakeholdersAffected: ["Finance Ops", "Compliance", "Vendor Management", "Customer Operations"][index % 4],
      budgetImpact: 125000 + index * 87500,
      urgency: (["low", "medium", "high", "critical"] as const)[index % 4],
      complianceSensitivity: (["low", "medium", "high"] as const)[index % 3],
      currentPainPoint: ["manual rework", "audit exceptions", "vendor delays", "cost leakage", "SLA misses"][index % 5],
      createdBy: createdUsers[index % createdUsers.length]._id
    }))
  );

  await Analysis.insertMany(
    decisions.map((decision, index) => ({
      ...createDeterministicAnalysis(decision, index % 5),
      decisionId: decision._id
    }))
  );

  await Alert.insertMany([
    { type: "compliance", severity: "critical", message: "KYC refresh backlog exceeds board tolerance threshold.", resolved: false },
    { type: "risk", severity: "high", message: "Trade finance anomaly review has a 17% false negative drift.", resolved: false },
    { type: "cost", severity: "medium", message: "Duplicate vendor exception fees detected across AP queues.", resolved: false },
    { type: "vendor", severity: "high", message: "Two critical workflows depend on a single offshore review partner.", resolved: false },
    { type: "system", severity: "low", message: "Personal Gemini API keys can be managed from Settings for analyst-level runs.", resolved: false }
  ]);

  await Upload.insertMany([
    {
      fileName: "ap-exceptions-q2.csv",
      fileType: "text/csv",
      category: "invoice",
      extractedData: { rows: 1842, columns: ["vendor", "amount", "exception_reason", "age"] },
      uploadedBy: createdUsers[1]._id
    },
    {
      fileName: "vendor-master-risk.xlsx",
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      category: "vendor report",
      extractedData: { rows: 438, riskBuckets: ["low", "medium", "high"] },
      uploadedBy: createdUsers[2]._id
    },
    {
      fileName: "kyc-policy-review.pdf",
      fileType: "application/pdf",
      category: "policy",
      extractedData: { pages: 24, topics: ["refresh cadence", "sanctions", "evidence"] },
      uploadedBy: createdUsers[4]._id
    }
  ]);

  await AuditLog.insertMany([
    { userId: createdUsers[0]._id, action: "seed.completed", metadata: { users: users.length, decisions: decisions.length } },
    { userId: createdUsers[1]._id, action: "decision.reviewed", metadata: { title: decisions[0].title } },
    { userId: createdUsers[2]._id, action: "upload.created", metadata: { fileName: "ap-exceptions-q2.csv" } }
  ]);

  console.log("Seed complete. Default admin: admin@surevision.ai / Admin@123");
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
