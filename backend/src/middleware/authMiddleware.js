import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key");

            // Select passes object fields to include/exclude. -password excludes password.
            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({ message: "Not authorized, user not found" });
            }

            next();
        } catch (error) {
            console.error(error);
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
        // req.user.roles is an array of roles. Check if user has at least one of the allowed roles.
        const hasRole = req.user.roles.some(role => roles.includes(role));

        if (!hasRole) {
            return res.status(403).json({ message: `User roles ${req.user.roles.join(', ')} do not have authorization to access this route` });
        }
        next();
    };
};
