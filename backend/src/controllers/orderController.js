import Order from "../models/OrderModel.js";
import mongoose from "mongoose";
import Restaurant from "../models/RestaurantModel.js";
import Booking from "../models/BookingModel.js";
import { io } from "../socket/socket.js"; // Import Booking model

// Place Order
export const placeOrder = async (req, res) => {
    try {
        const { restaurantId, tableId, tableNo, items, totalAmount, customerDetails } = req.body;

        // Validation
        if (!restaurantId || !tableId || !items || items.length === 0) {
            return res.status(400).json({ message: "Invalid order data" });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        // CLOSED/INACTIVE CHECK
        if (!restaurant.isActive || !restaurant.isOpen) {
            return res.status(503).json({
                message: "Restaurant is currently closed or not accepting orders.",
                isClosed: true
            });
        }

        // Find table using subdocument ID
        const table = restaurant.tables.id(tableId);
        if (!table) return res.status(404).json({ message: "Table not found" });

        // ---------------------------------------------------------------------
        // 🔒 CONFLICT CHECK: 1-Hour Booking Protection Rule
        // ---------------------------------------------------------------------
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0];

        const candidateBookings = await Booking.find({
            restaurantId,
            tableId,
            status: { $in: ['confirmed', 'grace'] },
            date: { $in: [todayStr, tomorrowStr] }
        });

        const conflictBooking = candidateBookings.find(b => {
            // Construct booking datetime
            // Note: Simplistic parsing assumes local/server time consistency or UTC Z
            // Ideally use a library like date-fns or moment, but vanilla JS for now
            const bDate = new Date(`${b.date}T${b.startTime}`);
            const diffMs = bDate - now;
            const diffMins = diffMs / 60000;

            // Conflict if booking starts within the next 60 minutes
            // (diffMins > 0 means future, <= 60 means within hour)
            // Also if booking is technically "now" (active/grace), diff might be negative but status checks cover 'active'. 
            // If status is 'confirmed' but passed start time (grace period), diff is negative. 
            // We should block those too! 
            // Rules say: "Booking active (grace/occupied) -> Reject". 
            // So if diffMins <= 60 && diffMins > -30 (grace period overlap)
            return diffMins <= 60 && diffMins > -20;
        });

        if (conflictBooking) {
            return res.status(409).json({
                message: `Table is reserved for ${conflictBooking.startTime}. Please select another table.`,
                isConflict: true
            });
        }
        // ---------------------------------------------------------------------

        // Create Order
        const newOrder = new Order({
            restaurantId,
            tableId,
            tableNo,
            items,
            totalAmount,
            customerDetails,
            customerDetails,
            waiterId: null, // Placeholder, will set below
            status: "PLACED", // Default state
            paymentStatus: "PENDING",
        });

        // ---------------------------------------------------------
        // Waiter Assignment Logic (Load Balancing)
        // ---------------------------------------------------------
        // ---------------------------------------------------------
        // Waiter Assignment Logic (Load Balancing) & Availability Check
        // ---------------------------------------------------------
        let assignedWaiterId = table.assignedWaiterId;

        // Get all active staff
        const activeStaff = restaurant.staff.filter(s => s.isActive);
        const activeWaiters = activeStaff.filter(s => s.role === 'waiter');
        const activeKitchen = activeStaff.filter(s => s.role === 'kitchen');
        const activeManagers = activeStaff.filter(s => s.role === 'manager');
        const ownerOnline = true; // Owner is always considered "available" if we want, or we can check a status

        // Strict Check: Must have at least one active STAFF member (waiter, manager, or compatible) to accept orders
        // User requested: "check for active waiters and then if available assign else show... not accepting"
        // We will interpret this as: If NO active waiters AND NO active managers, we might reject. 
        // But usually, if kitchen is missing, it's also a problem.

        if (activeWaiters.length === 0) {
            return res.status(503).json({
                message: "We are currently not accepting orders (No waiters available). Please try again later."
            });
        }

        if (activeKitchen.length === 0 && activeManagers.length === 0) {
            // Optional: Kitchen check
            // return res.status(503).json({ message: "Kitchen is currently closed." });
        }

        if (!assignedWaiterId) {
            if (activeWaiters.length > 0) {
                // Calculate current active tables for each waiter
                const waiterLoad = activeWaiters.map(w => {
                    const activeCount = restaurant.tables.filter(t =>
                        t.assignedWaiterId && t.assignedWaiterId.toString() === w.user.toString()
                    ).length;
                    return { waiterId: w.user, load: activeCount };
                });

                // Sort by load (ascending)
                waiterLoad.sort((a, b) => a.load - b.load);

                // Assign the one with least load
                assignedWaiterId = waiterLoad[0].waiterId;
                table.assignedWaiterId = assignedWaiterId;
            }
        }

        if (assignedWaiterId) {
            newOrder.waiterId = assignedWaiterId;
        }
        // ---------------------------------------------------------

        await newOrder.save();

        // Update Table Status (Lock it)
        table.isOccupied = true;
        table.currentOrderId = newOrder._id;
        await restaurant.save();

        // Populate waiter details for socket emission
        await newOrder.populate("waiterId", "name email");

        // SOCKET: Notify Kitchen/Staff
        io.to(`restro_staff_${restaurantId.toString()}`).emit("new_order", newOrder);

        // SOCKET: Ack to Customer Room
        io.to(`table_${restaurantId}_${tableId}`).emit("order_update", newOrder);

        res.status(201).json({ message: "Order placed successfully", order: newOrder });
    } catch (error) {
        console.error("Error placing order:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Update Order Status (Kitchen/Waiter Action)
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, paymentStatus } = req.body; // Expected: PREPARING, READY, SERVED, PAID

        const updateData = { status };
        if (paymentStatus) updateData.paymentStatus = paymentStatus;
        if (status === "PAID" && !paymentStatus) updateData.paymentStatus = "PAID";

        const order = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true }
        ).populate("waiterId", "name email");

        if (!order) return res.status(404).json({ message: "Order not found" });

        // SOCKET: Update Customer & Staff
        io.to(`table_${order.restaurantId}_${order.tableId}`).emit("order_update", order);
        io.to(`restro_staff_${order.restaurantId.toString()}`).emit("order_update", order);

        res.json({ message: "Order status updated", order });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Mark ALL Active Orders for a Table as (Served &) PAID
