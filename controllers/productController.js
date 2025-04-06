import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";

// Helper function for image uploads
const uploadImages = async (files) => {
  try {
    const imageKeys = ["image1", "image2", "image3", "image4"];
    const uploadPromises = [];

    // Process each image key
    for (const key of imageKeys) {
      if (files[key] && files[key][0]) {
        const file = files[key][0];
        // Upload buffer directly to Cloudinary
        const uploadPromise = cloudinary.uploader
          .upload_stream({
            resource_type: "auto",
            folder: "products",
          })
          .end(file.buffer);

        uploadPromises.push(uploadPromise);
      }
    }

    const results = await Promise.all(uploadPromises);
    return results.map((result) => result.secure_url);
  } catch (error) {
    console.error("Image upload error:", error);
    throw new Error("Failed to upload images");
  }
};

// Validate product data
const validateProductData = (data) => {
  const errors = [];

  if (!data.name || data.name.length < 3) {
    errors.push("Name must be at least 3 characters long");
  }

  if (!data.description || data.description.length < 10) {
    errors.push("Description must be at least 10 characters long");
  }

  const price = parseFloat(data.price);
  if (isNaN(price) || price <= 0) {
    errors.push("Price must be a positive number");
  }

  if (!data.category) {
    errors.push("Category is required");
  }

  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }

  return {
    ...data,
    price,
    bestSeller: data.bestSeller === "true",
    sizes: typeof data.sizes === "string" ? JSON.parse(data.sizes) : data.sizes,
  };
};

const addProduct = async (req, res) => {
  try {
    const validatedData = validateProductData(req.body);

    // Check if files exist
    if (!req.files || Object.keys(req.files).length === 0) {
      throw new Error("At least one image is required");
    }

    // Upload images
    const imageUrls = await uploadImages(req.files);

    if (imageUrls.length === 0) {
      throw new Error("Failed to upload images");
    }

    const product = new productModel({
      ...validatedData,
      image: imageUrls,
      date: Date.now(),
    });

    await product.save();

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
      errors: error.message.split(", "),
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
