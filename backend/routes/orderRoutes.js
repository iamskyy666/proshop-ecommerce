import { Router } from "express";
import {
  addOrderItems,
  getMyOrders,
  getOrderById,
  getOrders,
  updateOrderToDelivered,
  updateOrderToPaid,
} from "../controllers/orderController.js";
import { adminMw, protectMw } from "../middlewares/authMiddleware.js";

const orderRouter = Router();

orderRouter
  .route("/")
  .post(protectMw, addOrderItems)
  .get(protectMw, adminMw, getOrders);

orderRouter.route("/mine").get(protectMw, getMyOrders);

orderRouter.route("/:id").get(protectMw, getOrderById);

orderRouter.route("/:id/pay").put(protectMw, updateOrderToPaid);
orderRouter
  .route("/:id/deliver")
  .put(protectMw, adminMw, updateOrderToDelivered);

export default orderRouter;
