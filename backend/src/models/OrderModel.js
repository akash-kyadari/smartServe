import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
    {
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Restaurant",
            required: true,
        },
        tableId: {
            type: mongoose.Schema.Types.ObjectId, // References the subdocument _id in Restaurant.tables
            required: true,
        },
        waiterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
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
            default: false
        }
    },
    { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
