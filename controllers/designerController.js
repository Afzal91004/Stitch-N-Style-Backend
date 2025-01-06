import designerModel from "../models/designerModel.js";
import { v2 as cloudinary } from "cloudinary";

const addDesigner = async (req, res) => {
  try {
    const { name, email, password, isTopDesigner } = req.body;
    const image = req.files?.image && req.files.image[0];

    let profileImageUrl = "";
    if (image) {
      const uploadResult = await cloudinary.uploader
        .upload(image.path, {
          resource_type: "image",
          folder: "designs",
        })
        .catch((err) => {
          console.error("Cloudinary upload error:", err);
          throw new Error("Failed to upload image to Cloudinary");
        });

      profileImageUrl = uploadResult.secure_url;
    }

    const designer = new designerModel({
      name,
      email,
      password,
      isTopDesigner: isTopDesigner === "true",
      profileImage: profileImageUrl,
    });

    const savedDesigner = await designer.save();
    if (!savedDesigner) {
      console.error("Error saving design to DB:", designer);
    }

    res.json({
      success: true,
      message: "Designer added successfully",
      designer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const listDesigners = async (req, res) => {
  try {
    const designers = await designerModel.find({});
    res.json({ success: true, designers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const listTopDesigners = async (req, res) => {
  try {
    const topDesigners = await designerModel.find({ isTopDesigner: true });
    res.json({ success: true, data: topDesigners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { addDesigner, listDesigners, listTopDesigners };
