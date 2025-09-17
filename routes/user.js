import express from "express";
import { requireSignin } from "../middlewares/auth.js";
import { requireAdmin, requireBusinessOrAdmin } from "../middlewares/roleAuth.js";
import {
  getAllUsers,
  getAllBusinesses,
  getUserById,
  updateUserRole,
  verifyBusiness,
  getPendingKYC,
  verifyKYC,
  deleteUser,
  unverifyKYC,
  updateGoalsAndSkills,
  getGoalsAndSkills
} from "../controllers/userController.js";

const router = express.Router();

// Get all users (All authenticated users)
router.get("/users", requireSignin, getAllUsers);

// Get all businesses (All authenticated users)
router.get("/businesses", requireSignin, getAllBusinesses);

// Get user by ID (Admin only)
router.get("/users/:id", requireSignin, requireAdmin, getUserById);

// Update user role (Admin only)
router.put("/users/:id/role", requireSignin, requireAdmin, updateUserRole);

// Verify business (Admin only)
router.put("/businesses/:id/verify", requireSignin, requireAdmin, verifyBusiness);

// Get pending KYC verifications (Admin only)
router.get("/kyc/pending", requireSignin, requireAdmin, getPendingKYC);

// Verify KYC (Admin only)
router.put("/kyc/:id/verify", requireSignin, requireAdmin, verifyKYC);

// Unverify KYC (Admin only)
router.put("/kyc/:id/unverify", requireSignin, requireAdmin, unverifyKYC);

// Delete user (Admin only)
router.delete("/users/:id", requireSignin, requireAdmin, deleteUser);

// Test route
router.get("/user/test", (req, res) => {
  res.json({ message: "User routes are working!" });
});

// Goals and Skills routes (All authenticated users)
router.get("/user/goals-skills", requireSignin, getGoalsAndSkills);
router.put("/user/goals-skills", requireSignin, updateGoalsAndSkills);

export default router;
