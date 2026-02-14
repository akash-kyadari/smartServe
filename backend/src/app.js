import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

import authRouter from "./routers/authRouter.js";
import restaurantRouter from "./routers/restaurantRouter.js";
import orderRouter from "./routers/orderRouter.js";
import bookingRouter from "./routers/bookingRouter.js";
import connectDB from "./db.js";
import { app, server } from "./socket/socket.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import passport from "./utils/passport.js";

dotenv.config();

// Connect to MongoDB
connectDB();

// Security Middleware
app.use(helmet());
app.use(compression());

// Core Middleware (CORS must be first to handle preflights and errors correctly)
app.use(cors({
  origin: [process.env.FRONTEND_URL, "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// Rate Limiting (10 requests per 1 min)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later."
});
app.use("/api", limiter); // Apply only to API routes

// Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
});

// Root Route
app.get("/", (req, res) => {
  res.send("Smart Restro API is running...");
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/restaurants", restaurantRouter);
app.use("/api/orders", orderRouter);
app.use("/api/bookings", bookingRouter);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
