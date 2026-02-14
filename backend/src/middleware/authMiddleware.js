import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const protect = async (req, res, next) => {
    try {
        let token;

        if (req.cookies.jwt) {
            token = req.cookies.jwt;
        } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");

            req.user = await User.findById(decoded.id).select("-password"); // removed extra line

            if (!req.user) {
                return res.status(401).json({ message: "Not authorized, user not found" });
            }

            next();
        } catch (error) {
            console.error("JWT Verification failed:", error.message);
            // Clear the cookie if it's invalid
            if (req.cookies.jwt) {
                res.clearCookie("jwt");
            }
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error in auth middleware" });
    }
};

// Middleware to restrict access to specific roles
export const authorize = (...roles) => {
    return (req, res, next) => {
        // Validation: Ensure req.user and req.user.roles exist
        if (!req.user || !req.user.roles || !Array.isArray(req.user.roles)) {
            console.error("Access Denied: User has no roles or invalid role structure.", req.user?._id);
            return res.status(403).json({ message: "Access Denied: User roles not found." });
        }

        // req.user.roles is an array of roles. Check if user has at least one of the allowed roles.
        const hasRole = req.user.roles.some(role => roles.includes(role));

        if (!hasRole) {
            return res.status(403).json({ message: `Access Denied: Your role (${req.user.roles.join(', ')}) is not authorized.` });
        }
        next();
    };
};

export const optionalProtect = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return next(); // Proceed without user
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");
            req.user = await User.findById(decoded.id).select("-password");
            // If user not found, just proceed without req.user
            next();
        } catch (error) {
            // Token invalid or expired, proceed without user (treat as guest)
            console.error("Optional Protect: Token failed verification", error.message);
            if (req.cookies.jwt) {
                res.clearCookie("jwt");
            }
            next();
        }
    } catch (error) {
        console.error(error);
        next();
    }
};
