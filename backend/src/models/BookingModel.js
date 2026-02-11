import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
            index: true,
        },
        tableId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        date: {
            type: String, // YYYY-MM-DD
            required: true,
            index: true,
        },
        startTime: {
            type: String, // HH:mm
            required: true,
        },
        endTime: {
            type: String, // HH:mm
            required: true,
        },
        guestCount: {
            type: Number,
            required: true,
            min: 1,
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "completed", "no-show", "grace"],
            default: "confirmed",
        },
        notes: String,
    },
    { timestamps: true }
);

// Prevent overlapping bookings for same table on same day
// This is a basic compound index, but logic validation is needed in controller for time ranges
BookingSchema.index({ restaurantId: 1, date: 1, tableId: 1 });

export default mongoose.model("Booking", BookingSchema);
