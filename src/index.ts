import { connectDB } from "./configs/db.ts";
import { cloudinaryConfig } from "./configs/cloudinary.ts";
import env from "./configs/env.ts";
import { server } from "./server.ts";

async function bootstrap() {
  try {
    await connectDB();

    cloudinaryConfig();

    server.listen(env.PORT, () => {
      console.log(`Server is running on http://localhost:${env.PORT}`);
    });
  } catch (err) {
    console.error("Failed to start application:", err);
    process.exit(1);
  }
}

bootstrap();
