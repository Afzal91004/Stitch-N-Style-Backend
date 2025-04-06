import mongoose from "mongoose";

const designSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: ["Men", "Women", "Kids"],
    },
    subCategory: {
      type: String,
      required: [true, "Product sub-category is required"],
      enum: ["Top-Wear", "Bottom-Wear", "Winter-Wear"],
    },
    sizes: [
      {
        type: String,
        enum: ["S", "M", "L", "XL"],
      },
    ],
    bestSeller: {
      type: Boolean,
      default: false,
    },
    images: [
      {
        url: String,
        public_id: String,
      },
    ],
    designer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Design", designSchema);
