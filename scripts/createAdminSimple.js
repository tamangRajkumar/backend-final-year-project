import mongoose from "mongoose";
import User from "../models/user.js";
import bcrypt from "bcrypt";

const createAdmin = async () => {
  try {
    // Connect to MongoDB (replace with your actual MongoDB connection string)
    const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/finalYearProject";
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: "admin@gmail.com" });
    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log("Email: admin@gmail.com");
      console.log("Password: admin");
      console.log("Role: admin");
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
    console.log("🌐 Dashboard: /dashboard/admin");

  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

// Run the script
createAdmin();
