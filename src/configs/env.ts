import dotenv from "dotenv";
import ms, { type StringValue } from "ms";
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

  // CORS
  CORS_ORIGIN: z
    .string()
    .or(z.array(z.string()))
    .transform((val) => {
      if (typeof val === "string") {
        return val.split(",").map((origin) => origin.trim());
      }
      return val;
    })
    .default([]),

  // JWT & Auth
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z
    .string()
    .default("7d")
    .transform((val, ctx) => {
      const milliseconds = ms(val as StringValue);

      if (milliseconds === undefined || isNaN(milliseconds)) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid time format ( example: '1h', '2d' )",
        });
        return z.NEVER;
      }

      return milliseconds / 1000;
    }),
  REFRESH_TOKEN_EXPIRES_IN: z
    .string()
    .default("30d")
    .transform((val, ctx) => {
      const milliseconds = ms(val as StringValue);

      if (milliseconds === undefined || isNaN(milliseconds)) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid time format ( example: '1h', '2d' )",
        });
        return z.NEVER;
      }

      return milliseconds / 1000;
    }),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(20).default(12),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
});

export type Env = z.infer<typeof envSchema>;
let env: Env;

try {
  env = envSchema.parse(process.env);
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
