import mongoose from "mongoose";

const RestaurantSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: true },
    description: String,
    cuisineType: [String], // Indian, Chinese, Italian
    logo: String,
    coverImage: String,
    isAC: { type: Boolean, default: false },
    gstNumber: { type: String, required: true, unique: true },

    // Contact & Location
    phone: { type: String, required: true },
    email: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: { type: String, default: "India" },
      pincode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    // Owner Info (linked auth user)
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Restaurant Status
    isOpen: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },


    // Timing
    openingHours: {
      open: String, // "10:00"
      close: String, // "23:00"
      daysOpen: [String], // Mon, Tue, Wed
    },

    // Seating & Tables
    tables: [
      {
        tableNumber: Number,
        capacity: Number,
        qrCode: String,
        isOccupied: { type: Boolean, default: false },
        currentOrderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        assignedWaiterId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        requestService: { type: Boolean, default: false },
        requestBill: { type: Boolean, default: false },
      },
    ],

    // Menu Categories
    categories: [
      {
        name: String,
        description: String,
        isActive: { type: Boolean, default: true },
      },
    ],

    // Menu Items
    menu: [
      {
        name: { type: String, required: true },
        description: String,
        price: { type: Number, required: true },
        image: String,
        category: String,
        isVeg: Boolean,
        isAvailable: { type: Boolean, default: true },
        preparationTime: Number, // minutes
        addons: [
          {
            name: String,
            price: Number,
          },
        ],
      },
    ],

    // Staff (Waiter / Kitchen / Manager)
    staff: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["manager", "waiter", "kitchen", "staff"],
          required: true,
        },
        shift: {
          start: String, // e.g., "09:00"
          end: String,   // e.g., "17:00"
        },
        isActive: { type: Boolean, default: true },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    // Orders Summary
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],

    // Payments & Billing
    paymentSettings: {
      acceptsOnline: { type: Boolean, default: true },
      acceptsCash: { type: Boolean, default: true },
      serviceChargePercent: Number,
      platformCommissionPercent: Number, // 1–2%
    },

    // Ratings & Reviews
    ratings: {
      average: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },

    reviews: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: Number,
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Analytics (optional but powerful)
    analytics: {
      totalOrders: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      dailyRevenue: Number,
      monthlyRevenue: Number,
    },

    // Settings
    settings: {
      allowTableBooking: { type: Boolean, default: true },
      allowQROrdering: { type: Boolean, default: true },
      autoAcceptOrders: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Restaurant", RestaurantSchema);