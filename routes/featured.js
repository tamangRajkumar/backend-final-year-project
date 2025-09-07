import express from "express";
import { requireSignin } from "../middlewares/auth.js";
import { requireAdmin } from "../middlewares/roleAuth.js";
import {
  getFeaturedContent,
  toggleFeaturedProposal,
  toggleFeaturedBusiness,
  toggleFeaturedEvent,
  getAllFeaturedContent
} from "../controllers/featuredController.js";

const router = express.Router();

// Get featured content for homepage (public)
router.get("/", getFeaturedContent);

// Admin routes for managing featured content (require authentication)
router.get("/admin/all", requireSignin, requireAdmin, getAllFeaturedContent);
router.put("/proposal/:postId", requireSignin, requireAdmin, toggleFeaturedProposal);
router.put("/business/:userId", requireSignin, requireAdmin, toggleFeaturedBusiness);
router.put("/event/:eventId", requireSignin, requireAdmin, toggleFeaturedEvent);

export default router;
