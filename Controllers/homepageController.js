const Banner = require("../Models/Banner");
const Category = require("../Models/Category");
const Product = require("../Models/Product");
const Review = require("../Models/Review");
const asyncHandler = require("../Middlewere/asyncHandler");

exports.getHomepageData = asyncHandler(async (req, res) => {
  const [
    heroBanners,
    saleBanners,
    featuredCategories,
    featuredProducts,
    newArrivals,
    reviews,
  ] = await Promise.all([
    Banner.find({ isActive: true, sectionType: "hero" }).sort({
      sortOrder: 1,
      createdAt: 1,
    }),
    Banner.find({ isActive: true, sectionType: "sale" }).sort({
      sortOrder: 1,
      createdAt: 1,
    }),
    Category.find({ isActive: true }).sort({
      categoryName: 1,
      createdAt: 1,
    }).limit(8),
    Product.find({ isActive: true, isFeatured: true })
      .populate("category", "name slug type")
      .sort({ createdAt: -1 })
      .limit(8),
    Product.find({ isActive: true, isNewArrival: true })
      .populate("category", "name slug type")
      .sort({ createdAt: -1 })
      .limit(8),
    Review.find({ isActive: true }).sort({ createdAt: -1 }).limit(6),
  ]);

  const categoryIds = featuredCategories.map((category) => category._id);
  const categoryCounts = await Product.aggregate([
    {
      $match: {
        isActive: true,
        category: { $in: categoryIds },
      },
    },
    {
      $group: {
        _id: "$category",
        total: { $sum: 1 },
      },
    },
  ]);

  const categoryMap = categoryCounts.reduce((acc, item) => {
    acc[item._id.toString()] = item.total;
    return acc;
  }, {});

  const categories = featuredCategories.map((category) => ({
    ...category.toObject(),
    productsCount: categoryMap[category._id.toString()] || 0,
  }));

  res.json({
    success: true,
    homepage: {
      heroBanners,
      saleBanners,
      featuredCategories: categories,
      featuredProducts,
      newArrivals,
      reviews,
    },
  });
});
