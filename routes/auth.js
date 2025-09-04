import express from "express";

const router = express.Router();

//import middlewares
import { requireSignin } from "../middlewares/auth";

// import controllers
import { signUp, logIn, updateUserProfile } from "../controllers/auth";


router.post("/auth/signup", signUp);
router.post("/auth/login", logIn);
router.put("/update-user-profile", requireSignin, updateUserProfile);


module.exports = router;
