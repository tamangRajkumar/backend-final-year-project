import User from "../models/user.js";
import jwt from "jsonwebtoken";
import { hashPassword, comparePassword } from "../helpers/auth.js";

//sign up user
export const signUp = async (req, res) => {
  console.log(req.body);
  const {
    fname,
    lname,
    country,
    gender,
    email,
    password,
    role,
    businessInfo,
    kycInfo,
    userProfileImage,
    userCoverImage,
    favoritePostsList,
  } = req.body;

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
  if (!role) {
    return res.status(400).send("Account type is required");
  }
  if (!password || password.length < 4) {
    return res
      .status(400)
      .send("Password is required and should be min 4 characters long");
  }

  // KYC validation
  if (!kycInfo || !kycInfo.documentType) {
    return res.status(400).send("KYC document type is required");
  }
  if (!kycInfo.documentNumber) {
    return res.status(400).send("KYC document number is required");
  }
  if (!kycInfo.documentImage || !kycInfo.documentImage.url) {
    return res.status(400).send("KYC document image is required");
  }

  // Additional validation for business accounts
  if (role === "business" && businessInfo) {
    if (!businessInfo.businessName) {
      return res
        .status(400)
        .send("Business name is required for business accounts");
    }
    if (!businessInfo.businessType) {
      return res
        .status(400)
        .send("Business type is required for business accounts");
    }
  }

  //check for existing user
  const exist = await User.findOne({ email });
  if (exist) {
    return res.status(400).send("Email already exist");
  }

  //hash password
  const hashedPassword = await hashPassword(password);

  //register
  const userData = {
    fname,
    lname,
    country,
    gender,
    email,
    password: hashedPassword,
    role,
    kycInfo: {
      documentType: kycInfo.documentType,
      documentNumber: kycInfo.documentNumber,
      documentImage: kycInfo.documentImage,
      isVerified: false, // Default to unverified
    },
    userProfileImage,
    userCoverImage,
    favoritePostsList,
  };

  // Add business info if role is business
  if (role === "business" && businessInfo) {
    userData.businessInfo = businessInfo;
  }

  const user = new User(userData);

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

  // Check KYC verification status
  if (!user.kycInfo || !user.kycInfo.isVerified) {
    return res
      .status(403)
      .send(
        "Your account is pending KYC verification. Please wait for admin approval."
      );
  }
  const token = jwt.sign(
    { _id: user._id },
    // process.env.JWT_SECRET || 
    "dskfjjnasnfgh762@#@#dqffsadfsa7hghgh",
    {
      expiresIn: "7D",
    }
  );

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
