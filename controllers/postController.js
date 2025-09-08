import Post from "../models/post.js";
import User from "../models/user.js";
import mongoose from "mongoose";

// Ensure User model is registered
const ensureUserModel = () => {
  if (!mongoose.models.User) {
    const userSchema = new mongoose.Schema({
      fname: String,
      lname: String,
      email: String,
      role: String,
      userProfileImage: {
        url: String,
        public_id: String
      },
      businessInfo: {
        businessName: String,
        businessType: String,
        businessDescription: String,
        businessWebsite: String,
        businessPhone: String,
        businessAddress: String
      }
    });
    mongoose.model("User", userSchema);
  }
};

// Create a new post
export const createPost = async (req, res) => {
  try {
    const { title, description, category, postType, image, tags, businessProposal } = req.body;
    const postedBy = req.auth._id;

    // Validation
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, description, and category are required"
      });
    }

    // Check if user exists and is verified
    const user = await User.findById(postedBy);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.kycInfo || !user.kycInfo.isVerified) {
      return res.status(403).json({
        success: false,
        message: "You must be KYC verified to create posts"
      });
    }

    // For business proposals, validate business role
    if (postType === 'business_proposal' && user.role !== 'business') {
      return res.status(403).json({
        success: false,
        message: "Only business accounts can create business proposals"
      });
    }

    // For business proposals, validate required fields
    if (postType === 'business_proposal') {
      if (!businessProposal || !businessProposal.industry || !businessProposal.partnershipType) {
        return res.status(400).json({
          success: false,
          message: "Business proposal requires industry and partnership type"
        });
      }
    }

    const postData = {
      title,
      description,
      category,
      postType: postType || 'normal',
      postedBy,
      image: image || null,
      tags: tags || [],
      isActive: true
    };

    // Add business proposal data if it's a business proposal
    if (postType === 'business_proposal') {
      postData.businessProposal = {
        ...businessProposal,
        isActive: true,
        interestedParties: []
      };
    }

    const post = new Post(postData);
    await post.save();

    // Populate the postedBy field
    await post.populate('postedBy', 'fname lname email role userProfileImage businessInfo');

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post
    });

  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({
      success: false,
      message: "Error creating post",
      error: error.message
    });
  }
};

// Get all posts with pagination and filtering
// Get all posts with pagination and filtering
export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const postType = req.query.postType; // 'normal' or 'business_proposal'
    const category = req.query.category;
    const search = req.query.search;
    const skip = (page - 1) * limit;

    // Build query
    let query = { isActive: true };

    if (postType) {
      query.postType = postType;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Get total count
    const totalPosts = await Post.countDocuments(query);

    // Get posts with pagination + populate
    const posts = await Post.find(query)
      .populate("postedBy", "fname lname email role userProfileImage businessInfo")
      .populate("likes", "fname lname")
      .populate("comments.postedBy", "fname lname userProfileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      success: true,
      data: posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
      error: error.message,
    });
  }
};


// Get posts by user
export const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const postType = req.query.postType;
    const skip = (page - 1) * limit;

    let query = { postedBy: userId, isActive: true };
    
    if (postType) {
      query.postType = postType;
    }

    const totalPosts = await Post.countDocuments(query);
    
    const posts = await Post.find(query)
      .populate('postedBy', 'fname lname email role userProfileImage businessInfo')
      .populate('likes', 'fname lname')
      .populate('comments.postedBy', 'fname lname userProfileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalPosts / limit);

    res.json({
      success: true,
      data: posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit
      }
    });

  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user posts",
      error: error.message
    });
  }
};

// Get single post by ID
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id)
      .populate('postedBy', 'fname lname email role userProfileImage businessInfo')
      .populate('likes', 'fname lname userProfileImage')
      .populate('comments.postedBy', 'fname lname userProfileImage')
      .populate('businessProposal.interestedParties.user', 'fname lname email businessInfo');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    res.json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post",
      error: error.message
    });
  }
};

// Update post
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, image, tags, businessProposal } = req.body;
    const userId = req.auth._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user owns the post
    if (post.postedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own posts"
      });
    }

    // Update fields
    if (title) post.title = title;
    if (description) post.description = description;
    if (category) post.category = category;
    if (image) post.image = image;
    if (tags) post.tags = tags;
    if (businessProposal && post.postType === 'business_proposal') {
      post.businessProposal = { ...post.businessProposal, ...businessProposal };
    }

    await post.save();

    res.json({
      success: true,
      message: "Post updated successfully",
      data: post
    });

  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({
      success: false,
      message: "Error updating post",
      error: error.message
    });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user owns the post
    if (post.postedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own posts"
      });
    }

    await Post.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Post deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting post",
      error: error.message
    });
  }
};

