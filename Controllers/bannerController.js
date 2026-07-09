const Banner = require("../Models/Banner");
const asyncHandler = require("../Middlewere/asyncHandler");

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return value === "true" || value === "1" || value === 1;
};

exports.getBanners = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.activeOnly === "true") {
    filter.isActive = true;
  }

  if (req.query.sectionType) {
    filter.sectionType = req.query.sectionType;
  }

  const banners = await Banner.find(filter).sort({
    sectionType: 1,
    sortOrder: 1,
    createdAt: 1,
  });

  res.json({
    success: true,
    banners,
  });
});

exports.createBanner = asyncHandler(async (req, res) => {
  const uploadedImage = req.file ? `/uploads/banners/${req.file.filename}` : null;
  const image = uploadedImage || req.body.image;

  if (!image) {
    res.status(400);
    throw new Error("Banner image is required");
  }

  const banner = await Banner.create({
    title: req.body.title,
    subtitle: req.body.subtitle || "",
    badge: req.body.badge || "",
    image,
    buttonText: req.body.buttonText || "Shop Now",
    buttonLink: req.body.buttonLink || "/products",
    sectionType: req.body.sectionType,
    isActive: parseBoolean(req.body.isActive, true),
    sortOrder: Number(req.body.sortOrder || 0),
  });

  res.status(201).json({
    success: true,
    banner,
  });
});

exports.updateBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    res.status(404);
    throw new Error("Banner not found");
  }

  banner.title = req.body.title ?? banner.title;
  banner.subtitle = req.body.subtitle ?? banner.subtitle;
  banner.badge = req.body.badge ?? banner.badge;
  banner.image = req.file
    ? `/uploads/banners/${req.file.filename}`
    : req.body.image ?? banner.image;
  banner.buttonText = req.body.buttonText ?? banner.buttonText;
  banner.buttonLink = req.body.buttonLink ?? banner.buttonLink;
  banner.sectionType = req.body.sectionType ?? banner.sectionType;
  banner.isActive =
    req.body.isActive === undefined
      ? banner.isActive
      : parseBoolean(req.body.isActive);
  banner.sortOrder = req.body.sortOrder ?? banner.sortOrder;

  await banner.save();

  res.json({
    success: true,
    banner,
  });
});

exports.deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    res.status(404);
    throw new Error("Banner not found");
  }

  await banner.deleteOne();

  res.json({
    success: true,
    message: "Banner deleted successfully",
  });
});
