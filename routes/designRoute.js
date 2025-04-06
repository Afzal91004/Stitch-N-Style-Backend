import express from "express";
import { uploadToCloudinary } from "../utils/cloudinary.js";
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

    // Convert buffer to base64
    const base64String = req.file.buffer.toString("base64");
    const uploadString = `data:${req.file.mimetype};base64,${base64String}`;

    // Upload to Cloudinary
    const result = await uploadToCloudinary(uploadString);

    res.status(200).json({
      message: "File uploaded successfully",
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res
      .status(500)
      .json({ message: "Error uploading file", error: error.message });
  }
});

export default router;
