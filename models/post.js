import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

const postSchema = new mongoose.Schema(
  {
    postType: {
      type: String,
      enum: ['normal', 'business_proposal'],
      default: 'normal',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
    },
    postedBy: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    image: {
      url: String,
      public_id: String,
    },
    
    // Business Proposal specific fields
    businessProposal: {
      industry: String,
      investmentAmount: {
        min: Number,
        max: Number,
        currency: {
          type: String,
          default: 'USD'
        }
      },
      partnershipType: {
        type: String,
        enum: ['equity', 'joint_venture', 'franchise', 'distribution', 'other']
      },
      location: String,
      duration: String, // e.g., "6 months", "1 year", "Long-term"
      requirements: [String], // Array of requirements
      benefits: [String], // Array of benefits
      contactInfo: {
        email: String,
        phone: String,
        website: String
      },
      isActive: {
        type: Boolean,
        default: true
      },
      interestedParties: [{
        user: {
          type: ObjectId,
          ref: "User"
        },
        message: String,
        contactInfo: {
          email: String,
          phone: String
        },
        status: {
          type: String,
          enum: ['pending', 'accepted', 'rejected'],
          default: 'pending'
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }],
      registeredUsers: [{
        user: {
          type: ObjectId,
          ref: "User"
        },
        eligibilityReason: {
          type: String,
          required: true
        },
        experience: String,
        skills: [String],
        investmentCapacity: {
          type: String,
          enum: ['low', 'medium', 'high']
        },
        additionalInfo: String,
        contactInfo: {
          email: String,
          phone: String
        },
        status: {
          type: String,
          enum: ['pending', 'reviewed', 'accepted', 'rejected'],
          default: 'pending'
        },
        registeredAt: {
          type: Date,
          default: Date.now
        }
      }]
    },

    favoritePost: "",

    likes: [{ type: ObjectId, ref: "User" }],

    comments: [
      {
        text: String,
        created: {
          type: Date,
          default: Date.now,
        },
        postedBy: {
          type: ObjectId,
          ref: "User",
        },
      },
    ],

    // Post visibility and status
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    featuredAt: {
      type: Date,
    },
    tags: [String], // For better categorization and search
  },
  {
    timestamps: true,
  }
);

// Register the model if it doesn't exist, otherwise return the existing model
const Post = mongoose.models.Post || mongoose.model("Post", postSchema);
export default Post;
