import Booking from "../models/BookingModel.js";
import Restaurant from "../models/RestaurantModel.js";
import BookingLock from "../models/BookingLockModel.js";
import mongoose from "mongoose";
import { io } from "../socket/socket.js";
import logger from "../utils/logger.js";

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
        const end = new Date(start.getTime() + 1 * 60 * 60 * 1000); // 1 hour default (was 2)
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
            // Lock already exists - check if it's OUR lock (from selection phase)
            if (lockError.code === 11000) { // Duplicate key error
                const existingLock = await BookingLock.findOne({ restaurantId, tableId, date, startTime });

                if (existingLock && existingLock.lockedBy.toString() === userId.toString()) {
                    // We own the lock, so we can proceed!
                    logger.info(`User ${userId} already holds lock for table ${tableId}, proceeding to book.`);
                    lockAcquired = true;
                    lockId = existingLock._id;
                } else {
                    logger.warn(`Lock conflict for table ${tableId} at ${startTime}`);
                    return res.status(409).json({
                        success: false,
                        message: "This table is being booked by another user right now. Please try again in a moment.",
                        conflict: true
                    });
                }
            } else {
                throw lockError;
            }
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
        console.log(`[DEBUG] Booking saved successfully: ${newBooking._id}`);
        logger.info(`Booking created for table ${tableId} at ${startTime} by user ${userId}`);

        // STEP 4: Release the lock
        await BookingLock.deleteOne({ _id: lockId });
        lockAcquired = false;
        logger.info(`Lock released for table ${tableId} at ${startTime}`);

        // Populate restaurant data - MUST include tables to resolve tableNumber
        await newBooking.populate('restaurantId', 'name address phone tables');

        // Convert to plain object to add tableNumber and cleanup
        const bookingObj = newBooking.toObject();
        if (bookingObj.restaurantId && bookingObj.restaurantId.tables) {
            const table = bookingObj.restaurantId.tables.find(t => t._id.toString() === bookingObj.tableId.toString());
            if (table) {
                bookingObj.tableNumber = table.tableNumber;
            }
            delete bookingObj.restaurantId.tables;
        }

        // Emit Socket.IO events
        const restroIdStr = restaurantId.toString();

        io.to(`restro_staff_${restroIdStr}`).emit('booking:created', {
            booking: bookingObj,
            tableId,
            date,
            startTime,
            endTime
        });

        io.to(`restro_public_${restroIdStr}`).emit('table:unavailable', {
            tableId,
            date,
            startTime,
            endTime
        });

        res.status(201).json({ success: true, message: "Table booked successfully", booking: bookingObj });

    } catch (error) {
        logger.error("Booking Error:", error);

        // Clean up lock if it was acquired
        if (lockAcquired && lockId) {
            try {
                await BookingLock.deleteOne({ _id: lockId });
                logger.info(`Lock cleaned up after error`);
            } catch (cleanupError) {
                logger.error("Error cleaning up lock:", cleanupError);
            }
        }

        res.status(500).json({ success: false, message: "Failed to create booking", error: error.message });
    }
};

