import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { readdirSync } from "fs";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import multer from "multer";
import path from "path";
import User from "./models/user.js";

const app = express();
const httpServer = createServer(app);

// Database connection
mongoose
  .connect(
    process.env.DATABASE_URL || "mongodb://localhost:27017/final-year-project",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(async () => {
    console.log("Database is connected");

    // Import and register all models to ensure they're available
    await import("./models/user.js");
    await import("./models/post.js");
    await import("./models/event.js");
    await import("./models/chat.js");
    await import("./models/message.js");

    // Check and create admin user if it doesn't exist
    await checkAndCreateAdmin();
  })
  .catch((err) => {
    console.log("Database connection error");
  });

// Function to check and create admin user
const checkAndCreateAdmin = async () => {
  try {
    const User = (await import("./models/user.js")).default;
    const bcrypt = (await import("bcrypt")).default;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@gmail.com" });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash("admin", 10);

    // Create admin user
    const adminUser = new User({
      fname: "Admin",
      lname: "User",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "admin",
      country: "Global",
      gender: "Others",
      kycInfo: {
        documentType: "citizenship",
        documentNumber: "ADMIN001",
        documentImage: {
          url: "",
          public_id: "",
        },
        isVerified: true,
        verifiedAt: new Date(),
      },
      userProfileImage: {
        url: "",
        public_id: "",
      },
      userCoverImage: {
        url: "",
        public_id: "",
      },
      favoritePostsList: [],
    });

    // Save admin user
    await adminUser.save();
    console.log("✅ Admin user created successfully!");
    console.log("📧 Email: admin@gmail.com");
    console.log("🔑 Password: admin");
    console.log("👑 Role: admin");
    console.log("✅ KYC Status: Verified");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  }
};

// Middleware
// app.use(
//   cors()
// );

app.use(
  cors({
    origin: "*", // allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false, // set to true only if cookies/auth headers are needed
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: "true" }));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
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

// Morgan
app.use(morgan("dev"));

// Import Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import featuredRoutes from "./routes/featured.js";
import postRoutes from "./routes/post.js";
import eventRoutes from "./routes/event.js";
import chatRoutes from "./routes/chat.js";

// Use Routes
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api/featured", featuredRoutes);
app.use("/api", postRoutes);
app.use("/api", chatRoutes);
app.use("/api", eventRoutes);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    // origin: process.env.CLIENT_URL || "http://localhost:3000",
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error"));
    }

    const decoded = jwt.verify(
      token,
      "dskfjjnasnfgh762@#@#dqffsadfsa7hghgh"
      // process.env.JWT_SECRET
    );
    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      return next(new Error("User not found"));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication error"));
  }
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(
    `User connected: ${socket.user.fname} ${socket.user.lname} (${socket.userId})`
  );

  // Join user to their personal room
  socket.join(socket.userId);

  // Handle joining chat room
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.userId} joined chat ${chatId}`);
  });

  // Handle leaving chat room
  socket.on("leave_chat", (chatId) => {
    socket.leave(chatId);
    console.log(`User ${socket.userId} left chat ${chatId}`);
  });

  // Handle sending message
  socket.on("send_message", async (data) => {
    try {
      const { chatId, content, messageType, replyTo } = data;

      // Emit message to all users in the chat room
      socket.to(chatId).emit("new_message", {
        chatId,
        content,
        messageType,
        replyTo,
        sender: {
          _id: socket.user._id,
          fname: socket.user.fname,
          lname: socket.user.lname,
          userProfileImage: socket.user.userProfileImage,
          role: socket.user.role,
          businessInfo: socket.user.businessInfo,
        },
        timestamp: new Date(),
      });

      // Emit to sender as well for confirmation
      socket.emit("message_sent", {
        chatId,
        content,
        messageType,
        replyTo,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error handling send_message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // Handle typing indicators
  socket.on("typing_start", (data) => {
    socket.to(data.chatId).emit("user_typing", {
      chatId: data.chatId,
      userId: socket.userId,
      user: {
        _id: socket.user._id,
        fname: socket.user.fname,
        lname: socket.user.lname,
        userProfileImage: socket.user.userProfileImage,
      },
    });
  });

  socket.on("typing_stop", (data) => {
    socket.to(data.chatId).emit("user_stopped_typing", {
      chatId: data.chatId,
      userId: socket.userId,
    });
  });

  // Handle message read status
  socket.on("mark_as_read", (data) => {
    socket.to(data.chatId).emit("message_read", {
      chatId: data.chatId,
      userId: socket.userId,
      messageId: data.messageId,
    });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log(
      `User disconnected: ${socket.user.fname} ${socket.user.lname} (${socket.userId})`
    );
  });
});

// Start server with HTTP instead of Express
const port = process.env.PORT || 9000;
httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
