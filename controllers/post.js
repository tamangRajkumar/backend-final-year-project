import Post from "../models/post";
import User from "../models/user";
import cloudinary from "cloudinary";
console.log("cloudinary key", process.env.CLOUDINARY_NAME);

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_NAME || "demo",
//   api_key: process.env.CLOUDINARY_KEY || "demo",
//   api_secret: process.env.CLOUDINARY_SECRET || "demo",
// });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME || "dsynpfcpm" || "demo",
  api_key: process.env.CLOUDINARY_KEY || "734459153853134" || "demo",
  api_secret:
    process.env.CLOUDINARY_SECRET || "dELPoFvpXI0c3SLFIuCAslnPf4s" || "demo",
});

// Upload Image to cloudinary and response back image url and public id
export const uploadImage = async (req, res) => {
  try {
    console.log("Upload request received");
    console.log("req.file:", req.file);

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const imagePath = req.file.path;
    console.log("Image path:", imagePath);

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(
      imagePath
      //    {
      //   folder: "final-year-project",
      //   resource_type: "auto",
      // }
    );

    console.log("Upload successful:", result.secure_url);

    res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Image upload failed",
      error: error.message,
    });
  }
};

// create post submit to database
export const createPost = (req, res) => {
  // console.log(req.body);
  console.log(req.auth._id);
  const { description, category, image } = req.body;
  // console.log(description, image)
  if (!description.length) {
    return res.json({
      error: "Description is needed",
    });
  }
  try {
    const post = new Post({
      description,
      category,
      image,
      postedBy: req.auth._id,
    });
    post.save();
    return res.json({
      saved: "true",
      post,
    });
  } catch (error) {
    console.log("Error=> ", error);
  }
};

// Fetch user post in dashboard
export const userPosts = async (req, res) => {
  // console.log(req.auth);
  try {
    const posts = await Post.find({ postedBy: req.auth._id })
      .populate("postedBy", "_id fname lname userProfileImage")
      .sort({ createdAt: -1 })
      .limit(10);
    console.log(posts);
    return res.json(posts);
  } catch (error) {
    console.log("Error=>", error);
  }
};

//Fetch individual post
export const fetchIndividualPost = async (req, res) => {
  // const userId = req.auth._id;
  // console.log("user id is=>", userId);

  //
  try {
    const postId = req.params._id;
    // console.log(postId);

    const post = await Post.findById(postId)
      .populate("postedBy", "_id fname lname userProfileImage email ")
      .populate("comments.postedBy", "_id fname lname userProfileImage ");

    // console.log("User found", user);
    console.log(post);
    const jsonD = res.json(post);
    return jsonD;
  } catch (error) {
    console.log("Error=> ", error);
  }
};

// Fetch All user posts in News Feed
export const fetchAllUsersPosts = async (req, res) => {
  // console.log(req.auth);
  console.log(req.params.category);
  try {
    const category = req.params.category;
    const posts = await Post.find({ "category.post": "user_post" })
      .populate("postedBy", "_id fname lname userProfileImage")
      .sort({ createdAt: -1 })
      .limit(10);
    console.log(posts);
    return res.json(posts);
  } catch (error) {
    console.log("Error=>", error);
  }
};

// Submit Post Comment
export const submitPostComment = async (req, res) => {
  const userId = req.auth._id;
  // console.log(req.body.addComment)
  const comment = req.body.addComment;
  console.log(comment);
  const postId = req.body.postId;
  // console.log(req.body);
  // console.log(comment.length);
  if (comment.length == 0) {
    return res.status(400).send("Comment is required");
  }
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: {
            text: comment,
            postedBy: userId,
          },
        },
      },
      { new: true }
    )
      .populate("postedBy", "_id fname lname userProfileImage ")
      .populate("comments.postedBy", "_id fname lname userProfileImage");

    console.log(updatedPost);
    return res.json({ commentPosted: "true", updatedPost });
  } catch (error) {
    console.log("Error=> ", error);
  }
};

// Delete Post Comment
export const deletePostComment = async (req, res) => {
  // console.log(req.body);
  const { postId, commentId } = req.body;

  try {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: {
          comments: {
            _id: commentId,
          },
        },
      },
      { new: true }
    ).populate("comments.postedBy", "_id fname lname userProfileImage");

    console.log("post=>", post);

    const postComments = post.comments;
    console.log(postComments);
    return res.json({ postCommentDeleted: "true", postComments });
  } catch (error) {
    console.log("Error=> ", error);
  }
};

// Post Comments Data Only
export const postCommentsDataOnly = async (req, res) => {
  // console.log(req.body);
  const { postId } = req.body;
  // console.log(postId);
  try {
    const post = await Post.findById(postId).populate(
      "comments.postedBy",
      "_id fname lname image"
    );
    // console.log(post.comments);
    return res.json(post.comments);
  } catch (error) {
    console.log("Error=> ", error);
  }
};

//post liked
export const postLiked = async (req, res) => {
  // console.log(req.body);
  const { postId } = req.body;
  // console.log(postId);
  try {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $addToSet: {
          likes: req.auth._id,
        },
      },
      { new: true }
    );
    // console.log(post);
    return res.json({ postLiked: "true", post });
  } catch (error) {
    console.log("Error=> ", error);
  }
};

//post unliked
export const postUnliked = async (req, res) => {
  // console.log(req.body);
  const { postId } = req.body;
  // console.log(postId);
  try {
    const post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: {
          likes: req.auth._id,
        },
      },
      { new: true }
    );
    // console.log(post);
    return res.json({ postUnliked: "true", post });
  } catch (error) {
    console.log("Error=> ", error);
  }
};

//fetch all users
export const fetchAllUsers = async (req, res) => {
  // console.log(req.auth);
  try {
    const users = await User.find().select(
      "_id fname lname email userProfileImage"
    );
    console.log(users);
    return res.json(users);
  } catch (error) {
    console.log("Error=>", error);
  }
};
