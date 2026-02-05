import express from "express";
const router = express.Router();
import { registerUser, loginUser, logoutUser, getCurrentUser } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

// Registration route
router.post("/register", registerUser);

// Login route
router.post("/login", loginUser);

// Logout route
router.post("/logout", logoutUser);

// Get current user
router.get("/me", protect, getCurrentUser);


export default router;
