import asyncHandler from "../middlewares/asyncHandler.js";

// @desc Create new order
// @route POST /api/orders
// @access Private
const addOrderItems = asyncHandler(async (req, res) => {
  res.send("Add order items");
});

// @desc Get logged-in user orders
// @route GET /api/orders/my-orders
// @access Private
const getMyOrders = asyncHandler(async (req, res) => {
  res.send("Get my orders");
});

// @desc Get order by ID
// @route GET /api/orders/:id
// @access Private
const getOrderById = asyncHandler(async (req, res) => {
  res.send("Get order by ID");
});

// @desc Update order to PAID
// @route PUT /api/orders/:id/pay
// @access Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  res.send("Update order to PAID");
});

// @desc Update order to DELIVERED
// @route PUT /api/orders/:id/deliver
// @access Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  res.send("Update order to DELIVERED");
});

// @desc GET all orders
// @route GET /api/orders/
// @access Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  res.send("Get All Orders!");
});

export {
  addOrderItems,
  getMyOrders,
  getOrderById,
  getOrders,
  updateOrderToDelivered,
  updateOrderToPaid,
};
