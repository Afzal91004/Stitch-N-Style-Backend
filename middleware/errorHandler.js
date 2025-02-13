export const errorHandler = async (err, req, res, next) => {
  // Clean up uploaded files in case of error
  if (req.files) {
    for (const file of req.files) {
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        console.error("Error deleting file:", unlinkError);
      }
    }
  }

  // Handle specific errors
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: Object.values(err.errors).map((error) => error.message),
    });
  }

  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Handle Cloudinary errors
  if (err.http_code) {
    return res.status(err.http_code).json({
      success: false,
      message: err.message || "Error uploading to cloud storage",
    });
  }

  // Log the full error in development
  if (process.env.NODE_ENV === "development") {
    console.error("Full error:", err);
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
