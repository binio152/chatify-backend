import express from "express";
import morgan from "morgan";
import env, { isTest } from "./configs/env.ts";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(morgan("dev", { skip: () => isTest() })); // skip logging while testing
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running ..." });
});

export { app };
export default app;
