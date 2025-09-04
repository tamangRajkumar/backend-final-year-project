import User from "../models/user.js";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../helpers/auth.js";

//sign up user
export const signUp = async (req, res) => {
  console.log(req.body);
  const { fname, lname, country, gender, email, password,userProfileImage,userCoverImage, favoritePostsList } = req.body;
  //validation
  if (!fname) {
    return res.status(400).send("First name is required");
  }
  if (!lname) {
    return res.status(400).send("Last name is required");
  }
  if (!country) {
    return res.status(400).send("Country name is required");
  }
  if (!gender) {
    return res.status(400).send("Gender is required");
  }
  if (!password || password.length < 6) {
    return res
      .status(400)
      .send("Password is required and should be min 6 characters long");
  }

  //check for existing user
  const exist = await User.findOne({ email });
  if (exist) {
    return res.status(400).send("Email already exist");
  }
  //hash password
  const hashedPassword = await hashPassword(password);
  //register
  const user = new User({
    fname,
    lname,
    country, 
    gender,
    email,
    password: hashedPassword,
    userProfileImage,
    userCoverImage,
    favoritePostsList,
  });
  try {
    await user.save();
    console.log("USER CREATED", user);
    return res.json({ ok: true });
  } catch (err) {
    console.log("CREATE USER FAILED", err);
    return res.status(400).send("Error. Try again.");
  }
};

//log in user
export const logIn = async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).send("Email is required");
  }
  if (!password) {
    return res.status(400).send("Password is required");
  }
  
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).send("Email not found");
  }
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    return res.status(400).send("Password is incorrect");
  }
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7D",
  });

  user.password = undefined;
  try {
    return res.json({
      ok: "true",
      token,
      user,
    });
  } catch (error) {
    return res.status(400).send(error);
  }
};




// Update User Profile
export const updateUserProfile = async (req, res) => {
  // console.log(req.body);
  const userImageData = req.body.userProfileImage;
  console.log(userImageData);
  const userId = req.auth._id;
  console.log(req.auth._id);
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { userProfileImage: userImageData },
      {
        new: true,
      }
    );
    user.password = undefined;
    // console.log(user);
    // const userProfileImageData = user.image;
    return res.json({
      profileImageUpdate: "true",
      user,
    });
  } catch (error) {
    console.log("Error=> ", error);
  }
 
};
