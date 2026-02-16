import Order from "../models/OrderModel.js";
import mongoose from "mongoose";
import Restaurant from "../models/RestaurantModel.js";
import Booking from "../models/BookingModel.js";
import { io } from "../socket/socket.js";
import logger from "../utils/logger.js";

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

        // 📦 STOCK & AVAILABILITY CHECK 📦
        for (const item of items) {
            const menuItem = restaurant.menu.id(item.menuItemId || item._id); // Handle both formats if possible, but schema says menuItemId

            if (!menuItem) {
                // Skip if not found? Or strict error? Smart apps should error.
                // return res.status(400).json({ message: `Item not found in menu: ${item.name}` });
                continue; // Skip for robustness, maybe custom item
            }

            if (!menuItem.isAvailable) {
                return res.status(400).json({ message: `Item is currently unavailable: ${item.name}` });
            }

            if (menuItem.stock !== null && menuItem.stock !== undefined) {
                if (menuItem.stock < item.quantity) {
                    return res.status(400).json({
                        message: `Insufficient stock for ${item.name}. Only ${menuItem.stock} left.`
                    });
                }
            }
        }

        // DEDUCT STOCK (Atomic Bulk Write)
        const stockUpdates = [];
        const updatedItems = [];

        for (const item of items) {
            const menuItem = restaurant.menu.id(item.menuItemId || item._id);
            if (menuItem && menuItem.stock !== null && menuItem.stock !== undefined) {
                // Prepare Atomic Update
                stockUpdates.push({
                    updateOne: {
                        filter: { _id: restaurantId, "menu._id": menuItem._id },
                        update: { $inc: { "menu.$.stock": -item.quantity } }
                    }
                });

                // Helper for socket emission (approximate new stock)
                let newStock = menuItem.stock - item.quantity;
                if (newStock < 0) newStock = 0;

                updatedItems.push({
                    _id: menuItem._id,
                    stock: newStock,
                    isAvailable: menuItem.isAvailable
                });
            }
        }

        if (stockUpdates.length > 0) {
            await Restaurant.bulkWrite(stockUpdates);
        }

        // Emit Stock Update
        if (updatedItems.length > 0) {
            io.to(`restro_public_${restaurantId}`).emit("menu_stock_update", updatedItems);
        }

        // Create Order
        const newOrder = new Order({
            restaurantId,
            tableId,
            tableNo,
            items,
            totalAmount,
            customerDetails,
            waiterId: null, // Placeholder, will set below
            status: "PLACED", // Default state
            paymentStatus: "PENDING",
        });

        // ---------------------------------------------------------
        // Waiter Assignment Logic (Load Balancing) & Availability Check
        // ---------------------------------------------------------
        let assignedWaiterId = table.assignedWaiterId;

        // Check if the Order is placed by a Logged-in Staff Member (Waiter/Manager)
        let isStaffPlacement = false;
        if (req.user) {
            // req.user comes from optionalProtect middleware
            const staffMember = restaurant.staff.find(s => s.user.toString() === req.user._id.toString());
            if (staffMember) {
                // The user is staff at this restaurant
                if (['waiter', 'manager', 'owner'].includes(staffMember.role) || staffMember.role !== 'kitchen') {
                    isStaffPlacement = true;
                    assignedWaiterId = req.user._id; // Assign to SELF
                    logger.info(`[OrderPlacement] Order placed by Staff (${staffMember.role}): ${req.user.name}. Auto-assigning to self.`);
                }
            }
        }

        // Get all active staff
        const activeStaff = restaurant.staff.filter(s => s.isActive);
        const activeWaiters = activeStaff.filter(s => s.role === 'waiter');
        const activeKitchen = activeStaff.filter(s => s.role === 'kitchen');
        const activeManagers = activeStaff.filter(s => s.role === 'manager');

        // Strict Check: Must have at least one active STAFF member (waiter, manager, or compatible) to accept orders
        // UNLESS the order is being placed BY a staff member (who is obviously online/active)
        if (activeWaiters.length === 0 && !isStaffPlacement) {
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
                // table.assignedWaiterId = assignedWaiterId; // Don't modify local object if not needed for logic
                logger.info(`[OrderPlacement] Auto-assigned waiter: ${assignedWaiterId} (Load: ${waiterLoad[0].load})`);
            } else {
                logger.warn("[OrderPlacement] No active waiters found even though check passed?");
            }
        }

        if (assignedWaiterId) {
            newOrder.waiterId = assignedWaiterId;
            logger.info(`[OrderPlacement] Order ${newOrder._id} assigned to Waiter ${assignedWaiterId}`);
        } else {
            logger.warn(`[OrderPlacement] Order ${newOrder._id} created WITHOUT Waiter ID`);
        }
        // ---------------------------------------------------------

        await newOrder.save();

        // Update Table Status (Lock it) - ATOMIC UPDATE
        // Using updateOne to modify SPECIFIC fields of the table subdocument
        const updateFields = {
            "tables.$.isOccupied": true,
            "tables.$.currentOrderId": newOrder._id
        };
        if (newOrder.waiterId) {
            updateFields["tables.$.assignedWaiterId"] = newOrder.waiterId;
        }

        await Restaurant.updateOne(
            { _id: restaurantId, "tables._id": tableId },
            { $set: updateFields }
        );

        // Populate waiter details for socket emission
        await newOrder.populate("waiterId", "name email");

        // SOCKET: Notify Kitchen/Staff
        const roomNameStaff = `restro_staff_${restaurantId}`;
        const roomNameCustomer = `table_${restaurantId}_${tableId}`;

        io.to(roomNameStaff).emit("new_order", newOrder);
        io.to(roomNameCustomer).emit("order_update", newOrder);

        // Emit Table Update
        const tableUpdateData = {
            tableId,
            isOccupied: true,
            currentOrderId: newOrder._id,
            assignedWaiterId: newOrder.waiterId // Send ID or populated object? ID is safer for consistency
        };
        io.to(roomNameStaff).emit("table_update", tableUpdateData);
        // Customer might not need generic table update, but if they are on a "select table" screen, maybe?
        // But roomNameCustomer is specific to THAT table. So they know.
        // But we might want to broadcast to "restro_public_${restaurantId}" if we have a floor plan view for customers?
        // For now, staff update is critical.

        logger.info(`[OrderPlacement] Emitted 'new_order' to ${roomNameStaff}`);

        res.status(201).json({ message: "Order placed successfully", order: newOrder });
    } catch (error) {
        logger.error("Error placing order:", error);
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
        const roomNameCustomer = `table_${order.restaurantId}_${order.tableId}`;
        const roomNameStaff = `restro_staff_${order.restaurantId}`;

        io.to(roomNameCustomer).emit("order_update", order);
        io.to(roomNameStaff).emit("order_update", order);

        logger.info(`[OrderUpdate] Emitted to ${roomNameCustomer} and ${roomNameStaff}`);

        res.json({ message: "Order status updated", order });
    } catch (error) {
        logger.error("Error updating order:", error);
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
        logger.error("Error marking table paid:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Free Table (End of Dining Session)
export const freeTable = async (req, res) => {
    try {
        const { restaurantId, tableId } = req.body;
        const user = req.user; // From protect middleware

        // 1. Authorization & Validation (Read-Only Check)
        const restaurant = await Restaurant.findById(restaurantId).select('tables owner staff');
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        const table = restaurant.tables.id(tableId);
        if (!table) return res.status(404).json({ message: "Table not found" });

        // Authorization Check: Waiters can only free their assigned tables
        if (user.roles.includes('waiter') && !user.roles.includes('owner') && !user.roles.includes('manager')) {
            if (table.assignedWaiterId && table.assignedWaiterId.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "You can only close sessions for tables assigned to you." });
            }
        }

        // Check for ANY active unpaid/unserved orders before closing
        // (This remains unchanged as it checks Orders collection)
        const unresolvedOrders = await Order.findOne({
            tableId,
            restaurantId,
            isSessionClosed: { $ne: true },
            status: { $nin: ["PAID", "COMPLETED"] } // Must be PAID or COMPLETED
        });

        if (unresolvedOrders) {
            return res.status(400).json({
                message: "Cannot close session. There are unpaid or active orders. Please settle them first.",
                activeOrderId: unresolvedOrders._id,
                orderStatus: unresolvedOrders.status
            });
        }

        // 2. Perform Updates
        // Bulk close orders
        await Order.updateMany(
            { tableId, restaurantId, isSessionClosed: { $ne: true } },
            { $set: { isSessionClosed: true } }
        );

        // Atomic Update for Restaurant Table
        // Use array filters or specific positional operator if we had the index, 
        // but 'tables._id' query works safest.
        await Restaurant.updateOne(
            { _id: restaurantId, "tables._id": tableId },
            {
                $set: {
                    "tables.$.isOccupied": false,
                    "tables.$.currentOrderId": null,
                    "tables.$.assignedWaiterId": null,
                    "tables.$.requestService": false,
                    "tables.$.requestBill": false
                }
            }
        );

        // SOCKET: Notify clear
        io.to(`table_${restaurantId}_${tableId}`).emit("table_freed", { message: "Table cleared" });
        io.to(`restro_staff_${restaurantId.toString()}`).emit("table_freed", { tableId });

        res.json({ message: "Table freed successfully" });
    } catch (error) {
        logger.error("Error freeing table:", error);
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
            logger.warn("[getRestaurantActiveOrders] Role check warning, defaulting to full view:", roleError);
        }

        // 3. Execution (With .lean() for performance and safety)
        const orders = await Order.find(query)
            .sort({ createdAt: 1 }) // Oldest first? or Newest? Usually Kitchen wants Oldest. Owner might want Newest.
            // Let's keep 1 (Oldest first) for kitchen flow. Completed ones will be at the top/bottom depending on sort.
            .populate("waiterId", "name email") // Populate waiter details
            .lean();

        res.json(orders);
    } catch (error) {
        logger.error("[getRestaurantActiveOrders] CRITICAL ERROR:", error);
        res.status(500).json({ message: "Server Error Fetching Orders", error: error.message });
    }
};

