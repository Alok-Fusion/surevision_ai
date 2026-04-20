import type { RequestHandler } from "express";
import mongoose from "mongoose";
import type { AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/error";
import { AuditLog } from "../models/AuditLog";
import { Employee } from "../models/Employee";
import { EmployeeRecord, type IEmployeeRecord } from "../models/EmployeeRecord";
import { EmployeeEvaluation } from "../models/EmployeeEvaluation";
import { computeScores, deterministicRecommendation } from "../services/employeeScoreService";
import { evaluateEmployee } from "../services/employeeAiService";
import { getUserGeminiApiKey } from "../services/userSettingsService";

/* ─── CSV Parsing Helpers ─── */

const REQUIRED_COLUMNS = [
  "employee_id", "name", "email", "department", "designation", "date_of_joining",
  "period", "attendance_days", "total_working_days", "avg_login_time", "avg_logout_time",
  "avg_working_hours", "tasks_assigned", "tasks_completed", "quality_score",
  "peer_rating", "manager_rating", "overtime_hours", "leaves_used", "late_arrivals"
] as const;

function parseCsvRows(buffer: Buffer): Record<string, string>[] {
  const text = buffer.toString("utf8");
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new AppError("CSV must contain a header row and at least one data row", 400);

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

  const missing = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    throw new AppError(`CSV is missing required columns: ${missing.join(", ")}`, 400);
  }

  return lines.slice(1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });
}

/* ─── Upload CSV ─── */

