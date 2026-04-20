import { Schema, model, type Document, type Types } from "mongoose";

export interface IUpload extends Document {
  fileName: string;
  fileType: string;
  category: "invoice" | "contract" | "trade finance" | "KYC" | "policy" | "vendor report";
  extractedData: unknown;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const uploadSchema = new Schema<IUpload>(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    category: {
      type: String,
      enum: ["invoice", "contract", "trade finance", "KYC", "policy", "vendor report"],
      required: true
    },
    extractedData: { type: Schema.Types.Mixed, default: {} },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }
  },
  { timestamps: true }
);

export const Upload = model<IUpload>("Upload", uploadSchema);

