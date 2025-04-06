import designModel from "../models/designModel.js";
import { v2 as cloudinary } from "cloudinary";

export const addDesign = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestSeller,
    } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category || !req.processedImages) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        received: {
          name,
          description,
          price,
          category,
          images: !!req.processedImages,
        },
      });
    }

    // Parse sizes array if it's a string
    let parsedSizes = [];
    try {
      parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid sizes format",
      });
    }

    // Create design object
    const design = await designModel.create({
      name,
      description,
      price: parseFloat(price),
      category,
      subCategory: subCategory || category, // fallback to category if subCategory not provided
      sizes: parsedSizes,
      bestSeller: bestSeller === "true" || bestSeller === true,
      images: req.processedImages,
      designer: req.user?._id, // Optional chaining in case auth middleware isn't present
    });

    return res.status(201).json({
      success: true,
      design,
      message: "Product added successfully",
    });
  } catch (error) {
    console.error("Add design error:", error);
    return res.status(500).json({
      success: false,
      message: "Error adding design",
      error: error.message,
    });
  }
};

// Update trending designs to use bestSeller instead of isTrendingDesign
export const listTrendingDesigns = async (req, res) => {
  try {
    const trendingDesigns = await designModel
      .find({ bestSeller: true })
      .populate("designer", "name");
    res.json({
      success: true,
      designs: trendingDesigns,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const listDesigns = async (req, res) => {
  try {
    const designs = await designModel
      .find({})
      .populate("designer", "name")
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      designs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
