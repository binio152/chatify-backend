import { JwtPayload } from "jsonwebtoken";

export interface SignJwtPayload extends JwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: SignJwtPayload;
    }
  }
}
