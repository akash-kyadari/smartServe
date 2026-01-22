const express = require("express");
const router = express.Router();
const authController = require("../controllers/authConroller");

// Registration route
router.post("/register", authController.register);

// Login route
router.post("/login", authController.login);

// Logout route
router.post("/logout", authController.logout);

// Get current user
router.get("/me", authController.getCurrentUser);

// Refresh token
router.post("/refresh-token", authController.refreshToken);

module.exports = router;
