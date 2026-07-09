// Models/HomePageDesign.js

const mongoose = require("mongoose");

const homePageDesignSchema = new mongoose.Schema(
  {
    // 🔥 Banner Section
    bannerTitle: {
      type: String,
      required: true,
    },

    bannerSubtitle: {
      type: String,
      required: true,
    },

    bannerImage: {
      type: String,
      required: true,
    },

    bannerButtonText: {
      type: String,
      default: "Shop Now",
    },

    bannerButtonLink: {
      type: String,
      default: "/shop",
    },

    // 🔥 Homepage Section Visibility
    showCategories: {
      type: Boolean,
      default: true,
    },

    showFeaturedProducts: {
      type: Boolean,
      default: true,
    },

    showNewArrivals: {
      type: Boolean,
      default: true,
    },

    showReviews: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("HomePageDesign", homePageDesignSchema);
