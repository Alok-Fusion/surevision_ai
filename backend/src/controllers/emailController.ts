import type { RequestHandler } from "express";
import { Analysis } from "../models/Analysis";
import { Decision } from "../models/Decision";
import { AppError } from "../middleware/error";
import { sendReportEmail } from "../services/emailService";

export const emailReport: RequestHandler = async (req, res) => {
  const { decisionId, to } = req.body;
  if (!decisionId || !to) throw new AppError("Decision ID and recipient are required", 400);

  const decision = await Decision.findById(decisionId);
  const analysis = await Analysis.findOne({ decisionId });
  if (!decision || !analysis) throw new AppError("Report not found", 404);

  const dailyBleed = Math.round((decision.budgetImpact * (analysis.riskScore / 100)) / 30);
  const monthlyBleed = dailyBleed * 30;

  const result = await sendReportEmail({
    to,
    subject: `[SureVision Report] ${decision.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; background:#07111f; color:#e2e8f0; padding:32px;">
        <div style="max-width:600px; margin:0 auto; background:#0f172a; border:1px solid rgba(148,163,184,0.18); border-radius:20px; padding:32px;">
          <p style="margin:0 0 8px; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#67e8f9;">SureVision AI Executive Brief</p>
          <h1 style="margin:0 0 16px; font-size:24px; color:#f8fafc;">${decision.title}</h1>
          <p style="margin:0 0 24px; color:#94a3b8; font-size:14px;">Department: ${decision.department} | Industry: ${decision.industry}</p>
          
          <div style="background:#f0fdf4; border-left:4px solid #16a34a; padding:16px; margin-bottom:24px; border-radius:4px;">
            <p style="margin:0 0 8px; font-size:14px; font-weight:bold; color:#166534;">AI Recommendation</p>
            <p style="margin:0; color:#14532d; font-size:15px; line-height:1.5;">${analysis.recommendation}</p>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:24px;">
            <div style="flex:1; min-width:120px; background:#1e293b; padding:16px; border-radius:12px; text-align:center;">
              <p style="margin:0 0 4px; font-size:12px; color:#94a3b8;">Risk Score</p>
              <p style="margin:0; font-size:20px; font-weight:bold; color:${analysis.riskScore < 50 ? '#4ade80' : '#f87171'};">${analysis.riskScore}</p>
            </div>
            <div style="flex:1; min-width:120px; background:#1e293b; padding:16px; border-radius:12px; text-align:center;">
              <p style="margin:0 0 4px; font-size:12px; color:#94a3b8;">Trust Score</p>
              <p style="margin:0; font-size:20px; font-weight:bold; color:${analysis.trustScore > 80 ? '#4ade80' : '#fbbf24'};">${analysis.trustScore}</p>
            </div>
            <div style="flex:1; min-width:120px; background:#1e293b; padding:16px; border-radius:12px; text-align:center;">
              <p style="margin:0 0 4px; font-size:12px; color:#94a3b8;">ROI Score</p>
              <p style="margin:0; font-size:20px; font-weight:bold; color:#60a5fa;">${analysis.roiScore}</p>
            </div>
          </div>

          <div style="background:#fff1f2; border-left:4px solid #e11d48; padding:16px; margin-bottom:24px; border-radius:4px;">
            <p style="margin:0 0 8px; font-size:14px; font-weight:bold; color:#9f1239;">Cost of Inaction (COI) Warning</p>
            <p style="margin:0; color:#be123c; font-size:14px; line-height:1.5;">Delaying this decision by 1 month exposes the organization to an estimated financial leakage of <strong>$${monthlyBleed.toLocaleString()}</strong> ($${dailyBleed.toLocaleString()}/day) based on current risk exposure.</p>
          </div>

          <h2 style="margin:0 0 12px; font-size:18px; color:#f8fafc;">Executive Summary</h2>
          <p style="margin:0 0 24px; font-size:14px; line-height:1.6; color:#cbd5e1;">${analysis.executiveSummary}</p>

          <h2 style="margin:0 0 12px; font-size:18px; color:#f8fafc;">Hidden Risks</h2>
          <ul style="margin:0 0 24px; padding-left:20px; color:#cbd5e1; font-size:14px; line-height:1.6;">
            ${analysis.hiddenRisks.map(r => `<li>${r}</li>`).join("")}
          </ul>

          <h2 style="margin:0 0 12px; font-size:18px; color:#f8fafc;">Phased Rollout</h2>
          <ol style="margin:0 0 24px; padding-left:20px; color:#cbd5e1; font-size:14px; line-height:1.6;">
            ${analysis.rolloutPlan.map(p => `<li>${p}</li>`).join("")}
          </ol>

          <p style="margin:32px 0 0; font-size:12px; color:#64748b; text-align:center;">Generated autonomously by SureVision AI Intelligence Engine.</p>
        </div>
      </div>
    `
  });

  res.json({ message: "Report email queued", providerResponse: result });
};

