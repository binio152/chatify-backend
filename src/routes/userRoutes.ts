import { Router } from "express";
import { getUserById } from "../controllers/userController.ts";

const router = Router();

// @route   POST users/profile
router.get("/:id", getUserById);

// @route   POST users/profile
router.get("/me", getUserById);

export default router;
