import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../models/userModel.js"; // Ensure this path is correct

const designerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  specializations: [
    {
      type: String,
      enum: ["traditional", "modern", "fusion", "western", "ethnic"],
    },
  ],
  experience: {
    type: Number,
    default: 0,
  },
  portfolio: [
    {
      title: String,
      description: String,
      imageUrl: String,
    },
  ],
  rating: {
    type: Number,
    default: 0,
  },
  totalOrders: {
    type: Number,
    default: 0,
  },
  completedOrders: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
});

// Hash password before saving
designerSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare password
designerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("Designer", designerSchema);
