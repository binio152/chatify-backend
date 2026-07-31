import { Router } from "express";
import {
  getFriendRequestLists,
  getFriendLists,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
} from "../controllers/friendController.ts";
import { validateRequest } from "../middlewares/validateRequest.ts";
import {
  friendRequestIdSchema,
  sendFriendRequestSchema,
} from "../schemas/friend.ts";

const router = Router();

router.get("/lists", getFriendLists);
router.get("/requests", getFriendRequestLists);

router.post(
  "/requests",
  validateRequest({ type: "body", schema: sendFriendRequestSchema }),
  sendFriendRequest,
);

router.post(
  "/requests/:requestId/accept",
  validateRequest({ type: "params", schema: friendRequestIdSchema }),
  acceptFriendRequest,
);

router.post(
  "/requests/:requestId/decline",
  validateRequest({ type: "params", schema: friendRequestIdSchema }),
  declineFriendRequest,
);

router.post(
  "/requests/:requestId/cancel",
  validateRequest({ type: "params", schema: friendRequestIdSchema }),
  cancelFriendRequest,
);

export default router;
