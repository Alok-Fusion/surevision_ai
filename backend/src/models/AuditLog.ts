import { Schema, model, type Document, type Types } from "mongoose";

export interface IAuditLog extends Document {
  userId?: Types.ObjectId;
  action: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    action: { type: String, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const AuditLog = model<IAuditLog>("AuditLog", auditLogSchema);

