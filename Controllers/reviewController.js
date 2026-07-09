const Review = require("../Models/Review");
const asyncHandler = require("../Middlewere/asyncHandler");

exports.getReviews = asyncHandler(async (req, res) => {
  const filter = req.query.all === "true" ? {} : { isActive: true };
  const reviews = await Review.find(filter).sort({ createdAt: -1 });

  res.json({
    success: true,
    reviews,
  });
});

exports.createReview = asyncHandler(async (req, res) => {
  const review = await Review.create({
    customerName: req.body.customerName,
    customerImage: req.body.customerImage || "",
    rating: Number(req.body.rating),
    message: req.body.message,
    role: req.body.role || "Beauty Customer",
    isActive: req.body.isActive !== false,
  });

  res.status(201).json({
    success: true,
    review,
  });
});

exports.updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  review.customerName = req.body.customerName ?? review.customerName;
  review.customerImage = req.body.customerImage ?? review.customerImage;
  review.rating = req.body.rating ?? review.rating;
  review.message = req.body.message ?? review.message;
  review.role = req.body.role ?? review.role;
  review.isActive = req.body.isActive ?? review.isActive;

  await review.save();

  res.json({
    success: true,
    review,
  });
});

exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  review.isActive = false;
  await review.save();

  res.json({
    success: true,
    message: "Review deactivated successfully",
  });
});
