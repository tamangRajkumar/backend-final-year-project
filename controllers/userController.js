import User from "../models/user.js";

// Get all users with pagination
export const getAllUsers = async (req, res) => {
  try {
    console.log("getAllUsers called with query:", req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role; // Filter by role if provided
    const search = req.query.search; // Search by name or email
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { fname: { $regex: search, $options: 'i' } },
        { lname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'businessInfo.businessName': { $regex: search, $options: 'i' } },
        { 'businessInfo.businessType': { $regex: search, $options: 'i' } },
        { 'businessInfo.businessDescription': { $regex: search, $options: 'i' } },
        { goals: { $in: [new RegExp(search, 'i')] } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Get total count
    const totalUsers = await User.countDocuments(query);
    
    // Get users with pagination
    const users = await User.find(query)
      .select('-password') // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching users",
      error: error.message
    });
  }
};

// Get all businesses with pagination
export const getAllBusinesses = async (req, res) => {
  try {
    console.log("getAllBusinesses called with query:", req.query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search; // Search by business name or email
    const verified = req.query.verified; // Filter by verification status
    const skip = (page - 1) * limit;

    // Build query
    let query = { role: 'business' };
    
    if (search) {
      query.$or = [
        { fname: { $regex: search, $options: 'i' } },
        { lname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'businessInfo.businessName': { $regex: search, $options: 'i' } },
        { 'businessInfo.businessType': { $regex: search, $options: 'i' } },
        { 'businessInfo.businessDescription': { $regex: search, $options: 'i' } },
        { goals: { $in: [new RegExp(search, 'i')] } },
        { skills: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (verified !== undefined) {
      query['businessInfo.isVerified'] = verified === 'true';
    }

    // Get total count
    const totalBusinesses = await User.countDocuments(query);
    
    // Get businesses with pagination
    const businesses = await User.find(query)
      .select('-password') // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalBusinesses / limit);

    res.json({
      success: true,
      data: businesses,
      pagination: {
        currentPage: page,
        totalPages,
        totalBusinesses,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error("Error fetching businesses:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching businesses",
      error: error.message
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message
    });
  }
};

// Update user role (Admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'business', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Must be 'user', 'business', or 'admin'"
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "User role updated successfully",
      data: user
    });

  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      success: false,
      message: "Error updating user role",
      error: error.message
    });
  }
};

// Verify business (Admin only)
export const verifyBusiness = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { 'businessInfo.isVerified': isVerified },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Business not found"
      });
    }

    if (user.role !== 'business') {
      return res.status(400).json({
        success: false,
        message: "User is not a business account"
      });
    }

    res.json({
      success: true,
      message: `Business ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: user
    });

  } catch (error) {
    console.error("Error verifying business:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying business",
      error: error.message
    });
  }
};

// Get pending KYC verifications (Admin only)
export const getPendingKYC = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role; // Filter by role if provided
    const skip = (page - 1) * limit;

    // Build query for users with unverified KYC
    let query = {
      'kycInfo.isVerified': false,
      'kycInfo.documentImage.url': { $exists: true, $ne: null }
    };
    
    if (role) {
      query.role = role;
    }

    // Get total count
    const totalUsers = await User.countDocuments(query);
    
    // Get users with pagination
    const users = await User.find(query)
      .select('-password') // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error("Error fetching pending KYC:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching pending KYC verifications",
      error: error.message
    });
  }
};

// Verify KYC (Admin only)
export const verifyKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified, rejectionReason } = req.body;
    const adminId = req.auth._id;

    const updateData = {
      'kycInfo.isVerified': isVerified,
      'kycInfo.verifiedBy': adminId,
      'kycInfo.verifiedAt': new Date()
    };

    if (!isVerified && rejectionReason) {
      updateData['kycInfo.rejectionReason'] = rejectionReason;
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.kycInfo || !user.kycInfo.documentImage) {
      return res.status(400).json({
        success: false,
        message: "User has not submitted KYC documents"
      });
    }

    res.json({
      success: true,
      message: `KYC ${isVerified ? 'verified' : 'rejected'} successfully`,
      data: user
    });

  } catch (error) {
    console.error("Error verifying KYC:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying KYC",
      error: error.message
    });
  }
};

// Delete user (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentAdmin = req.auth._id;

    // Prevent admin from deleting themselves
    if (id === currentAdmin) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account"
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent deleting other admins (optional security measure)
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: "Cannot delete admin accounts"
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "User deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting user",
      error: error.message
    });
  }
};

// Unverify KYC (Admin only)
export const unverifyKYC = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.auth._id;

    const user = await User.findByIdAndUpdate(
      id,
      {
        'kycInfo.isVerified': false,
        'kycInfo.verifiedBy': adminId,
        'kycInfo.verifiedAt': new Date(),
        'kycInfo.rejectionReason': 'KYC verification revoked by admin'
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "KYC verification revoked successfully",
      data: user
    });

  } catch (error) {
    console.error("Error unverifying KYC:", error);
    res.status(500).json({
      success: false,
      message: "Error unverifying KYC",
      error: error.message
    });
  }
};

// Update user goals and skills
export const updateGoalsAndSkills = async (req, res) => {
  try {
    console.log("updateGoalsAndSkills called");
    const userId = req.auth._id;
    const { goals, skills } = req.body;
    console.log("User ID:", userId);
    console.log("Goals received:", goals);
    console.log("Skills received:", skills);

    // Validate input
    if (!Array.isArray(goals) || !Array.isArray(skills)) {
      return res.status(400).json({
        success: false,
        message: "Goals and skills must be arrays"
      });
    }

    // Validate each goal and skill
    const validGoals = goals.filter(goal => 
      typeof goal === 'string' && goal.trim().length > 0 && goal.trim().length <= 100
    );
    
    const validSkills = skills.filter(skill => 
      typeof skill === 'string' && skill.trim().length > 0 && skill.trim().length <= 50
    );

    // Limit number of goals and skills
    if (validGoals.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 goals allowed"
      });
    }

    if (validSkills.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Maximum 20 skills allowed"
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        goals: validGoals,
        skills: validSkills
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "Goals and skills updated successfully",
      data: {
        goals: user.goals,
        skills: user.skills
      }
    });

  } catch (error) {
    console.error("Error updating goals and skills:", error);
    res.status(500).json({
      success: false,
      message: "Error updating goals and skills",
      error: error.message
    });
  }
};

// Get user goals and skills
export const getGoalsAndSkills = async (req, res) => {
  try {
    console.log("getGoalsAndSkills called");
    const userId = req.auth._id;
    console.log("User ID:", userId);

    const user = await User.findById(userId).select('goals skills');
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log("Goals:", user.goals);
    console.log("Skills:", user.skills);

    res.json({
      success: true,
      data: {
        goals: user.goals || [],
        skills: user.skills || []
      }
    });

  } catch (error) {
    console.error("Error fetching goals and skills:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching goals and skills",
      error: error.message
    });
  }
};
