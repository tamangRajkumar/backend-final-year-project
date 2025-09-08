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
router.post("/posts", requireSignin, createPost);

// Get all posts with pagination and filtering
router.get("/posts", getAllPosts);

// Get posts by specific user
router.get("/posts/user/:userId", getPostsByUser);

// Get single post by ID
router.get("/posts/:id", getPostById);

// Update post
router.put("/posts/:id", requireSignin, updatePost);

// Delete post
router.delete("/posts/:id", requireSignin, deletePost);

// Like/Unlike post
router.post("/posts/:id/like", requireSignin, toggleLike);

// Add comment to post
router.post("/posts/:id/comment", requireSignin, addComment);

// Express interest in business proposal
router.post("/posts/:id/interest", requireSignin, expressInterest);

// Update interest status (for proposal owner)
router.put("/posts/:id/interest/:interestId", requireSignin, updateInterestStatus);

// Register for business proposal
router.post("/posts/:id/register", requireSignin, registerForProposal);

// Get registered users for a proposal (for proposal owner)
router.get("/posts/:id/registered-users", requireSignin, getRegisteredUsers);

// Update registration status (for proposal owner)
router.put("/posts/:id/registration/:registrationId", requireSignin, updateRegistrationStatus);

export default router;