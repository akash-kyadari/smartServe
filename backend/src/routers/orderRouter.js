import express from "express";
import { placeOrder, updateOrderStatus, freeTable, getTableOrders, getRestaurantActiveOrders } from "../controllers/orderController.js";

const router = express.Router();

// Customer Routes
router.post("/place", placeOrder);
router.get("/active/:restaurantId", getRestaurantActiveOrders);
router.get("/:restaurantId/:tableId", getTableOrders);

// Staff Routes
router.put("/:orderId/status", updateOrderStatus);
router.post("/free-table", freeTable);

export default router;
