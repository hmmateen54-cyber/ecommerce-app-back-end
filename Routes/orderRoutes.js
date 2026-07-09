const express = require("express");

const adminMiddleware = require("../Middlewere/adminMiddleware");
const authMiddleware = require("../Middlewere/Middlewere");
const optionalAuthMiddleware = require("../Middlewere/optionalAuthMiddleware");
const {
  createOrder,
  getAdminOrders,
  getMyOrders,
  updateOrderStatus,
} = require("../Controllers/orderController");

const router = express.Router();

router.post("/", optionalAuthMiddleware, createOrder);
router.get("/admin", adminMiddleware, getAdminOrders);
router.get("/my-orders", authMiddleware, getMyOrders);
router.patch("/:id/status", adminMiddleware, updateOrderStatus);

module.exports = router;
