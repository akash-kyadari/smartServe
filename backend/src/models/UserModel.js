import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        // =====================
        // BASIC IDENTITY
        // =====================
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true,
        },

        phone: {
            type: String,
            index: true,
        },

        avatar: String,

        // =====================
        // AUTH
        // =====================
        password: {
            type: String,
            required: true,
            select: false,
        },

        authProvider: {
            type: String,
            enum: ["local", "google", "github"],
            default: "local",
        },

        // =====================
        // ROLES (ARRAY)
        // =====================
        roles: [
            {
                type: String,
                enum: ["owner", "manager", "waiter", "kitchen", "customer", "admin"],
                index: true,
            },
        ],

        // =====================
        // RESTAURANT RELATIONS
        // =====================
        ownedRestaurants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Restaurant",
            },
        ],

        workingAt: [
            {
                restaurantId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Restaurant",
                },
                role: {
                    type: String,
                    enum: ["manager", "waiter", "kitchen"],
                },
                isActive: {
                    type: Boolean,
                    default: false,
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // =====================
        // CUSTOMER SIDE
        // =====================
        favoriteRestaurants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Restaurant",
            },
        ],

        orderHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Order",
            },
        ],

        // =====================
        // STATUS
        // =====================
        isActive: {
            type: Boolean,
            default: true,
        },

        isBlocked: {
            type: Boolean,
            default: false,
        },

        blockedReason: String,
    },
    { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;