import designModel from "../models/designModel.js";
import { v2 as cloudinary } from "cloudinary";

const addDesign = async (req, res) => {
  try {
    const { name, category, designerId, isTrendingDesign } = req.body;
    const images = req.files?.images || [];

    const imageUrls = await Promise.all(
      images.map(async (image) => {
        const uploadResult = await cloudinary.uploader
          .upload(image.path, {
            resource_type: "image",
            folder: "designs",
          })
          .catch((err) => {
            console.error("Cloudinary upload error:", err);
            throw new Error("Failed to upload image to Cloudinary");
          });

        return uploadResult.secure_url;
      })
    );

    const design = new designModel({
      name,
      category,
      image: imageUrls,
      designer: designerId,
      isTrendingDesign: isTrendingDesign === "true",
    });

    console.log("Saving design:", design);
    const savedDesign = await design.save();
    if (!savedDesign) {
      console.error("Error saving design to DB:", design);
    }
    res.json({ success: true, message: "Design added successfully", design });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

export { addDesign, listDesigns, listTrendingDesigns };
