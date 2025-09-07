import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema;

const eventSchema = new mongoose.Schema(
  {
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
    eventType: {
      type: String,
      enum: ['online', 'offline', 'hybrid'],
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    maxAttendees: {
      type: Number,
      required: true,
    },
    registrationFee: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    image: {
      url: String,
      public_id: String,
    },
    organizer: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    tags: [String],
    requirements: [String],
    benefits: [String],
    contactInfo: {
      email: String,
      phone: String,
      website: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    featuredAt: {
      type: Date,
    },
    registeredUsers: [{
      user: {
        type: ObjectId,
        ref: "User"
      },
      registrationDate: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['registered', 'attended', 'cancelled'],
        default: 'registered'
      },
      paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
      },
      additionalInfo: String,
      contactInfo: {
        email: String,
        phone: String
      }
    }],
    likes: [{ type: ObjectId, ref: "User" }],
    comments: [{
      text: String,
      created: {
        type: Date,
        default: Date.now,
      },
      postedBy: {
        type: ObjectId,
        ref: "User",
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
eventSchema.index({ startDate: 1, isActive: 1, isPublished: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ category: 1 });

export default mongoose.model("Event", eventSchema);
