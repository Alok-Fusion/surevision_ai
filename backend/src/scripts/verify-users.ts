import { connectDb } from "../config/db";
import { User } from "../models/User";

async function verifyAllUsers() {
  await connectDb();
  
  const result = await User.updateMany(
    {},
    { $set: { emailVerified: true } }
  );
  
  console.log(`Verification complete. Updated ${result.modifiedCount} accounts to have emailVerified: true.`);
  process.exit(0);
}

verifyAllUsers().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
