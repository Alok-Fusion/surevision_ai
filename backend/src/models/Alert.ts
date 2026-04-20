import { Schema, model, type Document } from "mongoose";

export interface IAlert extends Document {
  type: "risk" | "compliance" | "cost" | "vendor" | "system";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    type: { type: String, enum: ["risk", "compliance", "cost", "vendor", "system"], required: true },
    severity: { type: String, enum: ["low", "medium", "high", "critical"], required: true },
    message: { type: String, required: true },
    resolved: { type: Boolean, default: false }
  },
  { timestamps: true }
);

alertSchema.index({ severity: 1, resolved: 1, createdAt: -1 });

export const Alert = model<IAlert>("Alert", alertSchema);

