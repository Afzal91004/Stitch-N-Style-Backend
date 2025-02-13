import mongoose from "mongoose";

const customOrderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  measurements: {
    chest: Number,
    waist: Number,
    hips: Number,
    length: Number,
    shoulders: Number,
    sleeves: Number,
  },
  design: {
    style: String,
    fabric: String,
    color: String,
    pattern: String,
    customization: String,
  },
  referenceImages: [
    {
      type: String, // Cloudinary URLs
    },
  ],
  status: {
    type: String,
    enum: ["pending", "accepted", "in_progress", "completed", "cancelled"],
    default: "pending",
  },
  assignedDesigner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Designer",
  },
  price: Number,
  progress: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: Date,
});

export default mongoose.model("CustomOrder", customOrderSchema);
