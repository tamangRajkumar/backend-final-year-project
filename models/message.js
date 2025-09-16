import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema;

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: ObjectId,
      ref: "Chat",
      required: true
    },
    sender: {
      type: ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text'
    },
    attachments: [{
      url: String,
      public_id: String,
      filename: String,
      fileType: String,
      fileSize: Number
    }],
    isRead: {
      type: Boolean,
      default: false
    },
    readBy: [{
      user: {
        type: ObjectId,
        ref: "User"
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    replyTo: {
      type: ObjectId,
      ref: "Message"
    }
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isRead: 1 });

export default mongoose.model("Message", messageSchema);


