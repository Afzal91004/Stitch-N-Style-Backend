import designModel from "../models/designModel.js";
import { v2 as cloudinary } from "cloudinary";

export const addDesign = async (req, res) => {
  try {
    const { title, description, category, price } = req.body;
    const images = req.processedImages; // Access the processed images

    if (!title || !description || !category || !price || !images) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Create your design object with the processed images
    const design = await Design.create({
      title,
      description,
      category,
      price,
      images: images, // Array of {url, public_id}
    });

    return res.status(201).json({
      success: true,
      design,
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

const listDesigns = async (req, res) => {
  try {
    const designs = await designModel.find({}).populate("designer", "name");
    res.json({ success: true, designs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const listTrendingDesigns = async (req, res) => {
  try {
    const trendingDesigns = await designModel
      .find({ isTrendingDesign: true })
      .populate("designer", "name");
    res.json({ success: true, data: trendingDesigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { listDesigns, listTrendingDesigns };
