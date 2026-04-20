import { Schema, model, type Document, type Types } from "mongoose";

export type EvaluationRecommendation = "promote" | "salary_hike" | "pip" | "role_change" | "maintain" | "demote";

export interface IEmployeeEvaluation extends Document {
  employeeRef: Types.ObjectId;
  evaluationDate: Date;
  periodsCovered: string[];

  // Rule-based scores
  attendanceScore: number;
  punctualityScore: number;
  productivityScore: number;
  qualityScore: number;
  collaborationScore: number;
  overallScore: number;

  // AI-generated insights
  recommendation: EvaluationRecommendation;
  confidenceLevel: number;
  salaryHikePercent?: number;
  strengths: string[];
  weaknesses: string[];
  actionItems: string[];
  trendAnalysis: string;
  executiveSummary: string;
  riskFlags: string[];

  generatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeEvaluationSchema = new Schema<IEmployeeEvaluation>(
  {
    employeeRef: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    evaluationDate: { type: Date, required: true, default: Date.now },
    periodsCovered: [{ type: String }],

    attendanceScore: { type: Number, min: 0, max: 100, required: true },
    punctualityScore: { type: Number, min: 0, max: 100, required: true },
    productivityScore: { type: Number, min: 0, max: 100, required: true },
    qualityScore: { type: Number, min: 0, max: 100, required: true },
    collaborationScore: { type: Number, min: 0, max: 100, required: true },
    overallScore: { type: Number, min: 0, max: 100, required: true },

    recommendation: {
      type: String,
      enum: ["promote", "salary_hike", "pip", "role_change", "maintain", "demote"],
      required: true
    },
    confidenceLevel: { type: Number, min: 0, max: 100, required: true },
    salaryHikePercent: { type: Number, min: 0, default: null },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    actionItems: [{ type: String }],
    trendAnalysis: { type: String, required: true },
    executiveSummary: { type: String, required: true },
    riskFlags: [{ type: String }],

    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

employeeEvaluationSchema.index({ employeeRef: 1, evaluationDate: -1 });

export const EmployeeEvaluation = model<IEmployeeEvaluation>("EmployeeEvaluation", employeeEvaluationSchema);
