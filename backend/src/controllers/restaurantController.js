import Restaurant from "../models/restaurantModel.js";

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
            return res.status(400).json({ message: "Please fill in all required fields including GST Number" });
        }


        // Check for existing restaurant with same GST Number
        const existingRestro = await Restaurant.findOne({ gstNumber });
        if (existingRestro) {
            return res.status(400).json({ message: "Restaurant with this GST Number already exists" });
        }

        // Parse Timings
        // Frontend sends "HH:MM - HH:MM" or similar. 
        // We can extract open/close from the split string or use separate fields if sent
        // Let's assume generic "HH:MM" for open/close based on the combined string
        const [openTime, closeTime] = timings.split('-').map(t => t.trim());

        // Generate Tables
        const tablesCount = Number(noOfTables);
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

        res.status(201).json({
            message: "Restaurant created successfully",
            restaurant: savedRestaurant,
        });
    } catch (error) {
        console.log("Error in createRestaurant:", error.message);
        if (error.code === 11000) {
            return res.status(400).json({ message: "Restaurant with this GST Number already exists" });
        }
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
