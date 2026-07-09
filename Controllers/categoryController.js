const Category = require("../Models/Category");
const Product = require("../Models/Product");
const asyncHandler = require("../Middlewere/asyncHandler");
const slugify = require("../utils/slugify");

const withProductCounts = async (categories) => {
  const ids = categories.map((category) => category._id);
  const counts = await Product.aggregate([
    {
      $match: {
        isActive: true,
        category: { $in: ids },
      },
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: 1 },
      },
    },
  ]);

  const countsMap = counts.reduce((acc, item) => {
    acc[item._id.toString()] = item.total;
    return acc;
  }, {});

  return categories.map((category) => ({
    ...category.toObject(),
    productsCount: countsMap[category._id.toString()] || 0,
  }));
};

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({
    categoryName: 1,
    createdAt: 1,
  });

  const data = await withProductCounts(categories);

  res.json({
    success: true,
    categories: data,
  });
});

exports.getFeaturedCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true }).sort({
    categoryName: 1,
    createdAt: 1,
  });

  const data = await withProductCounts(categories);

  res.json({
    success: true,
    categories: data,
  });
});

exports.getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({
    slug: req.params.slug,
    isActive: true,
  });

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const [categoryWithCount] = await withProductCounts([category]);

  res.json({
    success: true,
    category: categoryWithCount,
  });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const categoryName = (req.body.categoryName || req.body.name || "").trim();

  if (!categoryName) {
    res.status(400);
    throw new Error("Category name is required");
  }

  const slug = slugify(req.body.slug || categoryName);

  const existing = await Category.findOne({
    $or: [
      { slug },
      { categoryName: { $regex: `^${categoryName}$`, $options: "i" } },
    ],
  });

  if (existing) {
    res.status(409);
    throw new Error("Category already exists");
  }

  const category = await Category.create({
    categoryName,
    name: categoryName,
    slug,
    isActive: req.body.isActive === undefined ? true : req.body.isActive,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    category,
  });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  const categoryName = (
    req.body.categoryName ||
    req.body.name ||
    category.categoryName ||
    category.name ||
    ""
  ).trim();

  if (!categoryName) {
    res.status(400);
    throw new Error("Category name is required");
  }

  const nextSlug = slugify(req.body.slug || categoryName);

  const existing = await Category.findOne({
    $or: [
      { slug: nextSlug },
      { categoryName: { $regex: `^${categoryName}$`, $options: "i" } },
    ],
    _id: { $ne: category._id },
  });

  if (existing) {
    res.status(409);
    throw new Error("Category already exists");
  }

  category.categoryName = categoryName;
  category.name = categoryName;
  category.slug = nextSlug;
  category.isActive = req.body.isActive ?? category.isActive;

  await category.save();

  res.json({
    success: true,
    message: "Category updated successfully",
    category,
  });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  category.isActive = false;
  await category.save();

  res.json({
    success: true,
    message: "Category deactivated successfully",
  });
});