export const markTableAsPaid = async (req, res) => {
    try {
        const { tableId } = req.params;
        const { restaurantId } = req.body;

        if (!tableId || !restaurantId) return res.status(400).json({ message: "Table ID and Restaurant ID required." });

        // Find all orders that are active (PLACED, PREPARING, READY, SERVED) and NOT PAID/COMPLETED
        // We assume active session orders are anything not COMPLETED
        const orders = await Order.find({
            tableId,
            restaurantId,
            status: { $nin: ["COMPLETED", "PAID"] }
        });

        if (orders.length === 0) {
            return res.status(200).json({ message: "No unpaid active orders found." });
        }

        // Validation: All Active Orders MUST be SERVED first
        const unservedCount = orders.filter(o => o.status !== "SERVED").length;
        if (unservedCount > 0) {
            return res.status(400).json({
                message: `Cannot mark Table as Paid. ${unservedCount} orders are not yet SERVED. please serve them first.`
            });
        }

        const updatedOrders = [];
        for (const order of orders) {
            order.paymentStatus = "PAID";
            order.status = "PAID"; // Or should we keep status as SERVED if it was SERVED?
            // The prompt says "waiter marks as paid". Usually implies complete transaction.
            // Let's set status to PAID too.

            await order.save();
            await order.populate("waiterId", "name email");

            updatedOrders.push(order);

            // SOCKET: Notify
            io.to(`table_${restaurantId}_${tableId}`).emit("order_update", order);
            io.to(`restro_staff_${restaurantId.toString()}`).emit("order_update", order);
        }

        res.json({ message: "Table marked as Paid", updatedOrders });
    } catch (error) {
        console.error("Error marking table paid:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Free Table (End of Dining Session)
// Free Table (End of Dining Session)
export const freeTable = async (req, res) => {
    try {
        const { restaurantId, tableId } = req.body;
        const user = req.user; // From protect middleware

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        const table = restaurant.tables.id(tableId);
        if (!table) return res.status(404).json({ message: "Table not found" });

        // Authorization Check: Waiters can only free their assigned tables
        if (user.roles.includes('waiter') && !user.roles.includes('owner') && !user.roles.includes('manager')) {
            if (table.assignedWaiterId && table.assignedWaiterId.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "You can only close sessions for tables assigned to you." });
            }
        }

        // Check for active orders before closing
        if (table.currentOrderId) {
            const activeOrder = await Order.findById(table.currentOrderId);
            // Allow close if PAID or already COMPLETED (legacy)
            if (activeOrder && activeOrder.status !== "PAID" && activeOrder.status !== "COMPLETED") {
                return res.status(400).json({
                    message: "Cannot close session. Filter un-served or unpaid orders first.",
                    orderStatus: activeOrder.status,
                    activeOrderId: activeOrder._id
                });
            }

            // Mark order as closed/archived for this session
            if (activeOrder) {
                activeOrder.isSessionClosed = true;
                // DO NOT change status to COMPLETED, leave as PAID
                await activeOrder.save();
            }
        }

        // Also close ANY other active orders for this table (bulk close)
        await Order.updateMany(
            { tableId, restaurantId, isSessionClosed: { $ne: true } },
            { $set: { isSessionClosed: true } }
        );

        // Reset Table
        table.isOccupied = false;
        table.currentOrderId = null;
        table.assignedWaiterId = null; // Clear assigned waiter
        table.requestService = false; // Clear service request
        table.requestBill = false; // Clear bill request
        await restaurant.save();

        // SOCKET: Notify clear
        io.to(`table_${restaurantId}_${tableId}`).emit("table_freed", { message: "Table cleared" });
        io.to(`restro_staff_${restaurantId.toString()}`).emit("table_freed", { tableId });

        res.json({ message: "Table freed successfully" });
    } catch (error) {
        console.error("Error freeing table:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get Orders for a specific Table (For customer session restore)
export const getTableOrders = async (req, res) => {
    try {
        const { restaurantId, tableId } = req.params;

        // Find orders provided they are not closed/archived
        const activeOrders = await Order.find({
            restaurantId,
            tableId,
            isSessionClosed: { $ne: true }, // Changed from status check
            status: { $ne: "COMPLETED" } // Keep legacy check just in case
        }).sort({ createdAt: -1 });

        res.json(activeOrders);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Get All Active Orders for Kitchen/Staff
export const getRestaurantActiveOrders = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const user = req.user; // From protect middleware

        // 1. Basic Validation
        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid Restaurant ID" });
        }

        // Include COMPLETED for history/owner view (frontend will filter "Active" vs "History")
        // We might want to limit COMPLETED orders to the last 24 hours to avoid fetching entire history
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        let query = {
            restaurantId,
            $or: [
                // Active Orders: Not closed session AND not legacy completed
                { isSessionClosed: { $ne: true }, status: { $ne: "COMPLETED" } },
                // Recently Closed Sessions (Last 24h)
                { isSessionClosed: true, updatedAt: { $gte: yesterday } },
                // Legacy Completed (Last 24h)
                { status: "COMPLETED", updatedAt: { $gte: yesterday } }
            ]
        };

        // 2. Role-Based Filtering (Defensive)
        try {
            if (user?.roles?.includes('waiter') &&
                !user?.roles?.includes('owner') &&
                !user?.roles?.includes('manager') &&
                !user?.roles?.includes('kitchen')) {

                // Only for "Pure" Waiters
                if (user._id) {
                    // Waiters might need to see their own completed orders too
                    query.waiterId = user._id;
                }
            }
        } catch (roleError) {
            console.warn("[getRestaurantActiveOrders] Role check warning, defaulting to full view:", roleError);
        }

        // 3. Execution (With .lean() for performance and safety)
        const orders = await Order.find(query)
            .sort({ createdAt: 1 }) // Oldest first? or Newest? Usually Kitchen wants Oldest. Owner might want Newest.
            // Let's keep 1 (Oldest first) for kitchen flow. Completed ones will be at the top/bottom depending on sort.
            .populate("waiterId", "name email") // Populate waiter details
            .lean();

        res.json(orders);
    } catch (error) {
        console.error("[getRestaurantActiveOrders] CRITICAL ERROR:", error);
        res.status(500).json({ message: "Server Error Fetching Orders", error: error.message });
    }
};
