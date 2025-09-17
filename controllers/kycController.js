import User from "../models/user.js";
import cloudinary from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || "dsynpfcpm",
  api_key: process.env.CLOUDINARY_KEY || "734459153853134",
  api_secret: process.env.CLOUDINARY_SECRET || "dELPoFvpXI0c3SLFIuCAslnPf4s",
});

// Submit KYC documents
export const submitKYC = async (req, res) => {
  try {
    const userId = req.auth._id;
    const { documentType, documentNumber } = req.body;
    const documentImage = req.file;

    // Validation
    if (!documentType || documentType === '') {
      return res.status(400).json({
        success: false,
        message: "Document type is required",
      });
    }

    if (!documentNumber || documentNumber === '') {
      return res.status(400).json({
        success: false,
        message: "Document number is required",
      });
    }

    if (!documentImage) {
      return res.status(400).json({
        success: false,
        message: "Document image is required",
      });
    }

    // Validate document type
    if (!['citizenship', 'passport', 'pan_card'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document type. Must be 'citizenship', 'passport', or 'pan_card'",
      });
    }

    // Upload document image to Cloudinary
    const result = await cloudinary.uploader.upload(documentImage.path, {
      folder: "kyc-documents",
      resource_type: "auto",
    });

    // Update user's KYC information
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        kycInfo: {
          documentType,
          documentNumber,
          documentImage: {
            url: result.secure_url,
            public_id: result.public_id,
          },
          isVerified: false, // Reset verification status
          verifiedBy: null,
          verifiedAt: null,
          rejectionReason: null,
        },
      },
      { new: true }
    ).select("-password");

    res.json({
      success: true,
      message: "KYC documents submitted successfully. Please wait for admin verification.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error submitting KYC:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit KYC documents",
      error: error.message,
    });
  }
};

// Get user's KYC status
export const getKYCStatus = async (req, res) => {
  try {
    console.log("KYC Status request received:", req.auth);
    const userId = req.auth._id;
    const user = await User.findById(userId).select("kycInfo");

    if (!user) {
      console.log("User not found for ID:", userId);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("KYC Status found:", user.kycInfo);
    res.json({
      success: true,
      kycInfo: user.kycInfo,
    });
  } catch (error) {
    console.error("Error fetching KYC status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch KYC status",
      error: error.message,
    });
  }
};

// Get all pending KYC verifications (Admin only)
export const getPendingKYC = async (req, res) => {
  try {
    const users = await User.find({
      "kycInfo.documentType": { $nin: ["", null] },
      "kycInfo.documentNumber": { $nin: ["", null] },
      "kycInfo.documentImage.url": { $nin: ["", null] },
      "kycInfo.isVerified": false,
    })
      .select("fname lname email role country createdAt kycInfo businessInfo")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching pending KYC:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending KYC verifications",
      error: error.message,
    });
  }
};

// Verify KYC (Admin only)
export const verifyKYC = async (req, res) => {
  try {
    const { userId, isVerified, rejectionReason } = req.body;
    const adminId = req.auth._id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const updateData = {
      "kycInfo.isVerified": isVerified,
      "kycInfo.verifiedBy": adminId,
      "kycInfo.verifiedAt": new Date(),
    };

    if (!isVerified && rejectionReason) {
      updateData["kycInfo.rejectionReason"] = rejectionReason;
    } else if (isVerified) {
      updateData["kycInfo.rejectionReason"] = null;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("fname lname email kycInfo");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: isVerified 
        ? "KYC verification approved successfully" 
        : "KYC verification rejected",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error verifying KYC:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify KYC",
      error: error.message,
    });
  }
};
