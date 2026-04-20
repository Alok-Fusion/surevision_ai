import { connectDb } from "../config/db";
import { Analysis } from "../models/Analysis";
import { Alert } from "../models/Alert";
import { AuditLog } from "../models/AuditLog";
import { Decision } from "../models/Decision";
import { Upload } from "../models/Upload";

async function clearDummyData() {
  await connectDb();
  
  await Promise.all([
    Decision.deleteMany({}),
    Analysis.deleteMany({}),
    Upload.deleteMany({}),
    Alert.deleteMany({}),
    AuditLog.deleteMany({})
  ]);
  
  console.log("Database cleared of all dummy records. Users have been preserved.");
  process.exit(0);
}

clearDummyData().catch((error) => {
  console.error("Data clear failed:", error);
  process.exit(1);
});