// Like/Unlike post
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      success: true,
      message: isLiked ? "Post unliked" : "Post liked",
      data: {
        isLiked: !isLiked,
        likesCount: post.likes.length
      }
    });

  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({
      success: false,
      message: "Error toggling like",
      error: error.message
    });
  }
};

// Add comment to post
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.auth._id;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required"
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const comment = {
      text,
      postedBy: userId
    };

    post.comments.push(comment);
    await post.save();

    // Populate the comment
    await post.populate('comments.postedBy', 'fname lname userProfileImage');

    const newComment = post.comments[post.comments.length - 1];

    res.json({
      success: true,
      message: "Comment added successfully",
      data: newComment
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Error adding comment",
      error: error.message
    });
  }
};

// Express interest in business proposal
export const expressInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, contactInfo } = req.body;
    const userId = req.auth._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    if (post.postType !== 'business_proposal') {
      return res.status(400).json({
        success: false,
        message: "This is not a business proposal post"
      });
    }

    // Check if user already expressed interest
    const existingInterest = post.businessProposal.interestedParties.find(
      party => party.user.toString() === userId
    );

    if (existingInterest) {
      return res.status(400).json({
        success: false,
        message: "You have already expressed interest in this proposal"
      });
    }

    const interest = {
      user: userId,
      message: message || '',
      contactInfo: contactInfo || {},
      status: 'pending'
    };

    post.businessProposal.interestedParties.push(interest);
    await post.save();

    res.json({
      success: true,
      message: "Interest expressed successfully",
      data: interest
    });

  } catch (error) {
    console.error("Error expressing interest:", error);
    res.status(500).json({
      success: false,
      message: "Error expressing interest",
      error: error.message
    });
  }
};

// Update interest status (for proposal owner)
export const updateInterestStatus = async (req, res) => {
  try {
    const { id, interestId } = req.params;
    const { status } = req.body;
    const userId = req.auth._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user owns the post
    if (post.postedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update interests for your own proposals"
      });
    }

    const interest = post.businessProposal.interestedParties.id(interestId);
    if (!interest) {
      return res.status(404).json({
        success: false,
        message: "Interest not found"
      });
    }

    interest.status = status;
    await post.save();

    res.json({
      success: true,
      message: "Interest status updated successfully",
      data: interest
    });

  } catch (error) {
    console.error("Error updating interest status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating interest status",
      error: error.message
    });
  }
};

// Register for business proposal
export const registerForProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { eligibilityReason, experience, skills, investmentCapacity, additionalInfo, contactInfo } = req.body;
    const userId = req.auth._id;

    if (!eligibilityReason) {
      return res.status(400).json({
        success: false,
        message: "Eligibility reason is required"
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    if (post.postType !== 'business_proposal') {
      return res.status(400).json({
        success: false,
        message: "This is not a business proposal post"
      });
    }

    // Check if user already registered
    const existingRegistration = post.businessProposal.registeredUsers.find(
      reg => reg.user.toString() === userId
    );

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: "You have already registered for this proposal"
      });
    }

    const registration = {
      user: userId,
      eligibilityReason,
      experience: experience || '',
      skills: skills || [],
      investmentCapacity: investmentCapacity || 'low',
      additionalInfo: additionalInfo || '',
      contactInfo: contactInfo || {},
      status: 'pending'
    };

    post.businessProposal.registeredUsers.push(registration);
    await post.save();

    res.json({
      success: true,
      message: "Registration submitted successfully",
      data: registration
    });

  } catch (error) {
    console.error("Error registering for proposal:", error);
    res.status(500).json({
      success: false,
      message: "Error registering for proposal",
      error: error.message
    });
  }
};

// Get registered users for a proposal (for proposal owner)
export const getRegisteredUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth._id;

    const post = await Post.findById(id)
      .populate('businessProposal.registeredUsers.user', 'fname lname email userProfileImage businessInfo');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user owns the post
    if (post.postedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only view registrations for your own proposals"
      });
    }

    res.json({
      success: true,
      data: post.businessProposal.registeredUsers
    });

  } catch (error) {
    console.error("Error fetching registered users:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching registered users",
      error: error.message
    });
  }
};

// Update registration status (for proposal owner)
export const updateRegistrationStatus = async (req, res) => {
  try {
    const { id, registrationId } = req.params;
    const { status } = req.body;
    const userId = req.auth._id;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Check if user owns the post
    if (post.postedBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only update registrations for your own proposals"
      });
    }

    const registration = post.businessProposal.registeredUsers.id(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found"
      });
    }

    registration.status = status;
    await post.save();

    res.json({
      success: true,
      message: "Registration status updated successfully",
      data: registration
    });

  } catch (error) {
    console.error("Error updating registration status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating registration status",
      error: error.message
    });
  }
};