export const uploadEmployeeData: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  if (!req.file) throw new AppError("CSV file is required", 400);

  const rows = parseCsvRows(req.file.buffer);
  const userId = req.user.userId;

  let newEmployees = 0;
  let recordsCreated = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // account for header + 0-index

    try {
      // Upsert employee
      let employee = await Employee.findOne({ employeeId: row.employee_id, organizationId: userId });
      if (!employee) {
        employee = await Employee.create({
          employeeId: row.employee_id,
          name: row.name,
          email: row.email,
          department: row.department,
          designation: row.designation,
          dateOfJoining: new Date(row.date_of_joining),
          status: "active",
          organizationId: userId
        });
        newEmployees++;
      }

      // Upsert record for this period
      await EmployeeRecord.findOneAndUpdate(
        { employeeRef: employee._id, period: row.period },
        {
          employeeRef: employee._id,
          period: row.period,
          attendanceDays: parseFloat(row.attendance_days),
          totalWorkingDays: parseFloat(row.total_working_days),
          avgLoginTime: row.avg_login_time,
          avgLogoutTime: row.avg_logout_time,
          avgWorkingHours: parseFloat(row.avg_working_hours),
          tasksAssigned: parseInt(row.tasks_assigned, 10),
          tasksCompleted: parseInt(row.tasks_completed, 10),
          qualityScore: parseFloat(row.quality_score),
          peerRating: parseFloat(row.peer_rating),
          managerRating: parseFloat(row.manager_rating),
          overtimeHours: parseFloat(row.overtime_hours),
          leavesUsed: parseFloat(row.leaves_used),
          lateArrivals: parseInt(row.late_arrivals, 10),
          uploadedBy: userId
        },
        { upsert: true, new: true }
      );
      recordsCreated++;
    } catch (err) {
      errors.push(`Row ${lineNum}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  await AuditLog.create({
    userId,
    action: "employee.data_uploaded",
    metadata: { totalRows: rows.length, newEmployees, recordsCreated, errorCount: errors.length }
  });

  res.status(201).json({
    message: "Employee data processed",
    summary: { totalRows: rows.length, newEmployees, recordsCreated, errorCount: errors.length },
    errors: errors.slice(0, 20) // limit error output
  });
};

/* ─── List Employees ─── */

export const listEmployees: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const { search, department, status, page = "1", limit = "20" } = req.query;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));

  const filter: Record<string, unknown> = { organizationId: req.user.userId };
  if (department) filter.department = department;
  if (status) filter.status = status;
  if (search) filter.$text = { $search: search as string };

  const [employees, total] = await Promise.all([
    Employee.find(filter).sort({ name: 1 }).skip((pageNum - 1) * limitNum).limit(limitNum).lean(),
    Employee.countDocuments(filter)
  ]);

  // Attach latest overall score for each employee
  const employeeIds = employees.map((e) => e._id);
  const latestEvals = await EmployeeEvaluation.aggregate([
    { $match: { employeeRef: { $in: employeeIds } } },
    { $sort: { evaluationDate: -1 } },
    { $group: { _id: "$employeeRef", overallScore: { $first: "$overallScore" }, recommendation: { $first: "$recommendation" } } }
  ]);
  const evalMap = new Map(latestEvals.map((e) => [String(e._id), { overallScore: e.overallScore, recommendation: e.recommendation }]));

  const enriched = employees.map((emp) => ({
    ...emp,
    latestEval: evalMap.get(String(emp._id)) ?? null
  }));

  res.json({ employees: enriched, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
};

/* ─── Get Single Employee ─── */

export const getEmployee: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const employee = await Employee.findOne({ _id: req.params.id, organizationId: req.user.userId });
  if (!employee) throw new AppError("Employee not found", 404);

  const records = await EmployeeRecord.find({ employeeRef: employee._id }).sort({ period: 1 }).lean();
  const evaluations = await EmployeeEvaluation.find({ employeeRef: employee._id }).sort({ evaluationDate: -1 }).limit(10).lean();

  res.json({ employee, records, evaluations });
};

/* ─── Status Sync Helper ─── */

/**
 * Syncs the Employee.status field based on the AI recommendation.
 * pip       → "pip"
 * demote    → "probation"
 * promote / salary_hike / maintain / role_change → "active"
 */
async function syncEmployeeStatus(employeeId: string, recommendation: string): Promise<void> {
  let newStatus: "active" | "probation" | "pip";
  if (recommendation === "pip") {
    newStatus = "pip";
  } else if (recommendation === "demote") {
    newStatus = "probation";
  } else {
    newStatus = "active";
  }
  await Employee.findByIdAndUpdate(employeeId, { status: newStatus });
}

/* ─── Retroactive Status Sync (Admin) ─── */

export const syncAllStatuses: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const employees = await Employee.find({ organizationId: req.user.userId, status: { $ne: "exited" } }).lean();
  let synced = 0;

  for (const emp of employees) {
    const latestEval = await EmployeeEvaluation.findOne({ employeeRef: emp._id }).sort({ evaluationDate: -1 }).lean();
    if (latestEval) {
      await syncEmployeeStatus(String(emp._id), latestEval.recommendation);
      synced++;
    }
  }

  res.json({ message: `Synced status for ${synced} employees`, synced });
};

/* ─── Evaluate Single Employee ─── */

export const evaluateSingleEmployee: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const employee = await Employee.findOne({ _id: req.params.id, organizationId: req.user.userId });
  if (!employee) throw new AppError("Employee not found", 404);

  const records = await EmployeeRecord.find({ employeeRef: employee._id }).sort({ period: 1 });
  if (records.length === 0) throw new AppError("No performance records found for this employee. Upload data first.", 400);

  const scores = computeScores(records);
  const fallback = deterministicRecommendation(scores);
  const geminiApiKey = await getUserGeminiApiKey(req.user.userId);
  const aiResult = await evaluateEmployee(employee, records, scores, fallback, geminiApiKey);

  const evaluation = await EmployeeEvaluation.create({
    employeeRef: employee._id,
    evaluationDate: new Date(),
    periodsCovered: records.map((r) => r.period),
    attendanceScore: scores.attendanceScore,
    punctualityScore: scores.punctualityScore,
    productivityScore: scores.productivityScore,
    qualityScore: scores.qualityScore,
    collaborationScore: scores.collaborationScore,
    overallScore: scores.overallScore,
    recommendation: aiResult.recommendation,
    confidenceLevel: aiResult.confidenceLevel,
    salaryHikePercent: aiResult.salaryHikePercent,
    strengths: aiResult.strengths,
    weaknesses: aiResult.weaknesses,
    actionItems: aiResult.actionItems,
    trendAnalysis: aiResult.trendAnalysis,
    executiveSummary: aiResult.executiveSummary,
    riskFlags: aiResult.riskFlags,
    generatedBy: req.user.userId
  });

  await AuditLog.create({
    userId: req.user.userId,
    action: "employee.evaluated",
    metadata: { employeeId: employee.employeeId, recommendation: evaluation.recommendation, overallScore: evaluation.overallScore }
  });

  // Sync employee status to reflect latest recommendation
  await syncEmployeeStatus(String(employee._id), evaluation.recommendation);

  res.status(201).json({ evaluation });
};

/* ─── Batch Evaluate All ─── */

export const evaluateAllEmployees: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const employees = await Employee.find({ organizationId: req.user.userId, status: { $ne: "exited" } });
  if (employees.length === 0) throw new AppError("No employees found", 404);

  const geminiApiKey = await getUserGeminiApiKey(req.user.userId);
  const results: { employeeId: string; name: string; recommendation: string; overallScore: number }[] = [];
  const errors: string[] = [];
  let skippedCount = 0;
  let processedCount = 0;

  // Helper: wait N milliseconds between API calls
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Helper: call Gemini with retry on 429 rate limit
  async function evaluateWithRetry(
    employee: (typeof employees)[0],
    records: IEmployeeRecord[],
    scores: ReturnType<typeof computeScores>,
    fallback: ReturnType<typeof deterministicRecommendation>,
    apiKey?: string,
    maxRetries = 2
  ) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await evaluateEmployee(employee, records, scores, fallback, apiKey);
      } catch (err: unknown) {
        const isRateLimit =
          err instanceof Error &&
          (err.message.includes("429") || err.message.toLowerCase().includes("rate"));

        if (isRateLimit && attempt < maxRetries) {
          // Parse retry delay from error message if available (e.g. "retryDelay: '51s'")
          const match = err.message.match(/(\d+)s/);
          const waitMs = match ? parseInt(match[1], 10) * 1000 : 60000;
          console.warn(`Gemini rate limit hit for ${employee.employeeId}. Retrying in ${waitMs / 1000}s...`);
          await sleep(waitMs);
          continue;
        }
        throw err;
      }
    }
    throw new Error("Max retries exceeded");
  }

  for (const employee of employees) {
    try {
      const records = await EmployeeRecord.find({ employeeRef: employee._id }).sort({ period: 1 });
      if (records.length === 0) {
        continue;
      }

      // Check if this latest dataset has already been evaluated
      const latestEvaluation = await EmployeeEvaluation.findOne({ employeeRef: employee._id }).sort({ evaluationDate: -1 });
      const currentPeriods = records.map((r) => r.period).join(",");
      const evaluatedPeriods = latestEvaluation ? latestEvaluation.periodsCovered.join(",") : "";

      if (currentPeriods === evaluatedPeriods) {
        skippedCount++;
        continue;
      }

      const scores = computeScores(records);
      const fallback = deterministicRecommendation(scores);

      // Add a staggered delay between employees to avoid rate limiting
      // First employee: no delay. Subsequent employees: 2s gap
      if (processedCount > 0) await sleep(2000);

      const aiResult = await evaluateWithRetry(employee, records, scores, fallback, geminiApiKey);
      processedCount++;

      await EmployeeEvaluation.create({
        employeeRef: employee._id,
        evaluationDate: new Date(),
        periodsCovered: records.map((r) => r.period),
        attendanceScore: scores.attendanceScore,
        punctualityScore: scores.punctualityScore,
        productivityScore: scores.productivityScore,
        qualityScore: scores.qualityScore,
        collaborationScore: scores.collaborationScore,
        overallScore: scores.overallScore,
        recommendation: aiResult.recommendation,
        confidenceLevel: aiResult.confidenceLevel,
        salaryHikePercent: aiResult.salaryHikePercent,
        strengths: aiResult.strengths,
        weaknesses: aiResult.weaknesses,
        actionItems: aiResult.actionItems,
        trendAnalysis: aiResult.trendAnalysis,
        executiveSummary: aiResult.executiveSummary,
        riskFlags: aiResult.riskFlags,
        generatedBy: req.user.userId
      });

      // Sync employee status based on recommendation
      await syncEmployeeStatus(String(employee._id), aiResult.recommendation);

      results.push({
        employeeId: employee.employeeId,
        name: employee.name,
        recommendation: aiResult.recommendation,
        overallScore: scores.overallScore
      });

    } catch (err) {
      errors.push(`${employee.employeeId}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  await AuditLog.create({
    userId: req.user.userId,
    action: "employee.batch_evaluated",
    metadata: { totalProcessed: results.length, skippedCount, errorCount: errors.length }
  });

  res.status(201).json({ results, skippedCount, errors: errors.slice(0, 20) });
};

/* ─── Evaluation History ─── */

export const getEvaluations: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const employee = await Employee.findOne({ _id: req.params.id, organizationId: req.user.userId });
  if (!employee) throw new AppError("Employee not found", 404);

  const evaluations = await EmployeeEvaluation.find({ employeeRef: employee._id }).sort({ evaluationDate: -1 }).lean();
  res.json({ evaluations });
};

