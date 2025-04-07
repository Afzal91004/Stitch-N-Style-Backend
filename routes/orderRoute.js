// orderRoute.js
import express from "express";
import {
  allOrdersAdmin,
  allOrdersFrontendUser,
  placeOrderCod,
  placeOrderRazorpay,
  placeOrderStripe,
  updateStatus,
  verifyStripe,
  verifyRazorpayPayment,
} from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";

const orderRouter = express.Router();

// admin features
orderRouter.get("/list", allOrdersAdmin);
orderRouter.post("/status", updateStatus);

// Payment Method
orderRouter.post("/place-cod", authUser, placeOrderCod);
orderRouter.post("/stripe", authUser, placeOrderStripe);
orderRouter.post("/razorpay", authUser, placeOrderRazorpay);

// user feature
orderRouter.post("/userorders", authUser, allOrdersFrontendUser);

// verify payment
orderRouter.post("/verifyStripe", authUser, verifyStripe);
orderRouter.post("/verifyRazorpay", authUser, verifyRazorpayPayment);

export default orderRouter;
