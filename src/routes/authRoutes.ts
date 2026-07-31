import { Router } from "express";
import {
  refreshToken,
  signin,
  signout,
  signup,
} from "../controllers/authController.ts";
import { validateRequest } from "../middlewares/validateRequest.ts";
import { createUserSchema, signInSchema } from "../schemas/user.ts";

const router = Router();

router.post(
  "/signup",
  validateRequest({ type: "body", schema: createUserSchema }),
  signup,
);

router.post(
  "/signin",
  validateRequest({ type: "body", schema: signInSchema }),
  signin,
);

router.post("/signout", signout);

router.post("/refresh", refreshToken);

export { router as authRouter };
export default router;
