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

// @route   POST /api/auth/signup
// @desc    Register a new user
router.post(
  "/signup",
  validateRequest({ type: "body", schema: createUserSchema }),
  signup,
);

// @route   POST /api/auth/signin
// @desc    Signin a user
router.post(
  "/signin",
  validateRequest({ type: "body", schema: signInSchema }),
  signin,
);

// @route   POST /api/auth/signout
// @desc    Signout a user
router.post("/signout", signout);

// @route   POST /api/auth/signout
// @desc    Signout a user
router.post("/refresh", refreshToken);

export { router as authRouter };
export default router;
