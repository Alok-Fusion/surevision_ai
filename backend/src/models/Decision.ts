import { Schema, model, type Document, type Types } from "mongoose";

export type DecisionUrgency = "low" | "medium" | "high" | "critical";

export interface IDissentSummary {
  minorCount: number;
  majorCount: number;
  blockingCount: number;
  trustScoreDelta: number;
}

export interface IDecision extends Document {
  title: string;
  description: string;
  department: string;
  industry: string;
  timeHorizon: 30 | 90 | 365;
  stakeholdersAffected: string;
  budgetImpact: number;
  urgency: DecisionUrgency;
  complianceSensitivity: "low" | "medium" | "high";
  currentPainPoint: string;
  dissentSummary: IDissentSummary;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const dissentSummarySchema = new Schema<IDissentSummary>(
  {
    minorCount: { type: Number, default: 0 },
    majorCount: { type: Number, default: 0 },
    blockingCount: { type: Number, default: 0 },
    trustScoreDelta: { type: Number, default: 0 }
  },
  { _id: false }
);

const decisionSchema = new Schema<IDecision>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    department: { type: String, required: true, index: true },
    industry: { type: String, required: true, index: true },
    timeHorizon: { type: Number, enum: [30, 90, 365], required: true },
    stakeholdersAffected: { type: String, required: true },
    budgetImpact: { type: Number, required: true },
    urgency: { type: String, enum: ["low", "medium", "high", "critical"], required: true },
    complianceSensitivity: { type: String, enum: ["low", "medium", "high"], required: true },
    currentPainPoint: { type: String, required: true },
    dissentSummary: { type: dissentSummarySchema, default: () => ({ minorCount: 0, majorCount: 0, blockingCount: 0, trustScoreDelta: 0 }) },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }
  },
  { timestamps: true }
);

decisionSchema.index({ title: "text", description: "text", department: "text", industry: "text" });

export const Decision = model<IDecision>("Decision", decisionSchema);

