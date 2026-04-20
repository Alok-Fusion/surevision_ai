import { Schema, model, type Document, type Types } from "mongoose";

export type ObjectionCategory = "budget" | "compliance" | "timing" | "technical" | "strategic";
export type ObjectionSeverity = "minor" | "major" | "blocking";
export type ObjectionStatus = "active" | "resolved" | "dismissed";

export interface IObjection extends Document {
  decisionId: Types.ObjectId;
  submittedBy: Types.ObjectId;
  category: ObjectionCategory;
  severity: ObjectionSeverity;
  rationale: string;
  status: ObjectionStatus;
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const objectionSchema = new Schema<IObjection>(
  {
    decisionId: { type: Schema.Types.ObjectId, ref: "Decision", required: true, index: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, enum: ["budget", "compliance", "timing", "technical", "strategic"], required: true },
    severity: { type: String, enum: ["minor", "major", "blocking"], required: true },
    rationale: { type: String, required: true },
    status: { type: String, enum: ["active", "resolved", "dismissed"], default: "active" },
    adminNote: { type: String }
  },
  { timestamps: true }
);

export const Objection = model<IObjection>("Objection", objectionSchema);
