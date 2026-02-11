import mongoose from "mongoose";

// Lock model for preventing concurrent bookings
const BookingLockSchema = new mongoose.Schema({
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    tableId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true,
    },
    startTime: {
        type: String, // HH:mm
        required: true,
    },
    endTime: {
        type: String, // HH:mm
        required: true,
    },
    lockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 30, // Auto-delete after 30 seconds (prevents orphaned locks)
    },
});

// Unique compound index to prevent duplicate locks
BookingLockSchema.index(
    { restaurantId: 1, tableId: 1, date: 1, startTime: 1 },
    { unique: true }
);

export default mongoose.model("BookingLock", BookingLockSchema);
