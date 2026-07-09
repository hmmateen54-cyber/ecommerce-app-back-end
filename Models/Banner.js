const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    badge: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      required: true,
      trim: true,
    },
    buttonText: {
      type: String,
      default: "Shop Now",
      trim: true,
    },
    buttonLink: {
      type: String,
      default: "/products",
      trim: true,
    },
    sectionType: {
      type: String,
      enum: ["hero", "sale", "featured", "new-arrivals", "category-banner"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Banner", bannerSchema);
