import express from "express";
import { placeOrder, updateOrderStatus, freeTable, getTableOrders, getRestaurantActiveOrders } from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Staff Routes (Protected) - Must come before parameterized routes to avoid conflicts
router.get("/active/:restaurantId", protect, authorize('owner', 'manager', 'waiter', 'kitchen'), getRestaurantActiveOrders);
router.put("/:orderId/status", protect, authorize('owner', 'manager', 'waiter', 'kitchen'), updateOrderStatus);
router.post("/free-table", protect, authorize('owner', 'manager', 'waiter'), freeTable);

// Customer Routes
router.post("/place", placeOrder);
// Generic parameterized route must be LAST
router.get("/:restaurantId/:tableId", getTableOrders);

export default router;
