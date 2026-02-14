import Restaurant from "../models/RestaurantModel.js";
import User from "../models/UserModel.js";
import Order from "../models/OrderModel.js"; // Import Order model
import { io, isUserConnected } from "../socket/socket.js";
import logger from "../utils/logger.js";

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
            gstNumber,
            gmapLink, // support from frontend
            coverImage // Added cover image
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
            address: typeof address === 'object' ? { ...address, locationUrl: gmapLink || address.locationUrl } : {
                street: address,
                city: 'Unknown',
                state: 'Unknown',
                state: 'Unknown',
                country: 'India',
                locationUrl: gmapLink
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
            coverImage: coverImage || "", // Save cover image
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
        logger.error("Error in createRestaurant:", error.message);
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
        // Compute status for each restaurant's staff
        const restaurantsWithStatus = restaurants.map(r => {
            const rObj = r.toObject();
            if (rObj.staff) {
                rObj.staff = rObj.staff.map(member => {
                    if (member.user) {
                        const isConnected = isUserConnected(rObj._id, member.user._id);
                        member.isActive = member.isActive && isConnected;
                    }
                    return member;
                });
            }
            return rObj;
        });

        res.status(200).json({ success: true, restaurants: restaurantsWithStatus });
    } catch (error) {
        logger.error("Error in getMyRestaurants:", error.message);
        res.status(500).json({ success: false, message: "Error fetching restaurants", error: error.message });
    }
};

// Get single restaurant by ID (Protected - for Owner/Staff)
export const getRestaurantById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id).populate({
            path: 'staff.user',
            select: 'name email avatar'
        });
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        // Convert to object to modify staff status
        const restaurantObj = restaurant.toObject();

        // Compute active status for staff based on socket connection
        if (restaurantObj.staff) {
            // Check Access: User must be Owner or Staff
            const isOwner = restaurantObj.owner.toString() === req.user._id.toString();
            const isStaff = restaurantObj.staff.some(s => s.user && s.user._id.toString() === req.user._id.toString());

            if (!isOwner && !isStaff) {
                return res.status(403).json({ success: false, message: "Not authorized to view this restaurant" });
            }

            restaurantObj.staff = restaurantObj.staff.map(member => {
                if (member.user) {
                    const isConnected = isUserConnected(req.params.id, member.user._id);
                    member.isActive = member.isActive && isConnected;
                }
                return member;
            });
        }

        res.status(200).json({ success: true, restaurant: restaurantObj });
    } catch (error) {
        logger.error("Error in getRestaurantById:", error.message);
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

        // REALTIME UPDATE: Notify Staff & Customers
        if (updates.isActive !== undefined || updates.isOpen !== undefined) {
            const statusPayload = {
                isActive: updatedRestaurant.isActive,
                isOpen: updatedRestaurant.isOpen,
                restaurantId: id
            };

            // Notify Staff
            io.to(`restro_staff_${id}`).emit("restaurant_status_update", statusPayload);

            // Notify Customers (We will make them join this room)
            io.to(`restro_public_${id}`).emit("restaurant_status_update", statusPayload);
        }

        res.status(200).json({
            success: true,
            message: "Restaurant updated successfully",
            restaurant: updatedRestaurant,
        });
    } catch (error) {
        logger.error("Error in updateRestaurant:", error.message);
        res.status(500).json({ success: false, message: "Error updating restaurant", error: error.message });
    }
};

// ==========================================
// PUBLIC CONTROLLERS (For Customer/Guest)
// ==========================================

// Get all active restaurants (For Landing Page)
export const getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ isActive: true })
            .select("name address cuisineType isAC logo coverImage openingHours settings isOpen ratings")
            .sort({ "ratings.average": -1 });

        res.status(200).json({ success: true, restaurants });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching restaurants", error: error.message });
    }
};

// Get public details (For Menu Page)
export const getRestaurantDetailsPublic = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id)
            .select("-owner -staff -analytics -orders -paymentSettings.platformCommissionPercent");

        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }
        res.status(200).json({ success: true, restaurant });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching restaurant", error: error.message });
    }
};

