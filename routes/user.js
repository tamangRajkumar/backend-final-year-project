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
  unverifyKYC
} from "../controllers/userController.js";

const router = express.Router();

// Get all users (Admin only)
router.get("/users", requireSignin, requireAdmin, getAllUsers);

// Get all businesses (Admin and Business)
router.get("/businesses", requireSignin, requireBusinessOrAdmin, getAllBusinesses);

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

export default router;
