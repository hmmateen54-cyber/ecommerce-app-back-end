const express = require("express");

const adminMiddleware = require("../Middlewere/adminMiddleware");
const {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
} = require("../Controllers/reviewController");

const router = express.Router();

router.get("/", getReviews);
router.post("/", adminMiddleware, createReview);
router.put("/:id", adminMiddleware, updateReview);
router.delete("/:id", adminMiddleware, deleteReview);

module.exports = router;
