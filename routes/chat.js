import express from "express";
import { requireSignin } from "../middlewares/auth.js";
import {
  createOrGetChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  editMessage,
  getUnreadCount,
  deleteChat,
  archiveChat,
  unarchiveChat
} from "../controllers/chatController.js";

const router = express.Router();

// All routes require authentication
router.use(requireSignin);

// Create or get existing chat
router.post("/create", createOrGetChat);

// Get all chats for a user
router.get("/", getUserChats);

// Get messages for a specific chat
router.get("/:chatId/messages", getChatMessages);

// Send a message
router.post("/:chatId/messages", sendMessage);

// Mark messages as read
router.put("/:chatId/read", markMessagesAsRead);

// Delete a message
router.delete("/messages/:messageId", deleteMessage);

// Edit a message
router.put("/messages/:messageId", editMessage);

// Get unread message count
router.get("/unread/count", getUnreadCount);

// Delete a chat
router.delete("/:chatId", deleteChat);

// Archive a chat
router.put("/:chatId/archive", archiveChat);

// Unarchive a chat
router.put("/:chatId/unarchive", unarchiveChat);

export default router;
