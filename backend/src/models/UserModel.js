import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: {
        type: [String],
        enum: ["customer", "waiter", "owner", "staff", "kitchen", "manager"],
        default: ["customer"],
        required: true
    },
});

const User = mongoose.model("User", userSchema);

export default User;