import jwt from "jsonwebtoken";

const adminAuth = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.json({
        success: false,
        message: "Not Authorized. Login Again.",
      });
    }

    // Extract the token after "Bearer"
    const token = authorization.split(" ")[1];

    // Verify the token
    const token_decode = jwt.verify(token, process.env.JWT_SECRET);

    // Check admin credentials
    if (token_decode !== process.env.ADMIN_EMAIL + process.env.ADMIN_PASSWORD) {
      return res.json({
        success: false,
        message: "Not Authorized. Login Again.",
      });
    }

    next(); // Proceed to the next middleware
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Invalid Token" });
  }
};

export default adminAuth;