/* ─── List All Evaluations (Filtered) ─── */

export const listAllEvaluations: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const orgId = new mongoose.Types.ObjectId(req.user.userId);

  const { search, department, recommendation, page = "1", limit = "20" } = req.query;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));

  // Build the aggregation pipeline
  const pipeline: mongoose.PipelineStage[] = [
    // Join with employees
    {
      $lookup: {
        from: "employees",
        localField: "employeeRef",
        foreignField: "_id",
        as: "emp"
      }
    },
    { $unwind: "$emp" },
    // Org scoping
    { $match: { "emp.organizationId": orgId } },
  ];

  // Filters
  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { "emp.name": { $regex: search as string, $options: "i" } },
          { "emp.employeeId": { $regex: search as string, $options: "i" } },
          { "emp.email": { $regex: search as string, $options: "i" } }
        ]
      }
    });
  }
  if (department) {
    pipeline.push({ $match: { "emp.department": department as string } });
  }
  if (recommendation) {
    pipeline.push({ $match: { recommendation: recommendation as string } });
  }

  // Get only latest evaluation per employee
  pipeline.push(
    { $sort: { evaluationDate: -1 } },
    { $group: {
      _id: "$employeeRef",
      evalDoc: { $first: "$$ROOT" }
    }},
    { $replaceRoot: { newRoot: "$evalDoc" } }
  );

  // Count total before pagination
  const countPipeline = [...pipeline, { $count: "total" }];
  const countResult = await EmployeeEvaluation.aggregate(countPipeline);
  const total = countResult[0]?.total ?? 0;

  // Add sorting and pagination
  pipeline.push(
    { $sort: { overallScore: 1 } },
    { $skip: (pageNum - 1) * limitNum },
    { $limit: limitNum },
    // Shape the employeeRef field
    {
      $addFields: {
        employeeRef: {
          _id: "$emp._id",
          employeeId: "$emp.employeeId",
          name: "$emp.name",
          department: "$emp.department",
          designation: "$emp.designation"
        }
      }
    },
    { $project: { emp: 0 } }
  );

  const evaluations = await EmployeeEvaluation.aggregate(pipeline);

  res.json({
    evaluations,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum)
  });
};

