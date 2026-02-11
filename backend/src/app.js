import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routers/authRouter.js";
import restaurantRouter from "./routers/restaurantRouter.js";
import orderRouter from "./routers/orderRouter.js";
import connectDB from "./db.js";
import { app, server } from "./socket/socket.js"; // Import initialized app and server

dotenv.config();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  res.send("Smart Restro API is running...");
});

// Auth routes
app.use("/api/auth", authRouter);
app.use("/api/restaurants", restaurantRouter);
// Order routes
// Order routes
app.use("/api/orders", orderRouter);
// Booking routes
import bookingRouter from "./routers/bookingRouter.js";
app.use("/api/bookings", bookingRouter);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
