import { app } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";

async function bootstrap() {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`SureVision AI backend listening on :${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Backend failed to start", error);
  process.exit(1);
});

