import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check for auth header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login.",
        code: "NO_AUTH_HEADER",
      });
    }

    const token = authHeader.split(" ")[1];

    // Validate token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token. Please login again.",
        code: "NO_TOKEN",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user exists and is admin
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User not found. Please login again.",
          code: "USER_NOT_FOUND",
        });
      }

      if (!user.isAdmin) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin privileges required.",
          code: "NOT_ADMIN",
        });
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (tokenError) {
      // Handle specific JWT errors
      if (tokenError.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Session expired. Please login again.",
          code: "TOKEN_EXPIRED",
        });
      }

      if (tokenError.name === "JsonWebTokenError") {
        return res.status(401).json({
          success: false,
          message: "Invalid token. Please login again.",
          code: "INVALID_TOKEN",
        });
      }

      throw tokenError; // Re-throw unexpected errors
    }
  } catch (error) {
    console.error("Authentication error:", {
      message: error.message,
      stack: error.stack,
      type: error.name,
    });

    return res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again.",
      code: "AUTH_ERROR",
    });
  }
};

export default adminAuth;
