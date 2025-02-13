import express from "express";
import CustomOrder from "../models/customOrderModel.js";
import authUser from "../middleware/auth.js";
import upload from "../middleware/multer.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs/promises";

const router = express.Router();

router.post("/", authUser, async (req, res) => {
  upload.array("referenceImages", 5)(req, res, async (err) => {
    const uploadedFiles = [];

    try {
      if (err) {
        console.error("Multer error:", err);
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      // Validate files
      if (!req.files || req.files.length === 0) {
        throw new Error("At least one reference image is required");
      }

      // Parse data
      const measurements = JSON.parse(req.body.measurements);
      const design = JSON.parse(req.body.design);

      // Upload images to Cloudinary
      const imageUrls = [];
      for (const file of req.files) {
        try {
          console.log(`Attempting to upload file: ${file.path}`);

          const result = await cloudinary.uploader.upload(file.path, {
            folder: "custom-orders",
            resource_type: "auto",
          });

          console.log(
            `Successfully uploaded to Cloudinary: ${result.secure_url}`
          );
          imageUrls.push(result.secure_url);
          uploadedFiles.push(file.path);
        } catch (uploadError) {
          console.error("Cloudinary upload error details:", uploadError);
          throw new Error(
            `Failed to upload image ${file.originalname}: ${uploadError.message}`
          );
        }
      }

      // Create order
      const customOrder = new CustomOrder({
        customer: req.user._id,
        measurements,
        design,
        referenceImages: imageUrls,
        status: "pending",
        progress: 0,
      });

      await customOrder.save();

      // Clean up uploaded files
      await Promise.all(
        uploadedFiles.map((filePath) =>
          fs.unlink(filePath).catch(console.error)
        )
      );

      res.status(201).json({
        success: true,
        order: customOrder,
      });
    } catch (error) {
      console.error("Custom order error:", error);

      // Clean up any uploaded files
      await Promise.all(
        uploadedFiles
          .concat(req.files?.map((f) => f.path) || [])
          .filter(Boolean)
          .map((filePath) => fs.unlink(filePath).catch(console.error))
      );

      res.status(500).json({
        success: false,
        message: error.message || "Failed to process custom order",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  });
});

export default router;
