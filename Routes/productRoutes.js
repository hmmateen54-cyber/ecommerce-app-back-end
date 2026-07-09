const express = require("express");

const adminMiddleware = require("../Middlewere/adminMiddleware");
const { uploadProductImage } = require("../Middlewere/upload");
const {
  getProducts,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../Controllers/productController");

const router = express.Router();

router.get("/", getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/new-arrivals", getNewArrivals);
router.get("/best-sellers", getBestSellers);
router.get("/:idOrSlug", getProductByIdOrSlug);
router.post("/", adminMiddleware, uploadProductImage, createProduct);
router.put("/:id", adminMiddleware, uploadProductImage, updateProduct);
router.delete("/:id", adminMiddleware, deleteProduct);

module.exports = router;
