import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    minlength: [3, "Name must be at least 3 characters long"],
  },
  description: {
    type: String,
    required: [true, "Product description is required"],
    minlength: [10, "Description must be at least 10 characters long"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["Men", "Women", "Kids"],
  },
  subCategory: {
    type: String,
    required: [true, "Sub-category is required"],
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
  image: [
    {
      type: String,
      required: [true, "Product image is required"],
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Product", productSchema);
