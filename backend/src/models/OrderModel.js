import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
            index: true, // Optimizing for frequent queries
        },
        tableId: {
            type: mongoose.Schema.Types.ObjectId, // References the subdocument _id in Restaurant.tables
            required: true,
            index: true, // Often filter by table
        },
        waiterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
        tableNo: {
            type: Number,
            required: true,
        },
        customerDetails: {
            name: { type: String, required: true },
            phone: { type: String, required: true },
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Optional
        },
        items: [
            {
                menuItemId: { type: mongoose.Schema.Types.ObjectId, required: true },
                name: { type: String, required: true },
                price: { type: Number, required: true },
                quantity: { type: Number, required: true, min: 1 },
                addons: [
                    {
                        name: String,
                        price: Number,
                    },
                ],
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["PLACED", "PREPARING", "READY", "SERVED", "PAID", "COMPLETED"],
            default: "PLACED",
            index: true, // Filter by status
        },
        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED"],
            default: "PENDING",
        },
        paymentMethod: {
            type: String,
            enum: ["CASH", "ONLINE"],
            default: "CASH",
        },
        isSessionClosed: {
            type: Boolean,
            default: false,
            index: true // Filter active sessions
        }
    },
    { timestamps: true }
);

// Indexes for common queries
OrderSchema.index({ restaurantId: 1, status: 1 });
OrderSchema.index({ restaurantId: 1, createdAt: -1 }); // For history
OrderSchema.index({ restaurantId: 1, updatedAt: -1 }); // For active orders check
OrderSchema.index({ tableId: 1, status: 1 });

export default mongoose.model("Order", OrderSchema);
