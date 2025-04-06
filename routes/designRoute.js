import express from "express";
import { uploadToCloudinary } from "../config/cloudinary.js";
import upload from "../middleware/multer.js";
import {
  addDesign,
  listDesigns,
  listTrendingDesigns,
} from "../controllers/designController.js";

const router = express.Router();

router.get("/trending-designs", listTrendingDesigns);

router.post("/add", upload.array("images", 4), addDesign);
router.get("/list", listDesigns);

router.post("/upload", upload.single("design"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only JPG, JPEG and PNG are allowed",
      });
    }

    // Validate file size (e.g., max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB",
      });
    }

    // Upload buffer directly to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);

    if (!result || !result.secure_url) {
      return res.status(500).json({
        success: false,
        message: "Failed to upload to Cloudinary",
      });
    }

    res.status(200).json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading file",
      error: error.message,
    });
  }
});

export default router;
