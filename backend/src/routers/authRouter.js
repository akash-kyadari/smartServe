import express from "express";
const router = express.Router();
import { registerUser, loginUser, logoutUser, getCurrentUser } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRegister, validateLogin } from "../middleware/validator.js";

// Registration route
router.post("/register", validateRegister, registerUser);

// Login route
router.post("/login", validateLogin, loginUser);

// Logout route
router.post("/logout", logoutUser);

// Get current user
router.get("/me", protect, getCurrentUser);


export default router;
