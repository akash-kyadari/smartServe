import User from "../models/UserModel.js";
import Restaurant from "../models/RestaurantModel.js";
import bcrypt from "bcryptjs";
import { io } from "../socket/socket.js";

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
                message: "A user with this email already exists."
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
            isActive: true, // Default to true for now
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
                isActive: true, // Default
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
        await Restaurant.findByIdAndUpdate(id, {
            $pull: { staff: { user: staffId } }
        });

        // Delete the User document
        await User.findByIdAndDelete(staffId);

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
            select: 'name email phone avatar'
        });

        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        const staffList = restaurant.staff.map(member => {
            if (!member.user) return null;
            return {
                _id: member.user._id,
                name: member.user.name,
                email: member.user.email,
                role: member.role,
                shift: member.shift,
                isActive: member.isActive,
                joinedAt: member.joinedAt
            };
        }).filter(Boolean);

        res.status(200).json({ success: true, staff: staffList });

    } catch (error) {
        console.error("Error fetching staff:", error);
        res.status(500).json({ success: false, message: "Error fetching staff", error: error.message });
    }
};

// Update a staff member's password
export const updateStaffPassword = async (req, res) => {
    try {
        const { id, staffId } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
        }

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ success: false, message: "Restaurant not found" });
        }

        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized to update staff for this restaurant" });
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

// Toggle Staff Activity Status (Online/Offline)
export const toggleStaffStatus = async (req, res) => {
    try {
        const { id } = req.params; // Restaurant ID
        const { staffId } = req.body; // Staff User ID
        const { active } = req.body; // Boolean

        // Logic to allow self-toggle OR owner-toggle
        // If req.user is the staff member, they can toggle themselves
        // If req.user is owner, they can toggle anyone

        const restaurant = await Restaurant.findById(id);
        if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

        const isOwner = restaurant.owner.toString() === req.user._id.toString();
        const isSelf = req.user._id.toString() === staffId;

        if (!isOwner && !isSelf) {
            return res.status(403).json({ message: "Not authorized to change status" });
        }

        // Find staff member in array
        const staffMember = restaurant.staff.find(s => s.user.toString() === staffId);
        if (!staffMember) {
            return res.status(404).json({ message: "Staff member not found in this restaurant" });
        }

        // --- NEW CHECK: Prevent going offline if tables are assigned ---
        if (!active) { // Attempting to go offline
            const activeTables = restaurant.tables.filter(t =>
                t.assignedWaiterId &&
                t.assignedWaiterId.toString() === staffId &&
                t.isOccupied
            );

            if (activeTables.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot go offline. You have ${activeTables.length} active table(s) assigned.`
                });
            }
        }
        // -------------------------------------------------------------

        staffMember.isActive = active;
        await restaurant.save();

        // Also update User's workingAt array for consistency
        await User.findOneAndUpdate(
            { _id: staffId, "workingAt.restaurantId": id },
            { $set: { "workingAt.$.isActive": active } }
        );

        // Notify Real-time
        io.to(`restro_staff_${id}`).emit("staff_update", {
            staffId,
            isActive: active
        });

        res.json({ success: true, message: `Status updated to ${active ? "Online" : "Offline"}`, isActive: active });

    } catch (error) {
        console.error("Error toggling staff status:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
