import express from "express";
import {
  createCustomOrder,
  acceptBid,
  verifyRazorpayPayment,
  processCodPayment,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  createRazorpayOrder,
  updateOrderStatus,
} from "../controllers/customOrderController.js";
import authUser from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const router = express.Router();

// CRUD operations
router.post(
  "/",
  authUser,
  upload.array("referenceImages", 5),
  createCustomOrder
);
router.get("/", authUser, getUserOrders);
router.get("/:orderId", authUser, getOrderDetails);

// Payment routes
router.post("/razorpay", authUser, createRazorpayOrder);
router.post("/verify-razorpay", authUser, verifyRazorpayPayment);
router.post("/status", authUser, updateOrderStatus);

// Order management routes
router.post("/:orderId/accept-bid", authUser, acceptBid);
router.post("/:orderId/cod", authUser, processCodPayment); // Changed from confirm-cod to cod
router.post("/:orderId/cancel", authUser, cancelOrder);

export default router;
