import { Router } from "express";
import { validateRequest } from "../middlewares/validateRequest.ts";
import { sendDirectMessageSchema } from "../schemas/message.ts";
import { sendDirectMessage } from "../controllers/messageController.ts";
import { uploadFile } from "../middlewares/fileUpload.ts";
import {
  requireFriendship,
  requireMessageContentOrImage,
} from "../middlewares/message.ts";

const router = Router();

router.post(
  "/direct",
  uploadFile.single("image"),
  validateRequest({ type: "body", schema: sendDirectMessageSchema }),
  requireFriendship,
  requireMessageContentOrImage,
  sendDirectMessage,
);

export { router as messageRouter };
export default router;
