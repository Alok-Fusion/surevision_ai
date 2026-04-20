import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-access-secret-123456";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-123456";
process.env.SETTINGS_ENCRYPTION_SECRET = "test-settings-secret-123456";
process.env.AI_ENGINE_URL = "http://127.0.0.1:8000";
process.env.FRONTEND_URL = "http://localhost:3000";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
