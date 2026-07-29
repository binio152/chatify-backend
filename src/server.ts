import express from "express";

const app = express();

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running ..." });
});

export { app };
export default app;
