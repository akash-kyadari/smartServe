import express from "express";
const router = express.Router();
import { register, login, logout, getCurrentUser, refreshToken } from "../controllers/authController.js";

// Registration route
router.post("/register", register);

// Login route
router.post("/login", login);

// Logout route
router.post("/logout", logout);

// Get current user
router.get("/me", getCurrentUser);

// Refresh token
router.post("/refresh-token", refreshToken);

export default router;
