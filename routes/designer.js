import express from "express";
import customOrderModel from "../models/customOrderModel.js";
import Designer from "../models/designer.js";
// import { designerAuth } from "../middleware/designerAuth.js";
import userModel from "../models/userModel.js";

const designersRouter = express.Router();

// Get all available custom orders
designersRouter.get("/custom-orders", async (req, res) => {
  try {
    const orders = await customOrderModel
      .find()
      .populate("customer", "name email")
      .populate("assignedDesigner", "name email");

    res.json(orders);
  } catch (error) {
    console.error("Order fetch error:", error);
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
});

// Accept a custom order
designersRouter.post("/custom-orders/:orderId/accept", async (req, res) => {
  try {
    const { price } = req.body;
    const order = await customOrderModel.findById(req.params.orderId);

    if (!order || order.status !== "pending") {
      return res.status(400).json({ message: "Order not available" });
    }

    order.status = "accepted";
    order.assignedDesigner = req.designer._id;
    order.price = price;
    order.updatedAt = Date.now();

    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error accepting order" });
  }
});

designersRouter.post("/custom-orders/:orderId/progress", async (req, res) => {
  try {
    const { progress } = req.body;
    const order = await customOrderModel.findById(req.params.orderId);

    if (
      !order ||
      order.assignedDesigner.toString() !== req.designer._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    order.status = progress >= 100 ? "completed" : "in_progress";
    order.progress = progress;
    order.updatedAt = Date.now();

    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error updating progress" });
  }
});

designersRouter.get("/active-orders", async (req, res) => {
  try {
    const orders = await customOrderModel
      .find({
        assignedDesigner: req.designer._id,
        status: { $in: ["accepted", "in_progress"] },
      })
      .populate("customer", "name email");

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching active orders" });
  }
});

designersRouter.put("/profile", async (req, res) => {
  try {
    const { specializations, experience, portfolio } = req.body;
    const designer = await Designer.findById(req.designer._id);

    designer.specializations = specializations;
    designer.experience = experience;
    designer.portfolio = portfolio;
    designer.updatedAt = Date.now();

    await designer.save();

    res.json(designer);
  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
});

export default designersRouter;
