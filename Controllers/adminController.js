const Banner = require("../Models/Banner");
const Category = require("../Models/Category");
const ContactMessage = require("../Models/ContactMessage");
const NewsletterSubscriber = require("../Models/NewsletterSubscriber");
const Product = require("../Models/Product");
const Review = require("../Models/Review");
const asyncHandler = require("../Middlewere/asyncHandler");

exports.getAdminOverview = asyncHandler(async (req, res) => {
  const [
    categoriesCount,
    productsCount,
    bannersCount,
    messagesCount,
    subscribersCount,
    reviewsCount,
    featuredProducts,
  ] = await Promise.all([
    Category.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true }),
    Banner.countDocuments({ isActive: true }),
    ContactMessage.countDocuments(),
    NewsletterSubscriber.countDocuments(),
    Review.countDocuments({ isActive: true }),
    Product.find({ isActive: true })
      .populate("category", "name")
      .sort({ rating: -1, reviewsCount: -1 })
      .limit(5),
  ]);

  res.json({
    success: true,
    stats: {
      categoriesCount,
      productsCount,
      bannersCount,
      messagesCount,
      subscribersCount,
      reviewsCount,
    },
    topProducts: featuredProducts,
  });
});
