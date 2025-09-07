import Post from "../models/post.js";
import User from "../models/user.js";
import Event from "../models/event.js";

// Get featured content for homepage
export const getFeaturedContent = async (req, res) => {
  try {
    const limit = 10;

    // Get featured proposals (business proposals only)
    const featuredProposals = await Post.find({
      postType: 'business_proposal',
      isActive: true,
      isFeatured: true
    })
    .populate('postedBy', 'fname lname email userProfileImage businessInfo')
    .populate('likes', 'fname lname')
    .populate('comments.postedBy', 'fname lname userProfileImage')
    .sort({ featuredAt: -1, createdAt: -1 })
    .limit(limit);

    // Get featured businesses
    const featuredBusinesses = await User.find({
      role: 'business',
      isFeatured: true,
      'kycInfo.isVerified': true,
      'businessInfo.isVerified': true
    })
    .select('fname lname email userProfileImage businessInfo featuredAt')
    .sort({ featuredAt: -1, createdAt: -1 })
    .limit(limit);

    // Get featured events
    const featuredEvents = await Event.find({
      isActive: true,
      isPublished: true,
      isFeatured: true
    })
    .populate('organizer', 'fname lname email userProfileImage businessInfo')
    .populate('likes', 'fname lname')
    .populate('comments.postedBy', 'fname lname userProfileImage')
    .sort({ featuredAt: -1, startDate: 1 })
    .limit(limit);

    res.json({
      success: true,
      data: {
        featuredProposals,
        featuredBusinesses,
        featuredEvents
      }
    });

  } catch (error) {
    console.error("Error fetching featured content:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching featured content",
      error: error.message
    });
  }
};

// Toggle featured status for proposals
export const toggleFeaturedProposal = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.auth._id;

    // Check if user is admin
    const user = await User.findById(userId);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admins can manage featured content"
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    if (post.postType !== 'business_proposal') {
      return res.status(400).json({
        success: false,
        message: "Only business proposals can be featured"
      });
    }

    // Toggle featured status
    post.isFeatured = !post.isFeatured;
    if (post.isFeatured) {
      post.featuredAt = new Date();
    } else {
      post.featuredAt = null;
    }

    await post.save();

    res.json({
      success: true,
      message: `Proposal ${post.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: {
        isFeatured: post.isFeatured,
        featuredAt: post.featuredAt
      }
    });

  } catch (error) {
    console.error("Error toggling featured proposal:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling featured proposal",
      error: error.message
    });
  }
};

// Toggle featured status for businesses
export const toggleFeaturedBusiness = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.auth._id;

    // Check if user is admin
    const admin = await User.findById(adminId);
    if (admin.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admins can manage featured content"
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (user.role !== 'business') {
      return res.status(400).json({
        success: false,
        message: "Only business accounts can be featured"
      });
    }

    if (!user.kycInfo || !user.kycInfo.isVerified || !user.businessInfo || !user.businessInfo.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Business must be verified to be featured"
      });
    }

    // Toggle featured status
    user.isFeatured = !user.isFeatured;
    if (user.isFeatured) {
      user.featuredAt = new Date();
    } else {
      user.featuredAt = null;
    }

    await user.save();

    res.json({
      success: true,
      message: `Business ${user.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: {
        isFeatured: user.isFeatured,
        featuredAt: user.featuredAt
      }
    });

  } catch (error) {
    console.error("Error toggling featured business:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling featured business",
      error: error.message
    });
  }
};

// Toggle featured status for events
export const toggleFeaturedEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.auth._id;

    // Check if user is admin
    const user = await User.findById(userId);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admins can manage featured content"
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found"
      });
    }

    if (!event.isPublished) {
      return res.status(400).json({
        success: false,
        message: "Only published events can be featured"
      });
    }

    // Toggle featured status
    event.isFeatured = !event.isFeatured;
    if (event.isFeatured) {
      event.featuredAt = new Date();
    } else {
      event.featuredAt = null;
    }

    await event.save();

    res.json({
      success: true,
      message: `Event ${event.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      data: {
        isFeatured: event.isFeatured,
        featuredAt: event.featuredAt
      }
    });

  } catch (error) {
    console.error("Error toggling featured event:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling featured event",
      error: error.message
    });
  }
};

// Get all featured content for admin management
export const getAllFeaturedContent = async (req, res) => {
  try {
    const userId = req.auth._id;

    // Check if user is admin
    const user = await User.findById(userId);
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only admins can view featured content management"
      });
    }

    // Get all featured proposals
    const featuredProposals = await Post.find({
      postType: 'business_proposal',
      isActive: true,
      isFeatured: true
    })
    .populate('postedBy', 'fname lname email userProfileImage businessInfo')
    .sort({ featuredAt: -1 });

    // Get all featured businesses
    const featuredBusinesses = await User.find({
      role: 'business',
      isFeatured: true
    })
    .select('fname lname email userProfileImage businessInfo featuredAt')
    .sort({ featuredAt: -1 });

    // Get all featured events
    const featuredEvents = await Event.find({
      isActive: true,
      isFeatured: true
    })
    .populate('organizer', 'fname lname email userProfileImage businessInfo')
    .sort({ featuredAt: -1 });

    res.json({
      success: true,
      data: {
        featuredProposals,
        featuredBusinesses,
        featuredEvents
      }
    });

  } catch (error) {
    console.error("Error fetching all featured content:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching all featured content",
      error: error.message
    });
  }
};
