const express = require("express");

const adminMiddleware = require("../Middlewere/adminMiddleware");
const {
  getCategories,
  getFeaturedCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../Controllers/categoryController");

const router = express.Router();

router.get("/", getCategories);
router.get("/featured", getFeaturedCategories);
router.get("/:slug", getCategoryBySlug);
router.post("/", adminMiddleware, createCategory);
router.put("/:id", adminMiddleware, updateCategory);
router.delete("/:id", adminMiddleware, deleteCategory);

module.exports = router;
