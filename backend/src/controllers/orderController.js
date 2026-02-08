import Order from "../models/OrderModel.js";
import mongoose from "mongoose";
import Restaurant from "../models/RestaurantModel.js";
import { io } from "../socket/socket.js";

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

        // Find table using subdocument ID
        const table = restaurant.tables.id(tableId);
        if (!table) return res.status(404).json({ message: "Table not found" });

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
        let assignedWaiterId = table.assignedWaiterId;

        if (!assignedWaiterId) {
            // Find all active waiters in this restaurant
            const waiters = restaurant.staff.filter(s => s.role === 'waiter' && s.isActive);

            if (waiters.length > 0) {
                // Calculate current active tables for each waiter
                const waiterLoad = waiters.map(w => {
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
        const { status } = req.body; // Expected: PREPARING, READY, SERVED, PAID

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        );

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

// Free Table (End of Dining Session)
export const freeTable = async (req, res) => {
    try {
        const { restaurantId, tableId } = req.body;

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        const table = restaurant.tables.id(tableId);
        if (!table) return res.status(404).json({ message: "Table not found" });

        // Retrieve order to close it if needed
        if (table.currentOrderId) {
            await Order.findByIdAndUpdate(table.currentOrderId, { status: "COMPLETED" });
        }

        // Reset Table
        table.isOccupied = false;
        table.isOccupied = false;
        table.currentOrderId = null;
        table.assignedWaiterId = null; // Clear assigned waiter
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

        // Find orders provided they are not completed (active session)
        // Or just fetch the 'currentOrderId' from logic
        const activeOrders = await Order.find({
            restaurantId,
            tableId,
            status: { $ne: "COMPLETED" }
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

        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({ message: "Invalid Restaurant ID" });
        }

        const orders = await Order.find({
            restaurantId,
            status: { $in: ["PLACED", "PREPARING", "READY", "SERVED", "PAID"] }
        }).sort({ createdAt: 1 }); // Oldest first for FIFO

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
