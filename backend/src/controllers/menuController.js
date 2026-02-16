import Restaurant from "../models/RestaurantModel.js";
import logger from "../utils/logger.js";
import { io } from "../socket/socket.js";

// Get all menu items for a restaurant
export const getMenuItems = async (req, res) => {
    try {
        const { restaurantId } = req.params;

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        res.status(200).json({
            success: true,
            menu: restaurant.menu || [],
            categories: restaurant.categories || []
        });
    } catch (error) {
        logger.error("Error in getMenuItems:", error.message);
        res.status(500).json({ success: false, message: "Error fetching menu items", error: error.message });
    }
};

// Add a new menu item
export const addMenuItem = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { name, description, price, category, isVeg, servingInfo, isAvailable, preparationTime, image } = req.body;

        // Validation
        if (!name || !price) {
            return res.status(400).json({ success: false, message: "Name and price are required" });
        }

        if (price < 0) {
            return res.status(400).json({ success: false, message: "Price must be a positive number" });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        // Verify ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to add menu items to this restaurant" });
        }

        // Create new menu item
        const newMenuItem = {
            name: name.trim(),
            description: description?.trim() || "",
            price: Number(price),
            category: category || "Uncategorized",
            isVeg: isVeg !== undefined ? Boolean(isVeg) : true,
            isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
            servingInfo: servingInfo || "",
            preparationTime: preparationTime ? Number(preparationTime) : 15,
            image: image || "",
            addons: []
        };

        restaurant.menu.push(newMenuItem);
        await restaurant.save();

        // Get the newly added item (last item in array)
        const addedItem = restaurant.menu[restaurant.menu.length - 1];

        // Emit Update
        io.to(`restro_public_${restaurantId}`).emit("menu_full_update", {
            action: "add",
            item: addedItem
        });

        res.status(201).json({
            success: true,
            message: "Menu item added successfully",
            menuItem: addedItem
        });
    } catch (error) {
        logger.error("Error in addMenuItem:", error.message);
        res.status(500).json({ success: false, message: "Error adding menu item", error: error.message });
    }
};

// Update a menu item
export const updateMenuItem = async (req, res) => {
    try {
        const { restaurantId, itemId } = req.params;
        const updates = req.body;
        logger.info(`Updating menu item: ${itemId} in ${restaurantId}`, updates);

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        // Verify ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to update menu items in this restaurant" });
        }

        // Find the item to update
        const menuItem = restaurant.menu.id(itemId);
        if (!menuItem) {
            return res.status(404).json({ success: false, message: "Menu item not found" });
        }

        // Helper to update fields
        if (updates.name !== undefined) menuItem.name = updates.name.trim();
        if (updates.description !== undefined) menuItem.description = updates.description.trim();
        if (updates.price !== undefined) menuItem.price = Number(updates.price);
        if (updates.category !== undefined) menuItem.category = updates.category;
        if (updates.isVeg !== undefined) menuItem.isVeg = Boolean(updates.isVeg);
        if (updates.isAvailable !== undefined) menuItem.isAvailable = Boolean(updates.isAvailable);
        if (updates.preparationTime !== undefined) menuItem.preparationTime = Number(updates.preparationTime);
        if (updates.image !== undefined) menuItem.image = updates.image;
        if (updates.servingInfo !== undefined) menuItem.servingInfo = updates.servingInfo;

        await restaurant.save();

        // Emit Stock/Availability Update (or full update really)
        io.to(`restro_public_${restaurantId}`).emit("menu_stock_update", [{
            _id: menuItem._id,
            servingInfo: menuItem.servingInfo,
            isAvailable: menuItem.isAvailable,
            // also include price/name/etc if needed, but for now stock/avail is critical realtime
            name: menuItem.name,
            price: menuItem.price
        }]);

        res.status(200).json({
            success: true,
            message: "Menu item updated successfully",
            menuItem: menuItem
        });
    } catch (error) {
        logger.error("Error in updateMenuItem:", error.message);
        res.status(500).json({ success: false, message: "Error updating menu item", error: error.message });
    }
};

// Delete a menu item
export const deleteMenuItem = async (req, res) => {
    try {
        const { restaurantId, itemId } = req.params;

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });

        // Verify ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        // Use atomic pull
        await Restaurant.findByIdAndUpdate(restaurantId, { $pull: { menu: { _id: itemId } } });

        // Emit Update
        io.to(`restro_public_${restaurantId}`).emit("menu_full_update", {
            action: "delete",
            itemId: itemId
        });

        res.status(200).json({ success: true, message: "Menu item deleted successfully" });
    } catch (error) {
        logger.error("Error in deleteMenuItem:", error.message);
        res.status(500).json({ success: false, message: "Error deleting menu item", error: error.message });
    }
};

// Toggle menu item availability
export const toggleMenuItemAvailability = async (req, res) => {
    try {
        const { restaurantId, itemId } = req.params;
        const { isAvailable } = req.body || {}; // Safety check for empty body

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ success: false, message: "Restaurant not found" });

        // Auth
        const isOwner = restaurant.owner.toString() === req.user._id.toString();
        const isManager = restaurant.staff.some(s => s.user.toString() === req.user._id.toString() && s.role === 'manager');

        if (!isOwner && !isManager) return res.status(403).json({ success: false, message: "Not authorized" });

        const menuItem = restaurant.menu.id(itemId);
        if (!menuItem) return res.status(404).json({ success: false, message: "Item not found" });

        // Toggle or Set
        const newState = isAvailable !== undefined ? isAvailable : !menuItem.isAvailable;
        menuItem.isAvailable = newState;

        await restaurant.save();

        // Emit Update
        io.to(`restro_public_${restaurantId}`).emit("menu_stock_update", [{
            _id: menuItem._id,
            isAvailable: menuItem.isAvailable,
            servingInfo: menuItem.servingInfo
        }]);

        res.status(200).json({
            success: true,
            message: `Menu item ${newState ? 'enabled' : 'disabled'}`,
            menuItem
        });
    } catch (error) {
        logger.error("Error in toggleMenuItemAvailability:", error.message);
        res.status(500).json({ success: false, message: "Error toggling menu item", error: error.message });
    }
};
