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
});

const productRouter = express.Router();

productRouter.post(
  "/add",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  addProduct
);
productRouter.post("/remove", adminAuth, removeProduct);
productRouter.post("/single", adminAuth, singleProduct);
productRouter.get("/list", listProducts);
productRouter.post("/edit", adminAuth, editProduct);

export default productRouter;
