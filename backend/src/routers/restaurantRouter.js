import express from "express";
import {
    createRestaurant,
    getMyRestaurants,
    getRestaurantById,
    updateRestaurant,
    getAllRestaurants,
    getRestaurantDetailsPublic,
    checkTableStatus,
    toggleTableService,
    toggleTableBill,
    getRestaurantAnalytics // Added import
} from "../controllers/restaurantController.js";
import { addStaff, removeStaff, getStaff, updateStaffPassword, toggleStaffStatus } from "../controllers/staffController.js";
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability } from "../controllers/menuController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public Routes (Customer/Guest)
router.get("/", getAllRestaurants);
router.get("/public/:id", getRestaurantDetailsPublic);
router.get("/public/:id/table/:tableId", checkTableStatus);
router.post("/public/:id/table/:tableId/service", toggleTableService);
router.post("/public/:id/table/:tableId/bill", toggleTableBill);

// Protected Routes
router.post("/", protect, authorize('owner'), createRestaurant);
router.get("/my-restaurants", protect, authorize('owner'), getMyRestaurants);
router.get("/analytics/:id", protect, authorize('owner', 'manager'), getRestaurantAnalytics); // Analytics
router.get("/:id", protect, authorize('owner', 'manager', 'waiter', 'kitchen'), getRestaurantById);
router.put("/:id", protect, authorize('owner', 'manager'), updateRestaurant);


// Staff Routes
router.get("/:id/staff", protect, authorize('owner', 'manager', 'kitchen', 'waiter'), getStaff);
router.post("/:id/staff", protect, authorize('owner'), addStaff);
router.delete("/:id/staff/:staffId", protect, authorize('owner'), removeStaff);
router.put("/:id/staff/:staffId/password", protect, authorize('owner'), updateStaffPassword);
router.put("/:id/staff/status", protect, authorize('owner', 'manager', 'waiter', 'kitchen'), toggleStaffStatus);

// Menu Routes
router.get("/:restaurantId/menu", protect, authorize('owner', 'manager', 'waiter', 'kitchen'), getMenuItems);
router.post("/:restaurantId/menu", protect, authorize('owner'), addMenuItem);
router.put("/:restaurantId/menu/:itemId", protect, authorize('owner'), updateMenuItem);
router.delete("/:restaurantId/menu/:itemId", protect, authorize('owner'), deleteMenuItem);
router.patch("/:restaurantId/menu/:itemId/toggle", protect, authorize('owner', 'manager'), toggleMenuItemAvailability);

export default router;
