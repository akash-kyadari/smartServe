import Restaurant from "../models/RestaurantModel.js";
import User from "../models/UserModel.js";

// Create a new restaurant
export const createRestaurant = async (req, res) => {
    try {
        const {
            name,
            address,
            contact,
            type,
            noOfTables,
            timings,
            startTime12,
            endTime12,
            ac,
            gstNumber
        } = req.body;

        // Basic validation
        if (!name || !address || !contact || !type || !noOfTables || !timings || !gstNumber) {
            return res.status(400).json({ success: false, message: "Please fill in all required fields including GST Number" });
        }


        // Check for existing restaurant with same GST Number
        const existingRestro = await Restaurant.findOne({ gstNumber });
        if (existingRestro) {
            return res.status(400).json({ success: false, message: "Restaurant with this GST Number already exists" });
        }

        // Parse Timings
        // Safer parsing to prevent crashes
        let openTime = "10:00";
        let closeTime = "22:00";
        if (timings && timings.includes('-')) {
            const parts = timings.split('-').map(t => t.trim());
            if (parts.length >= 2) {
                openTime = parts[0];
                closeTime = parts[1];
            }
        }

        // Generate Tables
        const tablesCount = Number(noOfTables);
        if (tablesCount > 200) {
            return res.status(400).json({ success: false, message: "Maximum number of tables allowed is 200" });
        }
        const tablesArray = [];
        if (tablesCount > 0) {
            for (let i = 1; i <= tablesCount; i++) {
                tablesArray.push({
                    tableNumber: i,
                    capacity: 4, // Default capacity
                    isOccupied: false
                });
            }
        }

        // Construct New Restaurant Object
        const newRestaurant = new Restaurant({
            name,
            // Address is expected to be an object from frontend now, but if it comes as string (legacy compatibility or error), handle it.
            // However, we will update frontend to send object.
            address: typeof address === 'object' ? address : {
                street: address,
                city: 'Unknown',
                state: 'Unknown',
                country: 'India'
            },
            phone: contact,
            cuisineType: [type], // Convert single type to array
            openingHours: {
                open: openTime || "10:00",
                close: closeTime || "22:00",
                daysOpen: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            },
            tables: tablesArray,
            owner: req.user._id,
            isAC: !!ac,
            gstNumber,
            description: "", // Default description, can be updated later
            settings: {
                allowTableBooking: true,
                allowQROrdering: true
            }
        });

        const savedRestaurant = await newRestaurant.save();

        // Update owner's ownedRestaurants
        await User.findByIdAndUpdate(
            req.user._id,
            { $push: { ownedRestaurants: savedRestaurant._id } },
            { new: true }
        );

        res.status(201).json({
            success: true,
            message: "Restaurant created successfully",
            restaurant: savedRestaurant,
        });
    } catch (error) {
        console.log("Error in createRestaurant:", error.message);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Restaurant with this GST Number already exists" });
        }
        res.status(500).json({ success: false, message: "Error creating restaurant", error: error.message });
    }
};

// Get restaurants owned by the current user OR where user is staff
export const getMyRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({
            $or: [
                { owner: req.user._id },
                { staff: { $elemMatch: { user: req.user._id } } }
            ]
        }).populate({
            path: 'staff.user',
            select: 'name email avatar'
        });
        res.status(200).json({ success: true, restaurants });
    } catch (error) {
        console.log("Error in getMyRestaurants:", error.message);
        res.status(500).json({ success: false, message: "Error fetching restaurants", error: error.message });
    }
};

// Get single restaurant by ID
export const getRestaurantById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id).populate({
            path: 'staff.user',
            select: 'name email avatar'
        });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }
        res.status(200).json({ success: true, restaurant });
    } catch (error) {
        console.log("Error in getRestaurantById:", error.message);
        res.status(500).json({ success: false, message: "Error fetching restaurant", error: error.message });
    }
};

// Update restaurant
export const updateRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Verify ownership
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to update this restaurant" });
        }

        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Restaurant updated successfully",
            restaurant: updatedRestaurant,
        });
    } catch (error) {
        console.log("Error in updateRestaurant:", error.message);
        res.status(500).json({ success: false, message: "Error updating restaurant", error: error.message });
    }
};
