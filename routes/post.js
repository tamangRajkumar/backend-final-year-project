import express from "express";
import { requireSignin } from "../middlewares/auth.js";
import {
  createPost,
  getAllPosts,
  getPostsByUser,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  addComment,
  expressInterest,
  updateInterestStatus,
  registerForProposal,
  getRegisteredUsers,
  updateRegistrationStatus
} from "../controllers/postController.js";

const router = express.Router();

// Create a new post
router.post("/", requireSignin, createPost);

// Get all posts with pagination and filtering
router.get("/", getAllPosts);

// Get posts by specific user
router.get("/user/:userId", getPostsByUser);

// Get single post by ID
router.get("/:id", getPostById);

// Update post
router.put("/:id", requireSignin, updatePost);

// Delete post
router.delete("/:id", requireSignin, deletePost);

// Like/Unlike post
router.post("/:id/like", requireSignin, toggleLike);

// Add comment to post
router.post("/:id/comment", requireSignin, addComment);

// Express interest in business proposal
router.post("/:id/interest", requireSignin, expressInterest);

// Update interest status (for proposal owner)
router.put("/:id/interest/:interestId", requireSignin, updateInterestStatus);

// Register for business proposal
router.post("/:id/register", requireSignin, registerForProposal);

// Get registered users for a proposal (for proposal owner)
router.get("/:id/registered-users", requireSignin, getRegisteredUsers);

// Update registration status (for proposal owner)
router.put("/:id/registration/:registrationId", requireSignin, updateRegistrationStatus);

export default router;