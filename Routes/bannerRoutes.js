const express = require("express");

const adminMiddleware = require("../Middlewere/adminMiddleware");
const { uploadBannerImage } = require("../Middlewere/upload");
const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../Controllers/bannerController");

const router = express.Router();

router.get("/", getBanners);
router.post("/", adminMiddleware, uploadBannerImage, createBanner);
router.put("/:id", adminMiddleware, uploadBannerImage, updateBanner);
router.delete("/:id", adminMiddleware, deleteBanner);

module.exports = router;
