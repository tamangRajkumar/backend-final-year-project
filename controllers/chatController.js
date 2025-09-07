import Chat from "../models/chat.js";
import Message from "../models/message.js";
import User from "../models/user.js";

// Create or get existing chat between two users
export const createOrGetChat = async (req, res) => {
  try {
    const { participantId } = req.body;
    const currentUserId = req.auth._id;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: "Participant ID is required"
      });
    }

    if (participantId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Cannot create chat with yourself"
      });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found"
      });
    }

    // Check if chat already exists between these two users
    let chat = await Chat.findOne({
      participants: { $all: [currentUserId, participantId] },
      chatType: 'direct'
    }).populate('participants', 'fname lname email userProfileImage role businessInfo')
      .populate('lastMessage');

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [currentUserId, participantId],
        chatType: 'direct',
        createdBy: currentUserId
      });
      await chat.save();
      
      // Populate the chat
      await chat.populate('participants', 'fname lname email userProfileImage role businessInfo');
    }

    res.json({
      success: true,
      data: chat
    });

  } catch (error) {
    console.error("Error creating/getting chat:", error);
    res.status(500).json({
      success: false,
      message: "Error creating/getting chat",
      error: error.message
    });
  }
};

// Get all chats for a user
export const getUserChats = async (req, res) => {
  try {
    const userId = req.auth._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const chats = await Chat.find({
      participants: userId,
      isActive: true,
      archivedBy: { $ne: userId }
    })
    .populate('participants', 'fname lname email userProfileImage role businessInfo')
    .populate('lastMessage')
    .populate('lastMessage.sender', 'fname lname userProfileImage')
    .sort({ lastMessageAt: -1 })
    .skip(skip)
    .limit(limit);

    // Get total count
    const totalChats = await Chat.countDocuments({
      participants: userId,
      isActive: true,
      archivedBy: { $ne: userId }
    });

    const totalPages = Math.ceil(totalChats / limit);

    res.json({
      success: true,
      data: chats,
      pagination: {
        currentPage: page,
        totalPages,
        totalChats,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user chats",
      error: error.message
    });
  }
};

// Get messages for a specific chat
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.auth._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat"
      });
    }

    // Get messages
    const messages = await Message.find({
      chat: chatId,
      isDeleted: false
    })
    .populate('sender', 'fname lname userProfileImage role businessInfo')
    .populate('replyTo')
    .populate('replyTo.sender', 'fname lname userProfileImage')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    // Get total count
    const totalMessages = await Message.countDocuments({
      chat: chatId,
      isDeleted: false
    });

    const totalPages = Math.ceil(totalMessages / limit);

    // Mark messages as read
    await Message.updateMany(
      { 
        chat: chatId, 
        sender: { $ne: userId },
        isRead: false 
      },
      { 
        $set: { isRead: true },
        $push: { 
          readBy: { 
            user: userId, 
            readAt: new Date() 
          } 
        }
      }
    );

    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: page,
        totalPages,
        totalMessages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching chat messages",
      error: error.message
    });
  }
};

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, messageType, replyTo } = req.body;
    const senderId = req.auth._id;

    if (!chatId || !content) {
      return res.status(400).json({
        success: false,
        message: "Chat ID and content are required"
      });
    }

    // Check if user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    if (!chat.participants.includes(senderId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat"
      });
    }

    // Create message
    const message = new Message({
      chat: chatId,
      sender: senderId,
      content,
      messageType: messageType || 'text',
      replyTo: replyTo || null
    });

    await message.save();

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.lastMessageAt = new Date();
    await chat.save();

    // Populate the message
    await message.populate('sender', 'fname lname userProfileImage role businessInfo');
    if (replyTo) {
      await message.populate('replyTo');
      await message.populate('replyTo.sender', 'fname lname userProfileImage');
    }

    res.json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message
    });
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.auth._id;

    // Check if user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat"
      });
    }

    // Mark messages as read
    await Message.updateMany(
      { 
        chat: chatId, 
        sender: { $ne: userId },
        isRead: false 
      },
      { 
        $set: { isRead: true },
        $push: { 
          readBy: { 
            user: userId, 
            readAt: new Date() 
          } 
        }
      }
    );

    res.json({
      success: true,
      message: "Messages marked as read"
    });

  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking messages as read",
      error: error.message
    });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.auth._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own messages"
      });
    }

    // Soft delete the message
    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: "Message deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting message",
      error: error.message
    });
  }
};

// Edit a message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.auth._id;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required"
      });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages"
      });
    }

    // Update message
    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    // Populate the message
    await message.populate('sender', 'fname lname userProfileImage role businessInfo');

    res.json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({
      success: false,
      message: "Error editing message",
      error: error.message
    });
  }
};

// Get unread message count for a user
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.auth._id;

    const unreadCount = await Message.countDocuments({
      chat: { $in: await Chat.find({ participants: userId }).distinct('_id') },
      sender: { $ne: userId },
      isRead: false,
      isDeleted: false
    });

    res.json({
      success: true,
      data: { unreadCount }
    });

  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Error getting unread count",
      error: error.message
    });
  }
};

// Delete a chat (soft delete - removes user from participants)
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.auth._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    // Check if user is participant in this chat
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat"
      });
    }

    // Remove user from participants (soft delete)
    chat.participants = chat.participants.filter(participant => 
      participant.toString() !== userId
    );

    // If no participants left, mark chat as inactive
    if (chat.participants.length === 0) {
      chat.isActive = false;
    }

    await chat.save();

    res.json({
      success: true,
      message: "Chat deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting chat",
      error: error.message
    });
  }
};

// Archive a chat (alternative to delete - keeps chat but hides it)
export const archiveChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.auth._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    // Check if user is participant in this chat
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat"
      });
    }

    // Add archivedBy field to track who archived it
    if (!chat.archivedBy) {
      chat.archivedBy = [];
    }
    
    if (!chat.archivedBy.includes(userId)) {
      chat.archivedBy.push(userId);
    }

    await chat.save();

    res.json({
      success: true,
      message: "Chat archived successfully"
    });

  } catch (error) {
    console.error("Error archiving chat:", error);
    res.status(500).json({
      success: false,
      message: "Error archiving chat",
      error: error.message
    });
  }
};

// Unarchive a chat
export const unarchiveChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.auth._id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    // Check if user is participant in this chat
    if (!chat.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this chat"
      });
    }

    // Remove user from archivedBy array
    if (chat.archivedBy && chat.archivedBy.includes(userId)) {
      chat.archivedBy = chat.archivedBy.filter(archivedUserId => 
        archivedUserId.toString() !== userId
      );
    }

    await chat.save();

    res.json({
      success: true,
      message: "Chat unarchived successfully"
    });

  } catch (error) {
    console.error("Error unarchiving chat:", error);
    res.status(500).json({
      success: false,
      message: "Error unarchiving chat",
      error: error.message
    });
  }
};
