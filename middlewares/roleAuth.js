import User from "../models/user.js";

// Role-based authorization middleware
export const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.auth._id);
      
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Check if user's role is in the allowed roles
      if (!roles.includes(user.role)) {
        return res.status(403).json({ 
          error: "Access denied. Insufficient permissions.",
          required: roles,
          current: user.role
        });
      }

      // Add user role to request for use in controllers
      req.userRole = user.role;
      req.user = user;
      
      next();
    } catch (error) {
      console.log("Role auth error:", error);
      return res.status(500).json({ error: "Server error in role authorization" });
    }
  };
};

// Admin only middleware
export const requireAdmin = requireRole(['admin']);

// Business and Admin middleware
export const requireBusinessOrAdmin = requireRole(['business', 'admin']);

// User, Business, and Admin middleware (all authenticated users)
export const requireUser = requireRole(['user', 'business', 'admin']);

// Business verification middleware
export const requireVerifiedBusiness = async (req, res, next) => {
  try {
    const user = await User.findById(req.auth._id);
    
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (user.role !== 'business') {
      return res.status(403).json({ error: "Access denied. Business account required." });
    }

    if (!user.businessInfo || !user.businessInfo.isVerified) {
      return res.status(403).json({ 
        error: "Access denied. Business account must be verified.",
        verificationRequired: true
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.log("Business verification error:", error);
    return res.status(500).json({ error: "Server error in business verification" });
  }
};

