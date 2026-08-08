import { Router } from "express";
import { validateRequest } from "../middlewares/validateRequest.ts";
import {
  markConversationReadSchema,
  sendDirectMessageSchema,
  sendGroupMessageSchema,
} from "../schemas/message.ts";
import {
  markConversationAsRead,
  sendDirectMessage,
  sendGroupMessage,
} from "../controllers/messageController.ts";
import { uploadFile } from "../middlewares/fileUpload.ts";
import {
  requireFriendship,
  requireGroupMembership,
  requireMessageContentOrImage,
} from "../middlewares/message.ts";

const router = Router();

router.post(
  "/read",
  validateRequest({ type: "body", schema: markConversationReadSchema }),
  markConversationAsRead,
);

router.post(
  "/direct",
  uploadFile.single("image"),
  validateRequest({ type: "body", schema: sendDirectMessageSchema }),
  requireFriendship,
  requireMessageContentOrImage,
  sendDirectMessage,
);

router.post(
  "/group",
  uploadFile.single("image"),
  validateRequest({ type: "body", schema: sendGroupMessageSchema }),
  requireGroupMembership,
  requireMessageContentOrImage,
  sendGroupMessage,
);

export { router as messageRouter };
export default router;
