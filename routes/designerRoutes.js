// routes/designerRoute.js
import express from "express";
import CustomOrder from "../models/customOrderModel.js";
import mongoose from "mongoose";

const designerRoutes = express.Router();

// Get all custom orders for designers to view
designerRoutes.get("/custom-orders", async (req, res) => {
  try {
    const orders = await CustomOrder.find({ status: "pending" }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching custom orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch custom orders",
    });
  }
});

// Accept/bid on an order
designerRoutes.post("/custom-orders/:id/accept", async (req, res) => {
  try {
    const { price, designerId } = req.body;

    // Validate inputs
    if (!price || isNaN(parseFloat(price))) {
      return res.status(400).json({
        success: false,
        message: "Valid price is required",
      });
    }

    if (!designerId || !mongoose.Types.ObjectId.isValid(designerId)) {
      return res.status(400).json({
        success: false,
        message: "Valid designer ID is required",
      });
    }

    // Check if order exists
    const order = await CustomOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update the order
    order.price = parseFloat(price);
    order.assignedDesigner = designerId;
    order.status = "accepted";
    order.updatedAt = new Date();

    await order.save();

    res.json({
      success: true,
      message: "Order accepted successfully",
      order,
    });
  } catch (error) {
    console.error("Error accepting order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept order",
    });
  }
});

// Update order progress
designerRoutes.post("/custom-orders/:id/progress", async (req, res) => {
  try {
    const { progress } = req.body;

    // Validate progress value
    const progressValue = parseInt(progress);
    if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Valid progress percentage (0-100) is required",
      });
    }

    const order = await CustomOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update order progress
    order.progress = progressValue;
    // Update status based on progress
    if (progressValue >= 100) {
      order.status = "completed";
    } else if (progressValue > 0) {
      order.status = "in_progress";
    }
    order.updatedAt = new Date();

    await order.save();

    res.json({
      success: true,
      message: "Order progress updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update progress",
    });
  }
});

// Add these routes to your existing designerRoutes.js file

// Get accepted orders
designerRoutes.get("/accepted-orders", async (req, res) => {
  try {
    const orders = await CustomOrder.find({
      status: { $in: ["accepted", "in_progress", "completed", "shipped"] },
    }).sort({ updatedAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching accepted orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch accepted orders",
    });
  }
});

// Update order status
designerRoutes.put("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    // Validate status transition
    const validStatuses = [
      "accepted",
      "in_progress",
      "completed",
      "shipped",
      "delivered",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const order = await CustomOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Validate status transition flow
    const statusFlow = {
      accepted: ["in_progress"],
      in_progress: ["completed"],
      completed: ["shipped"],
      shipped: ["delivered"],
    };

    if (
      statusFlow[order.status] &&
      !statusFlow[order.status].includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${order.status} to ${status}`,
      });
    }

    // Update order status and set the corresponding timestamp
    order.status = status;
    order.updatedAt = new Date();

    // Set specific timestamps based on status
    if (status === "in_progress") {
      order.inProgressAt = new Date();
    } else if (status === "completed") {
      order.completedAt = new Date();
    } else if (status === "shipped") {
      order.shippedAt = new Date();
    } else if (status === "delivered") {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
    });
  }
});

// Add this new route
designerRoutes.post("/orders/:id/tracking", async (req, res) => {
  try {
    const { trackingNumber, carrier } = req.body;
    const orderId = req.params.id;

    if (!trackingNumber || !carrier) {
      return res.status(400).json({
        success: false,
        message: "Tracking number and carrier are required",
      });
    }

    const order = await CustomOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.tracking = {
      number: trackingNumber,
      carrier: carrier,
      updatedAt: new Date(),
    };

    if (order.status === "completed") {
      order.status = "shipped";
      order.shippedAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: "Tracking information updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating tracking info:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update tracking information",
    });
  }
});

export default designerRoutes;
