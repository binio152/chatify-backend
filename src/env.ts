import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

const stage = process.env.APP_STAGE || "dev";

const isProduction = stage === "prod";
const isDevelopment = stage === "dev";
const isTesting = stage === "test";

// Load .env file just while developemnt or testing
if (isDevelopment || isTesting) {
  dotenv.config({
    path: path.resolve(process.cwd(), `.env.${stage}`),
    override: true,
  });
}

// Define the schema with environment-specific requirements
const envSchema = z.object({
  // Node environment and Server
  PORT: z.coerce.number().positive().default(8080),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  APP_STAGE: z.enum(["dev", "test", "prod"]).default("dev"),

  // Database
  DATABASE_URL: z.coerce.string().startsWith("mongodb+srv://"),
});

export type Env = z.infer<typeof envSchema>;
let env: Env;

try {
  env = envSchema.parse(process.env);
  console.log(env);
} catch (err) {
  if (err instanceof z.ZodError) {
    console.log("Invalid env variables");

    const flattened = z.flattenError(err);
    console.log(JSON.stringify(flattened.fieldErrors, null, 2));

    err.issues.forEach((issue) => {
      const pathStr = issue.path.join(".");
      console.log(`${pathStr}: ${issue.message}`);
    });
    process.exit(1);
  }
  throw err;
}

export const isProd = () => env.APP_STAGE === "prod";
export const isDev = () => env.APP_STAGE === "dev";
export const isTest = () => env.APP_STAGE === "test";

export { env };
export default env;
