import express from "express";
import multer from "multer";
import {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  editProduct,
} from "../controllers/productController.js";
import adminAuth from "../middleware/adminAuth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const productRouter = express.Router();

// Add error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }
  next(err);
};

productRouter.post(
  "/add",
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  handleMulterError,
  addProduct
);
productRouter.post("/remove", adminAuth, removeProduct);
productRouter.post("/single", adminAuth, singleProduct);
productRouter.get("/list", listProducts);
productRouter.post("/edit", adminAuth, editProduct);

export default productRouter;
