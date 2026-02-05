import express from "express";
const router = express.Router();
import { registerUser, loginUser, logoutUser, getCurrentUser, refreshToken } from "../controllers/authController.js";

// Registration route
router.post("/register", registerUser);

// Login route
router.post("/login", loginUser);

// Logout route
router.post("/logout", logoutUser);

// Get current user
router.get("/me", getCurrentUser);

// Refresh token
router.post("/refresh-token", refreshToken);

export default router;
