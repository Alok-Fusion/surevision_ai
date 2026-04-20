import { Schema, model, type Document, type Types } from "mongoose";

export interface IEmployeeRecord extends Document {
  employeeRef: Types.ObjectId;
  period: string;
  attendanceDays: number;
  totalWorkingDays: number;
  avgLoginTime: string;
  avgLogoutTime: string;
  avgWorkingHours: number;
  tasksAssigned: number;
  tasksCompleted: number;
  qualityScore: number;
  peerRating: number;
  managerRating: number;
  overtimeHours: number;
  leavesUsed: number;
  lateArrivals: number;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeRecordSchema = new Schema<IEmployeeRecord>(
  {
    employeeRef: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    period: { type: String, required: true, trim: true },
    attendanceDays: { type: Number, required: true, min: 0 },
    totalWorkingDays: { type: Number, required: true, min: 1 },
    avgLoginTime: { type: String, required: true, trim: true },
    avgLogoutTime: { type: String, required: true, trim: true },
    avgWorkingHours: { type: Number, required: true, min: 0 },
    tasksAssigned: { type: Number, required: true, min: 0 },
    tasksCompleted: { type: Number, required: true, min: 0 },
    qualityScore: { type: Number, required: true, min: 0, max: 100 },
    peerRating: { type: Number, required: true, min: 0, max: 5 },
    managerRating: { type: Number, required: true, min: 0, max: 5 },
    overtimeHours: { type: Number, required: true, min: 0 },
    leavesUsed: { type: Number, required: true, min: 0 },
    lateArrivals: { type: Number, required: true, min: 0 },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

employeeRecordSchema.index({ employeeRef: 1, period: 1 }, { unique: true });

export const EmployeeRecord = model<IEmployeeRecord>("EmployeeRecord", employeeRecordSchema);
