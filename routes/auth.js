import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

//import middlewares
import { requireSignin } from "../middlewares/auth.js";

// import controllers
import { signUp, logIn, updateUserProfile } from "../controllers/auth.js";
import { uploadImage } from "../controllers/post.js";


router.post("/auth/signup", signUp);
router.post("/auth/login", logIn);
router.put("/update-user-profile", requireSignin, updateUserProfile);

// Upload image (no auth required for signup)
router.post("/upload-image", upload.single('file'), uploadImage);


export default router;
