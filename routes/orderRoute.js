import express from "express";
import {
  allOrdersAdmin,
  allOrdersFrontendUser,
  placeOrderCod,
  placeOrderRazorpay,
  placeOrderStripe,
  updateStatus,
} from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";

const orderRouter = express.Router();

// admin features
orderRouter.post("/list", adminAuth, allOrdersAdmin);
orderRouter.post("/status", adminAuth, updateStatus);

// Payment Method
orderRouter.post("/place", authUser, placeOrderCod);
orderRouter.post("/stripe", authUser, placeOrderStripe);
orderRouter.post("/razorpay", authUser, placeOrderRazorpay);

// user feature
orderRouter.post("/userorders", authUser, allOrdersFrontendUser);

export default orderRouter;
