import type { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";

interface ValidateProps {
  schema: ZodType<any>;
  type: "body" | "query" | "params" | "file";
}

export const validateRequest = ({ type, schema }: ValidateProps) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[type]);
    console.log(result); // DEV ONLY

    if (!result.success) {
      const errorPaths = type === "body" ? "form-fields" : type;

      const errors = Object.fromEntries(
        result.error.issues.map((issue) => [
          issue.path.at(-1) ?? errorPaths,
          issue.message,
        ]),
      );

      console.log(result.error.issues); // DEV ONLY

      return res.status(400).json({ success: false, message: errors });
    }

    next();
  };
};