// Get Bookings (For User or Restaurant)
export const getBookings = async (req, res) => {
    try {
        const { restaurantId, date, startTime, page = 1, limit = 20 } = req.query; // Pagination

        let query = {};
        let isAvailabilityCheck = false;

        if (restaurantId) {
            query.restaurantId = restaurantId;

            if (date) {
                query.date = date;
            }

            if (startTime) {
                isAvailabilityCheck = true;
                const requestedStart = new Date(`2000-01-01T${startTime}`);
                const requestedEnd = new Date(requestedStart.getTime() + 1 * 60 * 60 * 1000); // 1 Hour
                const reqEndStr = requestedEnd.toTimeString().slice(0, 5);

                query.$or = [
                    { startTime: { $lt: reqEndStr, $gte: startTime } },
                    { endTime: { $gt: startTime, $lte: reqEndStr } },
                    { startTime: { $lte: startTime }, endTime: { $gte: reqEndStr } }
                ];
            }
            query.status = { $ne: 'cancelled' };
        } else {
            query.userId = req.user._id;
        }

        // Pagination for List View (Not for Availability Check)
        let bookings = [];
        let total = 0;

        if (!isAvailabilityCheck) {
            const skip = (page - 1) * limit;

            [bookings, total] = await Promise.all([
                Booking.find(query)
                    .populate('restaurantId', 'name address phone tables')
                    .sort({ date: 1, startTime: 1 })
                    .skip(Number(skip))
                    .limit(Number(limit))
                    .lean(),
                Booking.countDocuments(query)
            ]);
        } else {
            bookings = await Booking.find(query)
                .populate('restaurantId', 'name address phone tables')
                .lean();
            total = bookings.length;
        }

        // Resolve table numbers...
        bookings.forEach(booking => {
            if (booking.restaurantId && Array.isArray(booking.restaurantId.tables)) {
                const tableIdStr = booking.tableId.toString();
                const table = booking.restaurantId.tables.find(t => t._id && t._id.toString() === tableIdStr);
                if (table) {
                    booking.tableNumber = table.tableNumber;
                }
            }
        });

        // Second pass to cleanup populated tables if present
        bookings.forEach(booking => {
            if (booking.restaurantId) {
                delete booking.restaurantId.tables;
            }
        });

        // Fetch locks only for availability check
        let locks = [];
        if (isAvailabilityCheck && restaurantId) {
            const requestedStart = new Date(`2000-01-01T${startTime}`);
            const requestedEnd = new Date(requestedStart.getTime() + 1 * 60 * 60 * 1000); // 1 Hour matches above
            const reqEndStr = requestedEnd.toTimeString().slice(0, 5);

            locks = await BookingLock.find({
                restaurantId,
                date,
                $or: [
                    { startTime: { $lt: reqEndStr, $gte: startTime } },
                    { endTime: { $gt: startTime, $lte: reqEndStr } },
                    { startTime: { $lte: startTime }, endTime: { $gte: reqEndStr } }
                ]
            });
        }

        const lockBookings = locks.map(l => ({
            _id: l._id,
            tableId: l.tableId,
            status: 'locked',
            startTime: l.startTime,
            endTime: l.endTime,
            lockedBy: l.lockedBy
        }));

        res.status(200).json({
            success: true,
            bookings: [...bookings, ...lockBookings],
            pagination: !isAvailabilityCheck ? {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit)
            } : null
        });

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
        const restroIdStr = booking.restaurantId.toString();
        const tableIdStr = booking.tableId.toString();

        // Notify restaurant staff
        io.to(`restro_staff_${restroIdStr}`).emit('booking:cancelled', {
            bookingId: booking._id,
            tableId: tableIdStr,
            date: booking.date,
            startTime: booking.startTime
        });

        // Notify other customers viewing the same restaurant (table is now available)
        io.to(`restro_public_${restroIdStr}`).emit('table:available', {
            tableId: tableIdStr,
            date: booking.date,
            startTime: booking.startTime,
            endTime: booking.endTime
        });

        res.status(200).json({ success: true, message: "Booking cancelled" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to cancel booking", error: error.message });
    }
};

// Lock Table (Concurrency)
export const lockTable = async (req, res) => {
    try {
        const { restaurantId, tableId, date, startTime } = req.body;
        const userId = req.user._id;

        if (!restaurantId || !tableId || !date || !startTime) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Check if already locked
        const existingLock = await BookingLock.findOne({ restaurantId, tableId, date, startTime });
        if (existingLock) {
            if (existingLock.lockedBy.toString() === userId.toString()) {
                return res.status(200).json({ success: true, message: "Already locked by you" });
            }
            return res.status(409).json({ success: false, message: "Table is currently selected by another user" });
        }

        // Create Lock
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(start.getTime() + 1 * 60 * 60 * 1000); // 1 hour lock
        const endTime = end.toTimeString().slice(0, 5);

        await BookingLock.create({
            restaurantId,
            tableId,
            date,
            startTime,
            endTime,
            lockedBy: userId
        });

        const restroIdStr = restaurantId.toString();
        const tableIdStr = tableId.toString();

        // Notify others
        io.to(`restro_public_${restroIdStr}`).emit('table:locked', {
            tableId: tableIdStr,
            date,
            startTime,
            lockedBy: userId
        });

        // Set timeout to notify unlock (expires: 60s in Model)
        setTimeout(async () => {
            // Only emit unlock if the table was NOT booked in the meantime
            const isBooked = await Booking.findOne({
                restaurantId,
                tableId,
                date,
                status: { $in: ['confirmed', 'grace'] }, // Ignore cancelled bookings!
                // Match overlapping slots
                $or: [
                    { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
                ]
            });

            if (!isBooked) {
                io.to(`restro_public_${restroIdStr}`).emit('table:unlocked', {
                    tableId: tableIdStr,
                    date,
                    startTime
                });
            }
        }, 60000); // 60 seconds matches TTL

        res.status(201).json({ success: true, message: "Table locked" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "Table is currently selected by another user" });
        }
        res.status(500).json({ success: false, message: "Failed to lock table", error: error.message });
    }
};

// Unlock Table
export const unlockTable = async (req, res) => {
    try {
        const { restaurantId, tableId, date, startTime } = req.body;
        const userId = req.user._id;

        const result = await BookingLock.deleteOne({
            restaurantId,
            tableId,
            date,
            startTime,
            lockedBy: userId
        });

        if (result.deletedCount > 0) {
            const restroIdStr = restaurantId.toString();
            // Notify others
            io.to(`restro_public_${restroIdStr}`).emit('table:unlocked', {
                tableId: tableId.toString(), // tableId is likely ObjectId
                date,
                startTime
            });
            res.status(200).json({ success: true, message: "Table unlocked" });
        } else {
            res.status(200).json({ success: false, message: "Lock not found or not owned by you" });
        }

    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to unlock table", error: error.message });
    }
};
