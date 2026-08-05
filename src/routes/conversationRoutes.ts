import { Router } from "express";
import {
  createConversationSchema,
  getConversationParamSchema,
  getConversationQuerySchema,
} from "../schemas/conversation.ts";
import {
  createConversation,
  getAllConversations,
  getConversationById,
} from "../controllers/conversationController.ts";
import { validateRequest } from "../middlewares/validateRequest.ts";
import {
  requireAllMembersAreFriends,
  validateConversationBody,
} from "../middlewares/conversation.ts";
import { uploadFile } from "../middlewares/fileUpload.ts";

const router = Router();

router.get("/", getAllConversations);

router.get(
  "/:conversationId",
  validateRequest({ type: "params", schema: getConversationParamSchema }),
  validateRequest({ type: "query", schema: getConversationQuerySchema }),
  getConversationById,
);

router.post(
  "/",
  uploadFile.single("groupAvatar"),
  validateRequest({ type: "body", schema: createConversationSchema }),
  validateConversationBody,
  requireAllMembersAreFriends,
  createConversation,
);

export { router as conversationRouter };
export default router;
