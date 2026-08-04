import { Router } from "express";
import { createConversationSchema } from "../schemas/conversation.ts";
import { createConversation } from "../controllers/conversationController.ts";
import { validateRequest } from "../middlewares/validateRequest.ts";
import {
  requireAllMembersAreFriends,
  validateConversationBody,
} from "../middlewares/conversation.ts";

const router = Router();

router.post(
  "/",
  validateRequest({ type: "body", schema: createConversationSchema }),
  validateConversationBody,
  requireAllMembersAreFriends,
  createConversation,
);

export { router as conversationRouter };
export default router;