// Get Order History with Pagination (For Owner Reports)
export const getOrderHistory = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { page = 1, limit = 20, status, fromDate, toDate, search } = req.query;

        if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid Restaurant ID" });
        }

        const query = { restaurantId };

        // Authorization check? Assuming middleware handled 'owner'/'manager' check, but might double check user role inside if needed.
        // For now rely on route protection.

        // Status Filter
        if (status) {
            query.status = status;
        }
        // IF no status provided, we return ALL orders (Active + History) as per user request to see "Placed", "Preparing" etc.
        // Previously we defaulted to only Completed/Paid. Removing that restriction.

        // Date Range (default: last 30 days if not specified?)
        if (fromDate) {
            query.createdAt = { ...query.createdAt, $gte: new Date(fromDate) };
        }
        if (toDate) {
            const end = new Date(toDate);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { ...query.createdAt, $lte: end };
        }

        // Search by Order ID or Table No
        if (search) {
            if (mongoose.Types.ObjectId.isValid(search)) {
                query._id = search;
            } else if (!isNaN(search)) {
                query.tableNo = Number(search);
            } else {
                // Return empty if search term is invalid (not ID or Number)
                // Using a dummy condition that will never match
                query._id = null;
            }
        }

        // Pagination
        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort({ createdAt: -1 }) // Newest first
                .skip(Number(skip))
                .limit(Number(limit))
                .populate("waiterId", "name")
                .lean(),
            Order.countDocuments(query)
        ]);

        res.json({
            success: true,
            orders,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        logger.error("Error fetching order history:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
