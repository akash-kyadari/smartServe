import Restaurant from "../models/restaurantModel.js";

// Create a new restaurant
export const createRestaurant = async (req, res) => {
    try {
        const { name, address, contact, type, noOfTables, ac, timings } = req.body;

        if (!name || !address || !type || !noOfTables || !timings) {
            return res.status(400).json({ message: "Please fill in all required fields" });
        }

        const newRestaurant = new Restaurant({
            name,
            address,
            contact,
            type,
            noOfTables,
            ac: ac || false,
            timings,
            owner: req.user._id, // Assumes req.user is set by auth middleware
        });

        const savedRestaurant = await newRestaurant.save();

        res.status(201).json({
            message: "Restaurant created successfully",
            restaurant: savedRestaurant,
        });
    } catch (error) {
        console.log("Error in createRestaurant:", error.message);
        res.status(500).json({ message: "Error creating restaurant", error: error.message });
    }
};

// Get restaurants owned by the current user
export const getMyRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ owner: req.user._id });
        res.status(200).json({ restaurants });
    } catch (error) {
        console.log("Error in getMyRestaurants:", error.message);
        res.status(500).json({ message: "Error fetching restaurants", error: error.message });
    }
};
