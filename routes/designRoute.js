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
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload buffer directly to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);

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
