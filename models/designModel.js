import mongoose from "mongoose";

const designSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: Array, required: true },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price must be greater than 0"],
  },
  category: { type: String, required: true },
  subCategory: { type: String },
  sizes: { type: Array, required: true },
  likes: { type: Number, default: 0 },
  isTrendingDesign: { type: Boolean, default: false },
  designer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "designer",
    required: true,
  },
});

const designModel =
  mongoose.models.design || mongoose.model("design", designSchema);

export default designModel;
