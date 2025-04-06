import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDb from "./config/mongodb.js";
import cloudinary from "./config/cloudinary.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userModel from "./models/userModel.js";

dotenv.config();

// Route imports
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import designRouter from "./routes/designRoute.js";
import customOrderRouter from "./routes/customOrderRoute.js";
import designerRoutes from "./routes/designerRoutes.js";

// config
const app = express();
const port = process.env.PORT || 4000;

console.log("Cloudinary config check:", {
  hasCloudName: !!process.env.CLOUDINARY_NAME,
  hasApiKey: !!process.env.CLOUDINARY_API_KEY,
  hasApiSecret: !!process.env.CLOUDINARY_SECRET_KEY,
});

// middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:5177",
      "http://localhost:5178",
      // Add your production domains
      "https://stitch-n-style.vercel.app",
      "https://stitch-n-style-frontend.vercel.app",
      // If using Vercel preview deployments
      "https://*.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.options("*", cors());

// Database and Cloudinary connection
connectDb();

// API endpoints
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/design", designRouter);
app.use("/api/designer", designerRoutes);
app.use("/api/custom-order", customOrderRouter); // Keep this route last to avoid conflicts

// Health check route
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "API Working",
    version: "1.0.0",
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(port, () => {
  console.log(`Server started on PORT: ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err);
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

export default app;
