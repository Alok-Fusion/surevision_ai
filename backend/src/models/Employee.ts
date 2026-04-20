import { Schema, model, type Document, type Types } from "mongoose";

export type EmployeeStatus = "active" | "probation" | "pip" | "exited";

export interface IEmployee extends Document {
  employeeId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  dateOfJoining: Date;
  status: EmployeeStatus;
  organizationId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    employeeId: { type: String, required: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    department: { type: String, required: true, trim: true, index: true },
    designation: { type: String, required: true, trim: true },
    dateOfJoining: { type: Date, required: true },
    status: { type: String, enum: ["active", "probation", "pip", "exited"], default: "active", index: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }
  },
  { timestamps: true }
);

employeeSchema.index({ employeeId: 1, organizationId: 1 }, { unique: true });
employeeSchema.index({ name: "text", email: "text", department: "text", designation: "text" });

export const Employee = model<IEmployee>("Employee", employeeSchema);
