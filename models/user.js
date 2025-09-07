import mongoose from "mongoose";
import { Schema } from "mongoose";

const userSchema = new Schema(
  {
    fname: {
      type: String,
      required: true,
    },
    lname: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 8,
      max: 64,
    },
    role: {
      type: String,
      enum: ['user', 'business', 'admin'],
      default: 'user',
      required: true,
    },
    businessInfo: {
      businessName: String,
      businessType: String,
      businessDescription: String,
      businessWebsite: String,
      businessPhone: String,
      businessAddress: String,
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
    kycInfo: {
      documentType: {
        type: String,
        enum: ['citizenship', 'pan_card'],
        required: true,
      },
      documentNumber: {
        type: String,
        required: true,
      },
      documentImage: {
        url: String,
        public_id: String,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      verifiedAt: Date,
      rejectionReason: String,
    },
    favoritePostsList: [{ post: {} }],
    about: {},
    userProfileImage: {
      url: String,
      public_id: String,
    },
    userCoverImage: {
      url: String,
      public_id: String,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    featuredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
