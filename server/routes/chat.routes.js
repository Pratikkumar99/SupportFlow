import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  chatController,
  getConversations,
  getConversation,
  deleteConversation,
} from "../controllers/chat.controller.js";
const router = express.Router();

router.post("/", authMiddleware, chatController);
router.get("/conversations", authMiddleware, getConversations);
router.get(
  "/conversations/:conversationId",
  authMiddleware,
  getConversation
);

router.delete(
  "/conversations/:conversationId",
  authMiddleware,
  deleteConversation
);

export default router;