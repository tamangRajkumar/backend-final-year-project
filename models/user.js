import mongoose from "mongoose";
import { Schema } from "mongoose";

const userSchema = new Schema(
  {
    fname: {
      type: String,
      required: true,
    },
    lname: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      min: 8,
      max: 64,
    },
    favoritePostsList: [{ post: {} }],
    about: {},
    userProfileImage: {
      url: String,
      public_id: String,
    },
    userCoverImage: {
      url: String,
      public_id: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
