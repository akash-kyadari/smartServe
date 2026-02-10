import Restaurant from "../models/RestaurantModel.js";

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
        console.log("Error in getMenuItems:", error.message);
        res.status(500).json({ success: false, message: "Error fetching menu items", error: error.message });
    }
};

// Add a new menu item
export const addMenuItem = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { name, description, price, category, isVeg, isAvailable, preparationTime, image } = req.body;

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
            preparationTime: preparationTime ? Number(preparationTime) : 15,
            image: image || "",
            addons: []
        };

        restaurant.menu.push(newMenuItem);
        await restaurant.save();

        // Get the newly added item (last item in array)
        const addedItem = restaurant.menu[restaurant.menu.length - 1];

        res.status(201).json({
            success: true,
            message: "Menu item added successfully",
            menuItem: addedItem
        });
    } catch (error) {
        console.log("Error in addMenuItem:", error.message);
        res.status(500).json({ success: false, message: "Error adding menu item", error: error.message });
    }
};

// Update a menu item
export const updateMenuItem = async (req, res) => {
    try {
        const { restaurantId, itemId } = req.params;
        const updates = req.body;
        console.log(`Updating menu item: ${itemId} in ${restaurantId}`, updates);

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        // Verify ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to update menu items in this restaurant" });
        }

        // Construct update fields with dot notation for Atomic Set
        const updateFields = {};
        if (updates.name !== undefined) updateFields["menu.$.name"] = updates.name.trim();
        if (updates.description !== undefined) updateFields["menu.$.description"] = updates.description.trim();
        if (updates.price !== undefined) {
            if (Number(updates.price) < 0) return res.status(400).json({ success: false, message: "Price must be positive" });
            updateFields["menu.$.price"] = Number(updates.price);
        }
        if (updates.category !== undefined) updateFields["menu.$.category"] = updates.category;
        if (updates.isVeg !== undefined) updateFields["menu.$.isVeg"] = Boolean(updates.isVeg);
        if (updates.isAvailable !== undefined) updateFields["menu.$.isAvailable"] = Boolean(updates.isAvailable);
        if (updates.preparationTime !== undefined) updateFields["menu.$.preparationTime"] = Number(updates.preparationTime);
        if (updates.image !== undefined) updateFields["menu.$.image"] = updates.image;

        // Atomic Update
        const updatedRestaurant = await Restaurant.findOneAndUpdate(
            { "_id": restaurantId, "menu._id": itemId },
            { "$set": updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedRestaurant) {
            return res.status(404).json({ success: false, message: "Menu item not found" });
        }

        // Get the updated item to return
        const updatedItem = updatedRestaurant.menu.id(itemId);

        res.status(200).json({
            success: true,
            message: "Menu item updated successfully",
            menuItem: updatedItem
        });
    } catch (error) {
        console.log("Error in updateMenuItem:", error.message);
        res.status(500).json({ success: false, message: "Error updating menu item", error: error.message });
    }
};

// Delete a menu item
export const deleteMenuItem = async (req, res) => {
    try {
        const { restaurantId, itemId } = req.params;
        console.log(`Deleting menu item: Restro=${restaurantId}, Item=${itemId}, User=${req.user._id}`);

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        // Verify ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to delete menu items from this restaurant" });
        }

        // Use atomic pull to remove item
        const result = await Restaurant.findByIdAndUpdate(
            restaurantId,
            { $pull: { menu: { _id: itemId } } },
            { new: true } // Return updated doc
        );

        if (!result) {
            return res.status(404).json({ success: false, message: "Failed to delete item" });
        }

        console.log("Item deleted successfully");

        res.status(200).json({
            success: true,
            message: "Menu item deleted successfully"
        });
    } catch (error) {
        console.log("Error in deleteMenuItem:", error.message);
        res.status(500).json({ success: false, message: "Error deleting menu item", error: error.message });
    }
};

// Toggle menu item availability
export const toggleMenuItemAvailability = async (req, res) => {
    try {
        const { restaurantId, itemId } = req.params;

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        // Verify ownership or manager role
        const isOwner = restaurant.owner.toString() === req.user._id.toString();
        const isManager = restaurant.staff.some(
            s => s.user.toString() === req.user._id.toString() && s.role === 'manager'
        );

        if (!isOwner && !isManager) {
            return res.status(403).json({ success: false, message: "Not authorized to modify menu availability" });
        }

        // Find item to get current status
        const menuItem = restaurant.menu.id(itemId);
        if (!menuItem) {
            return res.status(404).json({ success: false, message: "Menu item not found" });
        }

        const newState = !menuItem.isAvailable;

        // Atomic update
        await Restaurant.updateOne(
            { "_id": restaurantId, "menu._id": itemId },
            { "$set": { "menu.$.isAvailable": newState } }
        );

        // Update local object for response
        menuItem.isAvailable = newState;

        res.status(200).json({
            success: true,
            message: `Menu item ${newState ? 'enabled' : 'disabled'} successfully`,
            menuItem: menuItem
        });
    } catch (error) {
        console.log("Error in toggleMenuItemAvailability:", error.message);
        res.status(500).json({ success: false, message: "Error toggling menu item availability", error: error.message });
    }
};
