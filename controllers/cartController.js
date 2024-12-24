import userModel from "../models/userModel.js";

const addToCart = async (req, res) => {
  try {
    const userId = req.user._id; // Get from auth middleware
    const { itemId, size } = req.body;

    if (!itemId || !size) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const userData = await userModel.findById(userId);
    const cartData = userData.cartData || {};

    if (!cartData[itemId]) {
      cartData[itemId] = {};
    }
    cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { cartData },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      cartData: updatedUser.cartData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add item to cart",
    });
  }
};

const getUserCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const userData = await userModel.findById(userId);

    res.status(200).json({
      success: true,
      cartData: userData.cartData || {},
    });
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
    });
  }
};

const updateCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId, size, quantity } = req.body;

    if (!itemId || !size || typeof quantity !== "number") {
      return res.status(400).json({
        success: false,
        message: "Invalid input parameters",
      });
    }

    const userData = await userModel.findById(userId);
    const cartData = userData.cartData || {};

    if (quantity <= 0) {
      if (cartData[itemId]) {
        delete cartData[itemId][size];
        if (Object.keys(cartData[itemId]).length === 0) {
          delete cartData[itemId];
        }
      }
    } else {
      if (!cartData[itemId]) cartData[itemId] = {};
      cartData[itemId][size] = quantity;
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { cartData },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Cart updated",
      cartData: updatedUser.cartData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update cart",
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { cartData: {} },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      cartData: updatedUser.cartData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to clear cart",
    });
  }
};

export { addToCart, updateCart, getUserCart, clearCart };
