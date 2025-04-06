import mongoose from "mongoose";

const customOrderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedDesigner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      style: { type: String, required: true },
      fabric: { type: String, required: true },
      color: String,
      pattern: String,
      customization: String,
    },
    referenceImages: [String],
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "waiting_payment",
        "in_progress",
        "completed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    price: {
      type: Number,
      min: 0,
    },
    shippingAddress: {
      firstName: String,
      lastName: String,
      email: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: "India" },
      phoneNumber: String,
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay", null],
    },
    paymentDetails: {
      method: String,
      paymentId: String,
      orderId: String,
      signature: String,
      verifiedAt: Date,
    },
    estimatedDelivery: Date,
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    designerNotes: String,
    notes: String, // For customer notes
    // Status timestamps
    acceptedAt: Date,
    inProgressAt: Date,
    completedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
customOrderSchema.index({ customer: 1, status: 1 });
customOrderSchema.index({ assignedDesigner: 1, status: 1 });
customOrderSchema.index({ status: 1 });
customOrderSchema.index({ createdAt: -1 });

const CustomOrder = mongoose.model("CustomOrder", customOrderSchema);

export default CustomOrder;
