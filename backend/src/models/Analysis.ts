import { Schema, model, type Document, type Types } from "mongoose";

export type Recommendation = "Approve" | "Revise" | "Reject" | "Pilot";

export interface IBoardroomViewpoint {
  role: "CFO" | "COO" | "CHRO" | "Compliance Head";
  stance: string;
  concern: string;
}

export interface IAnalysis extends Document {
  decisionId: Types.ObjectId;
  recommendation: Recommendation;
  riskScore: number;
  trustScore: number;
  complianceScore: number;
  roiScore: number;
  humanImpactScore: number;
  bestCase: string;
  likelyCase: string;
  worstCase: string;
  hiddenRisks: string[];
  silentPatterns: string[];
  saferAlternative: string;
  rolloutPlan: string[];
  executiveSummary: string;
  boardroomDebate: IBoardroomViewpoint[];
  createdAt: Date;
  updatedAt: Date;
}

const boardroomSchema = new Schema<IBoardroomViewpoint>(
  {
    role: { type: String, enum: ["CFO", "COO", "CHRO", "Compliance Head"], required: true },
    stance: { type: String, required: true },
    concern: { type: String, required: true }
  },
  { _id: false }
);

const analysisSchema = new Schema<IAnalysis>(
  {
    decisionId: { type: Schema.Types.ObjectId, ref: "Decision", required: true, index: true },
    recommendation: { type: String, enum: ["Approve", "Revise", "Reject", "Pilot"], required: true },
    riskScore: { type: Number, min: 0, max: 100, required: true },
    trustScore: { type: Number, min: 0, max: 100, required: true },
    complianceScore: { type: Number, min: 0, max: 100, required: true },
    roiScore: { type: Number, min: 0, max: 100, required: true },
    humanImpactScore: { type: Number, min: 0, max: 100, required: true },
    bestCase: { type: String, required: true },
    likelyCase: { type: String, required: true },
    worstCase: { type: String, required: true },
    hiddenRisks: [{ type: String }],
    silentPatterns: [{ type: String }],
    saferAlternative: { type: String, required: true },
    rolloutPlan: [{ type: String }],
    executiveSummary: { type: String, required: true },
    boardroomDebate: [boardroomSchema]
  },
  { timestamps: true }
);

export const Analysis = model<IAnalysis>("Analysis", analysisSchema);

