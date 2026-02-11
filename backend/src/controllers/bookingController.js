import Booking from "../models/BookingModel.js";
import Restaurant from "../models/RestaurantModel.js";
import BookingLock from "../models/BookingLockModel.js";
import mongoose from "mongoose";
import { io } from "../socket/socket.js";

// Create Booking with Distributed Lock
export const createBooking = async (req, res) => {
    let lockAcquired = false;
    let lockId = null;

    try {
        const { restaurantId, tableId, date, startTime, guestCount, notes } = req.body;
        const userId = req.user._id;

        // Basic Validation
        if (!restaurantId || !tableId || !date || !startTime || !guestCount) {
            return res.status(400).json({ success: false, message: "Please provide all required fields" });
        }

        // Validate future date
        const bookingDate = new Date(`${date}T${startTime}`);
        if (bookingDate < new Date()) {
            return res.status(400).json({ success: false, message: "Cannot book for past time" });
        }

        // Restaurant Check
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        if (!restaurant.settings?.allowTableBooking) {
            return res.status(400).json({ success: false, message: "This restaurant does not accept table bookings" });
        }

        const table = restaurant.tables.id(tableId);
        if (!table) {
            return res.status(404).json({ success: false, message: "Table not found" });
        }

        if (guestCount > table.capacity + 2) {
            return res.status(400).json({ success: false, message: `Table capacity is ${table.capacity}. Cannot fit ${guestCount} guests.` });
        }

        // Calculate End Time
        const start = new Date(`${date}T${startTime}`);
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
        const endTime = end.toTimeString().slice(0, 5);

        // STEP 1: Try to acquire distributed lock
        // The unique index on BookingLock ensures only ONE request can create this lock
        try {
            const lock = new BookingLock({
                restaurantId,
                tableId,
                date,
                startTime,
                endTime,
                lockedBy: userId,
            });

            await lock.save();
            lockAcquired = true;
            lockId = lock._id;
            console.log(`Lock acquired for table ${tableId} at ${startTime} by user ${userId}`);
        } catch (lockError) {
            // Lock already exists - another user is booking this slot
            if (lockError.code === 11000) { // Duplicate key error
                console.log(`Lock conflict for table ${tableId} at ${startTime}`);
                return res.status(409).json({
                    success: false,
                    message: "This table is being booked by another user right now. Please try again in a moment.",
                    conflict: true
                });
            }
            throw lockError;
        }

        // STEP 2: Check for existing confirmed bookings (double-check)
        const overlappingBooking = await Booking.findOne({
            restaurantId,
            tableId,
            date,
            status: { $in: ['confirmed', 'grace'] },
            $or: [
                {
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                }
            ]
        });

        if (overlappingBooking) {
            // Release lock before returning
            await BookingLock.deleteOne({ _id: lockId });
            lockAcquired = false;

            return res.status(409).json({
                success: false,
                message: `Table is already booked from ${overlappingBooking.startTime} to ${overlappingBooking.endTime}`,
                conflict: true
            });
        }

        // STEP 3: Create the actual booking (we have the lock, safe to proceed)
        const newBooking = new Booking({
            restaurantId,
            tableId,
            userId,
            date,
            startTime,
            endTime,
            guestCount,
            status: 'confirmed',
            notes
        });

        await newBooking.save();
        console.log(`Booking created for table ${tableId} at ${startTime} by user ${userId}`);

        // STEP 4: Release the lock
        await BookingLock.deleteOne({ _id: lockId });
        lockAcquired = false;
        console.log(`Lock released for table ${tableId} at ${startTime}`);

        // Populate restaurant data
        await newBooking.populate('restaurantId', 'name address phone');

        // Emit Socket.IO events
        io.to(`restro_staff_${restaurantId}`).emit('booking:created', {
            booking: newBooking,
            tableId,
            date,
            startTime,
            endTime
        });

        io.to(`restro_public_${restaurantId}`).emit('table:unavailable', {
            tableId,
            date,
            startTime,
            endTime
        });

        res.status(201).json({ success: true, message: "Table booked successfully", booking: newBooking });

    } catch (error) {
        console.error("Booking Error:", error);

        // Clean up lock if it was acquired
        if (lockAcquired && lockId) {
            try {
                await BookingLock.deleteOne({ _id: lockId });
                console.log(`Lock cleaned up after error`);
            } catch (cleanupError) {
                console.error("Error cleaning up lock:", cleanupError);
            }
        }

        res.status(500).json({ success: false, message: "Failed to create booking", error: error.message });
    }
};

// Get Bookings (For User or Restaurant)
export const getBookings = async (req, res) => {
    try {
        const { restaurantId } = req.query; // If provided, fetch for restaurant (Owner/Staff)

        let query = {};
        if (restaurantId) {
            // Only Owner/Manager checks restaurant bookings
            // For simplicity, we assume auth middleware handles role checks or we add one here
            query.restaurantId = restaurantId;
        } else {
            // Fetch My Bookings (Customer)
            query.userId = req.user._id;
        }

        const bookings = await Booking.find(query)
            .populate('restaurantId', 'name address phone')
            .sort({ date: 1, startTime: 1 });

        res.status(200).json({ success: true, bookings });

    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch bookings", error: error.message });
    }
};

// Cancel Booking
export const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id);

        if (!booking) return res.status(404).json({ message: "Booking not found" });

        // Check ownership
        if (booking.userId.toString() !== req.user._id.toString()) {
            // Allow if restaurant owner? For now strict user check
            return res.status(403).json({ message: "Unauthorized" });
        }

        booking.status = 'cancelled';
        await booking.save();

        // Emit Socket.IO event for real-time updates
        // Notify restaurant staff
        io.to(`restro_staff_${booking.restaurantId}`).emit('booking:cancelled', {
            bookingId: booking._id,
            tableId: booking.tableId,
            date: booking.date,
            startTime: booking.startTime
        });

        // Notify other customers viewing the same restaurant (table is now available)
        io.to(`restro_public_${booking.restaurantId}`).emit('table:available', {
            tableId: booking.tableId,
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime
        });

        res.status(200).json({ success: true, message: "Booking cancelled" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to cancel booking", error: error.message });
    }
};
