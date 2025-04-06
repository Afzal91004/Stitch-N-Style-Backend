import CustomOrder from "../models/customOrderModel.js";
import razorpay from "razorpay";
import crypto from "crypto";
import userModel from "../models/userModel.js";
import cloudinary from "cloudinary";
import fs from "fs/promises";

// Initialize Razorpay
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// Create Custom Order
const createCustomOrder = async (req, res) => {
  try {
    const { measurements, design } = req.body;

    // Handle file uploads with Cloudinary using buffer
    const uploadPromises =
      req.files?.map(async (file) => {
        const b64 = Buffer.from(file.buffer).toString("base64");
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "custom-orders",
        });
        return result.secure_url;
      }) || [];

    const uploadedImages = await Promise.all(uploadPromises);

    const customOrder = new CustomOrder({
      customer: req.user._id,
      measurements:
        typeof measurements === "string"
          ? JSON.parse(measurements)
          : measurements,
      design: typeof design === "string" ? JSON.parse(design) : design,
      referenceImages: uploadedImages,
      status: "pending",
    });

    await customOrder.save();

    res.status(201).json({
      success: true,
      order: customOrder,
    });
  } catch (error) {
    console.error("Custom order creation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create custom order",
    });
  }
};

// Accept Bid and Process Payment
const acceptBid = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { shippingAddress, paymentMethod } = req.body;

    // Validate inputs
    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Shipping address and payment method are required",
      });
    }

    const order = await CustomOrder.findOne({
      _id: orderId,
      customer: req.user._id,
      status: "pending",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not eligible for payment",
      });
    }

    if (!order.price) {
      return res.status(400).json({
        success: false,
        message: "No bid price set for this order",
      });
    }

    // Update order with shipping details
    order.shippingAddress = shippingAddress;
    order.paymentMethod = paymentMethod;
    order.status = paymentMethod === "cod" ? "accepted" : "waiting_payment";

    await order.save();

    // If COD, just return success
    if (paymentMethod === "cod") {
      return res.json({
        success: true,
        message: "Order accepted successfully (COD)",
        order,
      });
    }

    // If Razorpay, create payment order
    if (paymentMethod === "razorpay") {
      const options = {
        amount: order.price * 100, // Razorpay expects amount in paise
        currency: "INR",
        receipt: order._id.toString(),
      };

      const razorpayOrder = await razorpayInstance.orders.create(options);

      return res.json({
        success: true,
        order: razorpayOrder,
        orderId: order._id,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Unsupported payment method",
    });
  } catch (error) {
    console.error("Bid acceptance error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to accept bid",
    });
  }
};

// Verify Razorpay Payment
const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    // Verify the payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Update order status
    const order = await CustomOrder.findByIdAndUpdate(
      orderId,
      {
        status: "in_progress",
        paymentDetails: {
          method: "razorpay",
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          signature: razorpay_signature,
          verifiedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
};

// Process COD Payment
const processCodPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    console.log("Processing COD payment for order:", orderId);

    const order = await CustomOrder.findOne({
      _id: orderId,
      customer: req.user._id,
    });

    if (!order) {
      console.log("Order not found:", orderId);
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status !== "accepted" && order.status !== "pending") {
      console.log("Invalid order status:", order.status);
      return res.status(400).json({
        success: false,
        message: "Order is not in a valid state for COD payment",
      });
    }

    const updatedOrder = await CustomOrder.findByIdAndUpdate(
      orderId,
      {
        $set: {
          status: "in_progress",
          paymentMethod: "cod",
          paymentDetails: {
            method: "cod",
            verifiedAt: new Date(),
          },
          estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        },
      },
      { new: true }
    );

    console.log("Order updated successfully:", updatedOrder);
    res.json({
      success: true,
      message: "COD payment processed successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("COD processing error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process COD payment",
    });
  }
};

// Get User's Custom Orders
const getUserOrders = async (req, res) => {
  try {
    const orders = await CustomOrder.find({ customer: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};

// Get Order Details
const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await CustomOrder.findOne({
      _id: orderId,
      customer: req.user._id,
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Get order details error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch order details",
    });
  }
};

// Cancel Order
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await CustomOrder.findOneAndUpdate(
      {
        _id: orderId,
        customer: req.user._id,
        status: { $in: ["pending", "accepted"] },
      },
      {
        $set: {
          status: "cancelled",
          cancelledAt: new Date(),
        },
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or cannot be cancelled",
      });
    }

    res.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel order",
    });
  }
};

const createRazorpayOrder = async (req, res) => {
  try {
    const { orderId, amount } = req.body;

    // Validate inputs
    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Order ID and amount are required",
      });
    }

    // Verify order exists and belongs to user
    const order = await CustomOrder.findOne({
      _id: orderId,
      customer: req.user._id,
      status: { $in: ["pending", "accepted", "waiting_payment"] },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or not eligible for payment",
      });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: order._id.toString(),
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    // Update order status if needed
    if (order.status === "pending") {
      order.status = "waiting_payment";
      await order.save();
    }

    res.json({
      success: true,
      order: razorpayOrder,
      orderId: order._id,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create Razorpay order",
    });
  }
};

// Add this new controller function at the end
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "Order ID and status are required",
      });
    }

    const validStatuses = [
      "pending",
      "accepted",
      "waiting_payment",
      "in_progress",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const order = await CustomOrder.findOneAndUpdate(
      {
        _id: orderId,
        customer: req.user._id,
      },
      {
        $set: { status },
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update order status",
    });
  }
};

// Update the exports at the bottom to include the new function
export {
  createCustomOrder,
  acceptBid,
  verifyRazorpayPayment,
  processCodPayment,
  getUserOrders,
  getOrderDetails,
  cancelOrder,
  createRazorpayOrder,
  updateOrderStatus,
};
