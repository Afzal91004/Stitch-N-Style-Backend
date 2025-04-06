// orderController.js
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import razorpay from "razorpay";
import crypto from "crypto";

const verifyRazorpayPayment = async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    orderId,
  } = req.body;

  try {
    // Input validation
    if (
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature ||
      !orderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields for payment verification",
      });
    }

    // Find the order first to ensure it exists and hasn't been verified already
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.payment === true) {
      return res.status(400).json({
        success: false,
        message: "Order has already been paid",
      });
    }

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Log the failed verification attempt
      console.warn("Payment signature verification failed", {
        orderId,
        razorpay_order_id,
        razorpay_payment_id,
      });

      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Update order and clear cart in a transaction
    const session = await orderModel.startSession();
    try {
      await session.withTransaction(async () => {
        // Update order status
        await orderModel.findByIdAndUpdate(
          orderId,
          {
            payment: true,
            paymentId: razorpay_payment_id,
            paymentOrderId: razorpay_order_id,
            paymentSignature: razorpay_signature,
            status: "Processing", // Update initial order status
            updatedAt: new Date(),
          },
          { session }
        );

        // Clear user's cart
        await userModel.findByIdAndUpdate(
          order.userId,
          { cartData: {} },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    // Send success response
    res.json({
      success: true,
      message: "Payment verified successfully",
      orderId: order._id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred during payment verification",
    });
  }
};

// globalVar
const currency = "usd";
const deliveryCharges = 49;

// Gateway initalization
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

// COD payment Method
const placeOrderCod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { items, amount, address } = req.body;

    if (!items || !amount || !address) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: items, amount, and address are required",
      });
    }

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    // Clear the user's cart after successful order
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.error("Order placement error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Stripe Payment Method
const placeOrderStripe = async (req, res) => {
  try {
    const userId = req.user._id;
    const { items, amount, address } = req.body;
    const { origin } = req.headers;

    if (!items || !amount || !address) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: items, amount, and address are required",
      });
    }

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "Stripe",
      payment: true,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    const line_items = items.map((item) => ({
      price_data: {
        currency: currency,
        product_data: {
          name: item.name,
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: currency,
        product_data: {
          name: "Delivery Charges",
        },
        unit_amount: deliveryCharges * 100,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: "payment",
    });

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    console.error("Stripe order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// verify Stripe payment
const verifyStripe = async (req, res) => {
  const { orderId, success } = req.body;
  const userId = req.user._id;

  try {
    if (success === "true") {
      await orderModel.findByIdAndUpdate(orderId, { payment: true });
      await userModel.findByIdAndUpdate(userId, { cartData: {} });
      res.json({ success: true });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false });
    }
  } catch (error) {}
};

// Razorpay Payment Method
const placeOrderRazorpay = async (req, res) => {
  try {
    const userId = req.user._id;
    const { items, amount, address } = req.body;

    if (!items || !amount || !address) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: items, amount, and address are required",
      });
    }

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "Razorpay", // Fixed from "Stripe" to "Razorpay"
      payment: false, // Should start as false until payment is confirmed
      date: Date.now(),
    };

    const newOrder = await orderModel(orderData).save();

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: newOrder._id.toString(),
    };

    // Create Razorpay order using Promise
    const razorpayOrder = await new Promise((resolve, reject) => {
      razorpayInstance.orders.create(options, (error, order) => {
        if (error) {
          reject(error);
        } else {
          resolve(order);
        }
      });
    });

    // Return order details
    return res.json({
      success: true,
      order: razorpayOrder,
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error("Razorpay order error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// User's all order data
const allOrdersFrontendUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const orders = await orderModel.find({ userId });
    res.json({ success: true, orders });
  } catch (error) {
    console.error("Fetch user orders error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// all orders data admin
const allOrdersAdmin = async (req, res) => {
  try {
    const orders = await orderModel.find();
    res.json({ success: true, orders });
  } catch (error) {
    console.error("Admin fetch orders error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// update order status
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "Order ID and status are required",
      });
    }

    const order = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({ success: true, message: "Order Status updated" });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  allOrdersAdmin,
  allOrdersFrontendUser,
  placeOrderCod,
  placeOrderRazorpay,
  placeOrderStripe,
  updateStatus,
  verifyStripe,
  verifyRazorpayPayment,
};
