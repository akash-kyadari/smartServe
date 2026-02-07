import User from "../models/UserModel.js";
import Restaurant from "../models/RestaurantModel.js";
import bcrypt from "bcryptjs";

// Add a new staff member
export const addStaff = async (req, res) => {
    try {
        const { id } = req.params; // Restaurant ID
        const { name, email, password, role, shiftStart, shiftEnd } = req.body;

        // Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        // Verify ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to manage staff for this restaurant" });
        }

        // Check if user (email) already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "A user with this email already exists. Currently, staff accounts must be unique."
            });
        }

        // Create new User
        const hashedPassword = await bcrypt.hash(password, 10);

        // Ensure role is valid
        const validRoles = ["manager", "waiter", "kitchen", "staff"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role specified" });
        }

        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            roles: [role], // Array of roles
            workingAt: [{
                restaurantId: restaurant._id,
                role: role,
                isActive: true
            }]
        });

        const savedUser = await newUser.save();

        // Add to Restaurant staff array
        restaurant.staff.push({
            user: savedUser._id,
            role: role,
            shift: {
                start: shiftStart || "09:00",
                end: shiftEnd || "17:00"
            },
            isActive: true,
            joinedAt: new Date()
        });

        await restaurant.save();

        res.status(201).json({
            success: true,
            message: "Staff member added successfully",
            staff: {
                _id: restaurant.staff[restaurant.staff.length - 1]._id,
                user: {
                    _id: savedUser._id,
                    name: savedUser.name,
                    email: savedUser.email
                },
                role: role,
                shift: restaurant.staff[restaurant.staff.length - 1].shift,
                isActive: true,
                joinedAt: restaurant.staff[restaurant.staff.length - 1].joinedAt
            }
        });

    } catch (error) {
        console.error("Error adding staff:", error);
        res.status(500).json({ success: false, message: "Error adding staff member", error: error.message });
    }
};

// Remove a staff member
export const removeStaff = async (req, res) => {
    try {
        const { id, staffId } = req.params; // Restaurant ID, Staff (User) ID

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        // Verify ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to remove staff from this restaurant" });
        }

        // Remove from Restaurant staff array
        // We use $pull to remove the object where user matches staffId
        await Restaurant.findByIdAndUpdate(id, {
            $pull: { staff: { user: staffId } }
        });

        // Delete the User document as per requirement
        // "remove n db including users coll"
        const deletedUser = await User.findByIdAndDelete(staffId);

        if (!deletedUser) {
            // It's possible the user was already deleted or not found, but we still cleaned up the restaurant array.
            // We can return success or a warning.
            // Let's assume success if the goal is "ensure they are gone".
        }

        res.status(200).json({ success: true, message: "Staff member removed successfully" });

    } catch (error) {
        console.error("Error removing staff:", error);
        res.status(500).json({ success: false, message: "Error removing staff member", error: error.message });
    }
};

// Get all staff for a restaurant
export const getStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id).populate({
            path: 'staff.user',
            select: 'name email phone avatar' // Select fields to return
        });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        // Format the response
        const staffList = restaurant.staff.map(member => {
            // Handle case where user might be null (if deleted but not removed from array, though verifyRemove handles this)
            if (!member.user) return null;
            return {
                _id: member.user._id, // User ID references the staff member
                name: member.user.name,
                email: member.user.email,
                role: member.role,
                shift: member.shift,
                isActive: member.isActive,
                joinedAt: member.joinedAt
            };
        }).filter(Boolean); // Remove nulls

        res.status(200).json({ success: true, staff: staffList });

    } catch (error) {
        console.error("Error fetching staff:", error);
        res.status(500).json({ success: false, message: "Error fetching staff", error: error.message });
    }
};

// Update a staff member's password
export const updateStaffPassword = async (req, res) => {
    try {
        const { id, staffId } = req.params; // Restaurant ID, Staff (User) ID
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
        }

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        // Verify ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to update staff for this restaurant" });
        }

        // Verify staff belongs to restaurant
        const isStaff = restaurant.staff.some(s => s.user?.toString() === staffId);
        if (!isStaff) {
            return res.status(404).json({ success: false, message: "Staff member not found in this restaurant" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(staffId, {
            password: hashedPassword
        });

        res.status(200).json({ success: true, message: "Staff password updated successfully" });

    } catch (error) {
        console.error("Error updating staff password:", error);
        res.status(500).json({ success: false, message: "Error updating staff password", error: error.message });
    }
};
