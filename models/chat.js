import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema;

const chatSchema = new mongoose.Schema(
  {
    participants: [{
      type: ObjectId,
      ref: "User",
      required: true
    }],
    chatType: {
      type: String,
      enum: ['direct', 'group'],
      default: 'direct'
    },
    lastMessage: {
      type: ObjectId,
      ref: "Message"
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    },
    archivedBy: [{
      type: ObjectId,
      ref: "User"
    }],
    createdBy: {
      type: ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageAt: -1 });
chatSchema.index({ createdBy: 1 });

// Register the model if it doesn't exist, otherwise return the existing model
const Chat = mongoose.models.Chat || mongoose.model("Chat", chatSchema);
export default Chat;
