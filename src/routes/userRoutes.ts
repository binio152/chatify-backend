import { Router } from "express";
import {
  getMyProfile,
  getUserById,
  searchUsersByIdentifier,
  updateMyProfile,
  uploadAvatar,
} from "../controllers/userController.ts";
import { authenticationToken } from "../middlewares/auth.ts";
import { uploadFile } from "../middlewares/fileUpload.ts";

const router = Router();

router.get("/search", authenticationToken, searchUsersByIdentifier);

// Get my profile
router.get("/me", authenticationToken, getMyProfile);

// Update my profile (client uses POST /api/users/me)
router.post("/me", authenticationToken, updateMyProfile);

// Upload avatar (multipart/form-data, field: 'avatar')
router.post("/avatar", authenticationToken, uploadFile.single("avatar"), uploadAvatar);

// Get user by id
router.get("/:id", authenticationToken, getUserById);

export default router;