/* ─── Workforce Dashboard ─── */

export const getWorkforceDashboard: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  const orgIdStr = req.user.userId;
  const orgId = new mongoose.Types.ObjectId(orgIdStr);

  const [
    totalEmployees,
    activeCount,
    pipCount,
    departments,
    performanceDistribution,
    recentEvaluations,
    recommendationBreakdown
  ] = await Promise.all([
    Employee.countDocuments({ organizationId: orgId }),
    Employee.countDocuments({ organizationId: orgId, status: "active" }),
    Employee.countDocuments({ organizationId: orgId, status: "pip" }),
    Employee.distinct("department", { organizationId: orgId }),
    // Score distribution buckets
    EmployeeEvaluation.aggregate([
      {
        $lookup: {
          from: "employees",
          localField: "employeeRef",
          foreignField: "_id",
          as: "emp"
        }
      },
      { $unwind: "$emp" },
      { $match: { "emp.organizationId": orgId } },
      { $sort: { evaluationDate: -1 } },
      {
        $group: {
          _id: "$employeeRef",
          latestScore: { $first: "$overallScore" }
        }
      },
      {
        $bucket: {
          groupBy: "$latestScore",
          boundaries: [0, 30, 50, 60, 75, 85, 101],
          default: "Other",
          output: { count: { $sum: 1 } }
        }
      }
    ]),
    // Recent evaluations (org-scoped via pipeline)
    EmployeeEvaluation.aggregate([
      {
        $lookup: {
          from: "employees",
          localField: "employeeRef",
          foreignField: "_id",
          as: "emp"
        }
      },
      { $unwind: "$emp" },
      { $match: { "emp.organizationId": orgId } },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $addFields: {
          employeeRef: {
            _id: "$emp._id",
            employeeId: "$emp.employeeId",
            name: "$emp.name",
            department: "$emp.department",
            designation: "$emp.designation"
          }
        }
      },
      { $project: { emp: 0 } }
    ]),
    // Recommendation breakdown
    EmployeeEvaluation.aggregate([
      {
        $lookup: {
          from: "employees",
          localField: "employeeRef",
          foreignField: "_id",
          as: "emp"
        }
      },
      { $unwind: "$emp" },
      { $match: { "emp.organizationId": orgId } },
      { $sort: { evaluationDate: -1 } },
      { $group: { _id: "$employeeRef", recommendation: { $first: "$recommendation" } } },
      { $group: { _id: "$recommendation", count: { $sum: 1 } } },
      { $project: { _id: 0, recommendation: "$_id", count: 1 } }
    ])
  ]);

  // Compute avg overall score
  const avgScoreResult = await EmployeeEvaluation.aggregate([
    {
      $lookup: {
        from: "employees",
        localField: "employeeRef",
        foreignField: "_id",
        as: "emp"
      }
    },
    { $unwind: "$emp" },
    { $match: { "emp.organizationId": orgId } },
    { $sort: { evaluationDate: -1 } },
    { $group: { _id: "$employeeRef", score: { $first: "$overallScore" } } },
    { $group: { _id: null, avg: { $avg: "$score" } } }
  ]);

  // Department performance
  const departmentPerformance = await EmployeeEvaluation.aggregate([
    {
      $lookup: {
        from: "employees",
        localField: "employeeRef",
        foreignField: "_id",
        as: "emp"
      }
    },
    { $unwind: "$emp" },
    { $match: { "emp.organizationId": orgId } },
    { $sort: { evaluationDate: -1 } },
    { $group: { _id: { emp: "$employeeRef", dept: "$emp.department" }, score: { $first: "$overallScore" } } },
    { $group: { _id: "$_id.dept", avgScore: { $avg: "$score" }, count: { $sum: 1 } } },
    { $project: { _id: 0, department: "$_id", avgScore: { $round: ["$avgScore", 0] }, count: 1 } },
    { $sort: { avgScore: -1 } }
  ]);

  const bucketLabels: Record<number, string> = { 0: "0-29", 30: "30-49", 50: "50-59", 60: "60-74", 75: "75-84", 85: "85-100" };
  const distribution = performanceDistribution.map((b: { _id: number | string; count: number }) => ({
    range: typeof b._id === "number" ? bucketLabels[b._id] ?? `${b._id}+` : String(b._id),
    count: b.count
  }));

  res.json({
    metrics: {
      totalEmployees,
      activeEmployees: activeCount,
      pipCount,
      departmentCount: departments.length,
      avgPerformanceScore: Math.round(avgScoreResult[0]?.avg ?? 0)
    },
    departments: (departments as string[]).sort(),
    performanceDistribution: distribution,
    departmentPerformance,
    recommendationBreakdown,
    recentEvaluations
  });
};

/* ─── Delete Employee ─── */

export const deleteEmployee: RequestHandler = async (req: AuthenticatedRequest, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const employee = await Employee.findOneAndDelete({ _id: req.params.id, organizationId: req.user.userId });
  if (!employee) throw new AppError("Employee not found", 404);

  await Promise.all([
    EmployeeRecord.deleteMany({ employeeRef: employee._id }),
    EmployeeEvaluation.deleteMany({ employeeRef: employee._id })
  ]);

  await AuditLog.create({
    userId: req.user.userId,
    action: "employee.deleted",
    metadata: { employeeId: employee.employeeId }
  });

  res.status(204).send();
};
