import express from "express";
import { createRestaurant, getMyRestaurants, getRestaurantById, updateRestaurant } from "../controllers/restaurantController.js";
import { addStaff, removeStaff, getStaff, updateStaffPassword } from "../controllers/staffController.js";
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability } from "../controllers/menuController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize('owner'), createRestaurant);
router.get("/my-restaurants", protect, authorize('owner'), getMyRestaurants);
router.get("/:id", protect, authorize('owner', 'manager', 'waiter', 'kitchen'), getRestaurantById);
router.put("/:id", protect, authorize('owner', 'manager'), updateRestaurant);

// Staff Routes
router.get("/:id/staff", protect, authorize('owner', 'manager'), getStaff);
router.post("/:id/staff", protect, authorize('owner'), addStaff);
router.delete("/:id/staff/:staffId", protect, authorize('owner'), removeStaff);
router.put("/:id/staff/:staffId/password", protect, authorize('owner'), updateStaffPassword);

// Menu Routes
router.get("/:restaurantId/menu", protect, authorize('owner', 'manager', 'waiter', 'kitchen'), getMenuItems);
router.post("/:restaurantId/menu", protect, authorize('owner'), addMenuItem);
router.put("/:restaurantId/menu/:itemId", protect, authorize('owner'), updateMenuItem);
router.delete("/:restaurantId/menu/:itemId", protect, authorize('owner'), deleteMenuItem);
router.patch("/:restaurantId/menu/:itemId/toggle", protect, authorize('owner', 'manager'), toggleMenuItemAvailability);

export default router;
