import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

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

    // Clear the user's cart after successful order
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.error("Stripe order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
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
      paymentMethod: "Razorpay",
      payment: true,
      date: Date.now(),
    };

    const newOrder = new orderModel(orderData);
    await newOrder.save();

    // Clear the user's cart after successful order
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.error("Razorpay order error:", error);
    res.status(500).json({ success: false, message: error.message });
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
};
