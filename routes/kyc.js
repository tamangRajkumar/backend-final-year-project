import express from "express";
import multer from "multer";
import path from "path";
import { requireSignin, adminMiddleware } from "../middlewares/auth.js";
import { submitKYC, getKYCStatus, getPendingKYC, verifyKYC } from "../controllers/kycController.js";

const router = express.Router();

// Multer configuration for KYC document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "kyc-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "KYC routes are working!" });
});

// User routes
router.post("/submit", requireSignin, upload.single("documentImage"), submitKYC);
router.get("/status", requireSignin, getKYCStatus);

// Admin routes
router.get("/pending", requireSignin, adminMiddleware, getPendingKYC);
router.post("/verify", requireSignin, adminMiddleware, verifyKYC);

export default router;