// Check Table Status (For QR Scan Landing)
export const checkTableStatus = async (req, res) => {
    try {
        const { id, tableId } = req.params;
        const restaurant = await Restaurant.findById(id);

        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        // Find table subdocument
        const table = restaurant.tables.id(tableId);
        if (!table) return res.status(404).json({ message: "Table not found" });

        res.status(200).json({
            success: true,
            table: {
                _id: table._id,
                tableNumber: table.tableNumber,
                capacity: table.capacity,
                isOccupied: table.isOccupied,
                currentOrderId: table.currentOrderId,
                requestService: table.requestService
            },
            restaurant: {
                _id: restaurant._id,
                name: restaurant.name,
                settings: restaurant.settings
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Toggle Table Service (Call Waiter)
export const toggleTableService = async (req, res) => {
    try {
        const { id, tableId } = req.params;
        const { active } = req.body; // true to call, false to resolve

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        const table = restaurant.tables.id(tableId);
        if (!table) return res.status(404).json({ message: "Table not found" });

        table.requestService = active;

        // Auto-assign waiter if needed (and services requested)
        if (active && !table.assignedWaiterId) {
            const activeStaff = restaurant.staff.filter(s => s.isActive);
            const activeWaiters = activeStaff.filter(s => s.role === 'waiter');

            // Strict Check: No active waiters = No Service
            if (activeWaiters.length === 0) {
                return res.status(503).json({ message: "We are currently not serving. No waiters are available." });
            }

            // Find waiter with least active tables
            if (activeWaiters.length > 0) {
                const waiterLoad = activeWaiters.map(w => {
                    const activeCount = restaurant.tables.filter(t =>
                        t.assignedWaiterId && t.assignedWaiterId.toString() === w.user.toString()
                    ).length;
                    return { waiterId: w.user, load: activeCount };
                });
                waiterLoad.sort((a, b) => a.load - b.load);
                if (waiterLoad.length > 0) {
                    table.assignedWaiterId = waiterLoad[0].waiterId;
                }
            }
        }

        // If even after trying, no one is assigned, we might want to alert frontend
        if (active && !table.assignedWaiterId) {
            // Optional: Return 503 if we want to BLOCK the call. 
            // Better UX: Allow call, but tell user "Staff is unavailable, request sent to manager". 
            // Owner/Manager usually always sees these requests anyway.
        }

        await restaurant.save();

        // Notify Staff
        io.to(`restro_staff_${id}`).emit("table_service_update", {
            tableId,
            requestService: active,
            tableNumber: table.tableNumber
        });

        // Notify Customer (Table Room)
        io.to(`table_${id}_${tableId}`).emit("table_service_update", { requestService: active });

        res.status(200).json({ success: true, message: active ? "Waiter called" : "Request resolved" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Toggle Bill Request
export const toggleTableBill = async (req, res) => {
    try {
        const { id, tableId } = req.params;
        const { active } = req.body; // true to request, false to cancel/resolve

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        const table = restaurant.tables.id(tableId);
        if (!table) return res.status(404).json({ message: "Table not found" });

        table.requestBill = active;
        await restaurant.save();

        // Notify Staff
        io.to(`restro_staff_${id}`).emit("table_bill_update", {
            tableId,
            requestBill: active,
            tableNumber: table.tableNumber,
            assignedWaiterId: table.assignedWaiterId // Send assigned waiter ID
        });

        res.status(200).json({ success: true, message: active ? "Bill requested" : "Bill request resolved" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
// Get Analytics (Revenue & Popular Items)
export const getRestaurantAnalytics = async (req, res) => {
    try {
        const { id } = req.params;

        // Verify ownership/manager
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        // Authorization check (Owner/Manager) - relying on route middleware usually, but good to be safe if passed ID isn't checked
        // The middleware `protect` and `authorize` handles role, but we need to ensure this restaurant belongs to user if owner
        if (req.user.roles.includes('owner') && restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized" });
        }


        // 1. Revenue Last 7 Days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const revenueData = await Order.aggregate([
            {
                $match: {
                    restaurantId: restaurant._id,
                    status: { $in: ["PAID", "COMPLETED"] },
                    updatedAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                    totalRevenue: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill missing days with 0
        const filledRevenue = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const found = revenueData.find(r => r._id === dateStr);
            filledRevenue.push({
                date: dateStr,
                revenue: found ? found.totalRevenue : 0,
                day: d.toLocaleDateString('en-US', { weekday: 'short' })
            });
        }

        // 2. Popular Dishes (All Time or Last 30 Days?) - Let's do Last 30 Days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const popularItems = await Order.aggregate([
            {
                $match: {
                    restaurantId: restaurant._id,
                    status: { $nin: ["CANCELLED"] }, // Count all orders except cancelled
                    createdAt: { $gte: thirtyDaysAgo }
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.name", // Group by name
                    count: { $sum: "$items.quantity" }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Transform for frontend
        const totalItemsSold = popularItems.reduce((acc, curr) => acc + curr.count, 0);
        const popularDishes = popularItems.map((item, index) => ({
            name: item._id,
            sales: totalItemsSold > 0 ? Math.round((item.count / totalItemsSold) * 100) + "%" : "0%",
            count: item.count,
            color: index === 0 ? "bg-sunset" : index === 1 ? "bg-orange-400" : "bg-yellow-400" // Simple color assignment
        }));

        res.status(200).json({
            success: true,
            revenue: filledRevenue,
            popularDishes
        });

    } catch (error) {
        logger.error("Analytics Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// Add Review (Public)
export const addReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment, customerName } = req.body;

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        const newReview = {
            rating: Number(rating),
            comment,
            customerName: customerName || "Guest",
            createdAt: new Date()
        };

        restaurant.reviews.push(newReview);

        // Update Average Rating
        const totalReviews = restaurant.reviews.length;
        const sumRatings = restaurant.reviews.reduce((acc, r) => acc + r.rating, 0);
        restaurant.ratings = {
            average: (sumRatings / totalReviews).toFixed(1),
            totalReviews
        };

        await restaurant.save();

        res.status(200).json({ success: true, message: "Review added successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
