import PDFDocument from "pdfkit";
import { stringify } from "csv-stringify/sync";
import type { IAnalysis } from "../models/Analysis";
import type { IDecision } from "../models/Decision";

export function createCsvReport(decision: IDecision, analysis: IAnalysis) {
  return stringify(
    [
      {
        decision: decision.title,
        department: decision.department,
        recommendation: analysis.recommendation,
        riskScore: analysis.riskScore,
        trustScore: analysis.trustScore,
        complianceScore: analysis.complianceScore,
        roiScore: analysis.roiScore,
        humanImpactScore: analysis.humanImpactScore,
        executiveSummary: analysis.executiveSummary
      }
    ],
    { header: true }
  );
}

export function createPdfReport(decision: IDecision, analysis: IAnalysis, objections: any[] = []): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    // Header
    doc.fontSize(24).font("Helvetica-Bold").fillColor("#06b6d4").text("SureVision AI", { align: "right" });
    doc.fontSize(10).fillColor("#64748b").text("Executive Decision Report", { align: "right" });
    doc.moveDown(2);

    // Title & Meta
    doc.fontSize(18).font("Helvetica-Bold").fillColor("#0f172a").text(decision.title);
    doc.fontSize(10).fillColor("#64748b").text(`Department: ${decision.department} | Industry: ${decision.industry} | Impact: $${decision.budgetImpact.toLocaleString()}`);
    doc.moveDown(1.5);

    // AI Recommendation
    doc.rect(50, doc.y, 495, 40).fillColor("#f0fdf4").fill();
    doc.fillColor("#166534").fontSize(12).font("Helvetica-Bold").text("AI Recommendation:", 60, doc.y - 30);
    doc.font("Helvetica").text(analysis.recommendation, 185, doc.y - 14);
    doc.moveDown(2);

    // Metrics Grid
    const startY = doc.y;
    doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text("Intelligence Metrics", 50, startY);
    doc.moveDown(0.5);

    const metrics = [
      { label: "Trust Score", value: analysis.trustScore, color: analysis.trustScore > 80 ? "#16a34a" : "#ca8a04" },
      { label: "Risk Score", value: analysis.riskScore, color: analysis.riskScore < 50 ? "#16a34a" : "#dc2626" },
      { label: "ROI Score", value: analysis.roiScore, color: "#2563eb" },
      { label: "Compliance Score", value: analysis.complianceScore, color: "#9333ea" }
    ];

    let currentY = doc.y;
    metrics.forEach((m, i) => {
      const x = 50 + (i % 2) * 250;
      if (i % 2 === 0 && i !== 0) currentY += 25;
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#64748b").text(`${m.label}:`, x, currentY);
      doc.fontSize(11).font("Helvetica-Bold").fillColor(m.color).text(m.value.toString(), x + 100, currentY);
    });
    
    // Cost of Inaction (COI)
    doc.moveDown(3);
    const dailyBleed = Math.round((decision.budgetImpact * (analysis.riskScore / 100)) / 30);
    doc.rect(50, doc.y, 495, 50).fillColor("#fff1f2").fill();
    doc.fillColor("#9f1239").fontSize(12).font("Helvetica-Bold").text("Cost of Inaction (COI) Warning", 60, doc.y - 40);
    doc.font("Helvetica").fontSize(10).fillColor("#be123c").text(`Delaying this decision by 1 month exposes the organization to an estimated financial leakage of $${(dailyBleed * 30).toLocaleString()} ($${dailyBleed.toLocaleString()}/day) based on current risk exposure.`, 60, doc.y - 20, { width: 475 });
    
    doc.moveDown(2);

    // Executive Summary
    doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text("Executive Summary", 50, doc.y);
    doc.moveDown(0.5);
    doc.fontSize(10).font("Helvetica").fillColor("#334155").text(analysis.executiveSummary, { align: "justify", lineGap: 3 });
    doc.moveDown(1.5);

    // Hidden Risks
    doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text("Hidden Risks Identified");
    doc.moveDown(0.5);
    analysis.hiddenRisks.forEach((risk) => {
      doc.fontSize(10).font("Helvetica").fillColor("#475569").text(`• ${risk}`, { lineGap: 2 });
    });
    doc.moveDown(1.5);

    // Phased Rollout Plan
    doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text("Implementation & Phased Rollout");
    doc.moveDown(0.5);
    analysis.rolloutPlan.forEach((step, idx) => {
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#06b6d4").text(`Phase ${idx + 1}: `, { continued: true }).font("Helvetica").fillColor("#475569").text(step, { lineGap: 2 });
    });

    // Executive Sign-off Block

    if (decision.dissentSummary && decision.dissentSummary.trustScoreDelta < 0) {
      doc.moveDown(2);
      doc.rect(50, doc.y, 495, 60).fillColor("#fff1f2").fill();
      doc.fillColor("#9f1239").fontSize(12).font("Helvetica-Bold")
         .text("Active Stakeholder Dissent Warning", 60, doc.y - 50);
         
      doc.font("Helvetica").fontSize(10).fillColor("#be123c")
         .text(`This decision contains ${decision.dissentSummary.blockingCount} BLOCKING objections and has reduced the AI Trust Score by ${decision.dissentSummary.trustScoreDelta} points. Executive sign-off overrides these explicit operational warnings.`, 60, doc.y - 30, { width: 475 });

      if (objections.length > 0) {
        doc.moveDown(2);
        doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text("Recorded Dissent History", 50);
        doc.moveDown(0.5);
        objections.forEach(obj => {
          doc.fontSize(10).font("Helvetica-Bold").fillColor("#dc2626")
             .text(`[${String(obj.severity).toUpperCase()} - ${obj.category}] `, { continued: true })
             .fillColor("#334155").font("Helvetica")
             .text(`${obj.rationale}`);
        });
      }
    }

    doc.moveDown(4);
    doc.lineWidth(1).strokeColor("#cbd5e1");
    
    // Signature Line 1
    doc.moveTo(50, doc.y + 30).lineTo(250, doc.y + 30).stroke();
    doc.fontSize(9).font("Helvetica").fillColor("#64748b").text("Approved By (Executive Signature)", 50, doc.y + 35);
    
    // Date Line
    doc.moveTo(350, doc.y - 14).lineTo(500, doc.y - 14).stroke();
    doc.text("Date", 350, doc.y - 9);

    doc.end();
  });
}

