import express from "express";
import { createBooking, getBookings, cancelBooking } from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a booking (Protected)
router.post("/", protect, createBooking);

// Get bookings (Protected)
// Query param ?restaurantId=... for staff/owner view
// No param = my bookings (customer)
router.get("/", protect, getBookings);

// Cancel booking (Protected)
router.delete("/:id", protect, cancelBooking);

export default router;
