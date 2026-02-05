import express from "express";
import { createRestaurant, getMyRestaurants } from "../controllers/restaurantController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, authorize('owner'), createRestaurant);
router.get("/my-restaurants", protect, authorize('owner'), getMyRestaurants);

export default router;
