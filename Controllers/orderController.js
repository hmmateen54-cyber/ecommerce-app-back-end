const Order = require("../Models/Order");
const Product = require("../Models/Product");
const asyncHandler = require("../Middlewere/asyncHandler");

const allowedStatuses = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const normalizeItems = (items = []) =>
  items
    .map((item) => ({
      product: item.product || item.productId || item._id,
      quantity: Math.max(Number(item.quantity || 1), 1),
      selectedShadeName: item.selectedShadeName || "",
      selectedShadeColor: item.selectedShadeColor || "",
      selectedShadeImage: item.selectedShadeImage || "",
      sku: item.sku || "",
    }))
    .filter((item) => item.product);

exports.createOrder = asyncHandler(async (req, res) => {
  const {
    fullName,
    email,
    phone,
    completeAddress,
    city,
    postalCode = "",
    notes = "",
  } = req.body;

  if (!fullName || !email || !phone || !completeAddress || !city) {
    res.status(400);
    throw new Error("Full name, email, phone, address, and city are required");
  }

  const cartItems = normalizeItems(req.body.items);

  if (!cartItems.length) {
    res.status(400);
    throw new Error("Cart is empty");
  }

  const productIds = [...new Set(cartItems.map((item) => item.product))];
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true,
  });
  const productMap = new Map(
    products.map((product) => [product._id.toString(), product]),
  );

  if (products.length !== productIds.length) {
    res.status(400);
    throw new Error("One or more products are unavailable");
  }

  const items = cartItems.map((item) => {
    const product = productMap.get(item.product.toString());
    const shades = product.shades || [];
    const selectedShade = item.selectedShadeName
      ? shades.find((shade) => shade.shadeName === item.selectedShadeName)
      : null;

    if (shades.length && !selectedShade) {
      res.status(400);
      throw new Error(`Please select a valid shade for ${product.name}`);
    }

    if (
      selectedShade &&
      (!selectedShade.isAvailable || Number(selectedShade.stock || 0) < item.quantity)
    ) {
      res.status(400);
      throw new Error(`${product.name} shade ${selectedShade.shadeName} is unavailable`);
    }

    if (!selectedShade && Number(product.stock || 0) < item.quantity) {
      res.status(400);
      throw new Error(`${product.name} is unavailable`);
    }

    const price = Number(
      selectedShade?.price || product.discountPrice || product.price || 0,
    );
    const subtotal = price * item.quantity;
    const image = selectedShade?.shadeImage || product.images?.[0] || "";

    return {
      product: product._id,
      name: product.name,
      image,
      price,
      quantity: item.quantity,
      subtotal,
      selectedShadeName: selectedShade?.shadeName || "",
      selectedShadeColor: selectedShade?.shadeColor || "",
      selectedShadeImage: selectedShade?.shadeImage || "",
      sku: selectedShade?.sku || item.sku || "",
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const deliveryCharges = 0;
  const totalAmount = subtotal + deliveryCharges;

  const order = await Order.create({
    user: req.user?._id || null,
    customer: {
      fullName,
      email: email.trim().toLowerCase(),
      phone,
      completeAddress,
      city,
      postalCode,
      notes,
    },
    items,
    subtotal,
    deliveryCharges,
    totalAmount,
    paymentMethod: "Cash on Delivery",
    paymentStatus: "Pending",
    orderStatus: "Pending",
  });

  res.status(201).json({
    success: true,
    message: "Your order has been placed successfully. You will pay Cash on Delivery.",
    order,
  });
});

exports.getAdminOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    orders,
  });
});

exports.getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });

  res.json({
    success: true,
    orders,
  });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid order status");
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.orderStatus = status;
  await order.save();

  res.json({
    success: true,
    order,
  });
});
