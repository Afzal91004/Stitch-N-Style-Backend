import express from "express";
import { uploadToCloudinary } from "../config/cloudinary.js";
import upload from "../middleware/multer.js";
import {
  addDesign,
  listDesigns,
  listTrendingDesigns,
} from "../controllers/designController.js";
import multer from "multer";

const router = express.Router();

router.get("/trending-designs", listTrendingDesigns);

// Update the upload middleware error handling
const handleUpload = upload.single("design");

router.post("/upload", (req, res) => {
  handleUpload(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: "File upload error",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

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
});

router.post("/add", upload.array("images", 4), addDesign);
router.get("/list", listDesigns);

export default router;
