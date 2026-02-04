import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Link to Restro Owner
    address: { type: String, required: true },
    contact: { type: String},
    photos: [String], // URLs of restaurant photos
    ratings: { type: Number, default: 0 },
    reviews: [{ user: String, comment: String, rating: Number }],
    isActive: { type: Boolean, default: true },
    timings:{type:String ,required:true},
    type:{type:String ,required:true},
    noOfTables:{type:Number,required:true},
    ac:{type:Boolean ,required:true}
  },
  { timestamps: true },
);
