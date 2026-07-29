import { connectDB } from "./configs/db.ts";
import env from "./configs/env.ts";
import app from "./server.ts";

connectDB().then(() => {
  app.listen(env.PORT, () => {
    console.log(`Server is running on http://localhost:${3000}`);
  });
});
