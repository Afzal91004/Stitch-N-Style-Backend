import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";

const uploadToCloudinary = async (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "products",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          console.log("Cloudinary upload success:", result);
          resolve(result);
        }
      }
    );

    // Handle potential buffer errors
    try {
      uploadStream.end(buffer);
    } catch (error) {
      console.error("Buffer upload error:", error);
      reject(error);
    }
  });
};

const addProduct = async (req, res) => {
  try {
    // Validate basic fields
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestSeller,
    } = req.body;

    // Enhanced validation with detailed feedback
    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!description) missingFields.push("description");
    if (!price) missingFields.push("price");
    if (!category) missingFields.push("category");
    if (!sizes) missingFields.push("sizes");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        missingFields,
        received: { name, description, price, category, sizes },
      });
    }

    // Validate and parse sizes
    let parsedSizes;
    try {
      parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
      if (!Array.isArray(parsedSizes) || parsedSizes.length === 0) {
        throw new Error("Invalid sizes format");
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid sizes format. Expected JSON array.",
        received: sizes,
      });
    }

    // Handle image uploads
    const imageUrls = [];
    const imageFields = ["image1", "image2", "image3", "image4"];

    for (const field of imageFields) {
      if (req.files?.[field]?.[0]) {
        const file = req.files[field][0];
        try {
          const result = await uploadToCloudinary(file.buffer);
          if (result?.secure_url) {
            imageUrls.push(result.secure_url);
          }
        } catch (error) {
          console.error(`Error uploading ${field}:`, error);
          return res.status(400).json({
            success: false,
            message: `Error uploading ${field}`,
            error: error.message,
          });
        }
      }
    }

    if (imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    // Create product with the correct data structure
    const product = await productModel.create({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category,
      subCategory: subCategory || category,
      sizes: parsedSizes,
      bestSeller: bestSeller === "true" || bestSeller === true,
      image: imageUrls, // Store as simple array of URLs
      date: Date.now(),
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to add product",
      error: error.stack,
    });
  }
};

const listProducts = async (req, res) => {
  try {
    const products = await productModel.find({}).sort({ date: -1 });
    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("List products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

const removeProduct = async (req, res) => {
  try {
    const product = await productModel.findByIdAndDelete(req.body.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
      deletedProduct: product,
    });
  } catch (error) {
    console.error("Remove product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

const editProduct = async (req, res) => {
  try {
    const { id, ...updateData } = req.body;
    const validatedData = validateProductData(updateData);

    // Handle image uploads if any
    const imagesUrl = req.files ? await uploadImages(req.files) : [];

    const update = {
      ...validatedData,
      ...(imagesUrl.length > 0 && { image: imagesUrl }), // Only update images if new ones were uploaded
    };

    const product = await productModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Edit product error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update product",
      errors: error.message.split(", "),
    });
  }
};

const singleProduct = async (req, res) => {
  try {
    const product = await productModel.findById(req.body.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Get single product error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

export { listProducts, addProduct, removeProduct, singleProduct, editProduct };
