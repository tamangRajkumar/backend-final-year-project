import express from "express";
import formidable from "express-formidable";

const router = express.Router();

//import middlewares
import { requireSignin } from "../middlewares/auth";

// import controllers
import {
  uploadImage,
  createPost,
  userPosts,
  fetchIndividualPost,
  fetchAllUsersPosts,
  submitPostComment,
  deletePostComment,
  postCommentsDataOnly,
  postLiked,
  postUnliked,
  fetchAllUsers
} from "../controllers/post";

router.post("/upload-image", formidable(20 * 1024 * 1024), uploadImage);
router.post("/create-post", requireSignin, createPost);
router.get("/user-posts", requireSignin, userPosts);
router.get("/fetchindividualpost/:_id", fetchIndividualPost);
router.get("/fetch-all-users-posts/:category", fetchAllUsersPosts);
router.post("/submit-post-comment", requireSignin, submitPostComment);
router.put("/delete-post-comment", requireSignin, deletePostComment);
router.post("/post-comments-data", requireSignin, postCommentsDataOnly);
router.put("/post-liked", requireSignin, postLiked);
router.put("/post-unliked", requireSignin, postUnliked);
router.get("/fetch-all-users", fetchAllUsers);

module.exports = router;
