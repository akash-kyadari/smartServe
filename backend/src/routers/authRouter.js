import express from "express";
const router = express.Router();
import { registerUser, loginUser, logoutUser, getCurrentUser, googleAuthCallback } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateRegister, validateLogin } from "../middleware/validator.js";
import passport from "passport";

// Registration route
router.post("/register", validateRegister, registerUser);

// Login route
router.post("/login", validateLogin, loginUser);

// Logout route
router.post("/logout", logoutUser);

// Get current user
router.get("/me", protect, getCurrentUser);

// Google Auth routes
router.get("/google", (req, res, next) => {
    const { from } = req.query;
    const state = from ? Buffer.from(JSON.stringify({ from })).toString("base64") : undefined;
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
        state
    })(req, res, next);
});

router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login", session: false }), googleAuthCallback);

export default router;
