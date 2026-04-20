import type { RequestHandler } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import { Analysis } from "../models/Analysis";
import { Decision } from "../models/Decision";

export const history: RequestHandler = async (req: AuthenticatedRequest, res) => {
  const search = String(req.query.search ?? "");
  const department = String(req.query.department ?? "");
  const sort = String(req.query.sort ?? "date");
  const filter: Record<string, unknown> = {};

  if (search) filter.$text = { $search: search };
  if (department) filter.department = department;

  if (req.user?.role !== "admin") {
    filter.createdBy = req.user?.userId;
  }

  // When sorting by risk we skip DB-level sort and do it post-join
  // (riskScore lives on the Analysis collection, not Decision).
  const decisions = await Decision.find(filter)
    .sort(sort === "risk" ? null : { createdAt: -1 })
    .limit(200)
    .lean();

  const analyses = await Analysis.find({
    decisionId: { $in: decisions.map((d) => d._id) }
  }).lean();

  const byDecisionId = new Map(
    analyses.map((a) => [String(a.decisionId), a])
  );

  const rows = decisions
    .map((decision) => ({
      ...decision,
      analysis: byDecisionId.get(String(decision._id))
    }))
    .sort((a, b) =>
      sort === "risk"
        ? (b.analysis?.riskScore ?? 0) - (a.analysis?.riskScore ?? 0)
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 100);

  res.json(rows);
};
