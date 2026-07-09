const Category = require("../Models/Category");
const Product = require("../Models/Product");
const asyncHandler = require("../Middlewere/asyncHandler");
const slugify = require("../utils/slugify");
const mongoose = require("mongoose");

const productPopulate = {
  path: "category",
  select: "categoryName name slug type image",
};

const normalizeArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return value === "true" || value === "1" || value === 1;
};

const parseNumber = (value, defaultValue = 0) => {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const number = Number(value);
  return Number.isNaN(number) ? defaultValue : number;
};

const parseJsonArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const getUploadedMainImage = (req) => {
  const file = req.files?.image?.[0] || req.file;
  return file ? `/uploads/products/${file.filename}` : null;
};

const getUploadedShadeImagePath = (file) =>
  file ? `/uploads/products/shades/${file.filename}` : "";

const buildShades = (rawShades, shadeFiles = []) =>
  rawShades
    .map((shade, index) => {
      const fileIndex =
        shade.imageFileIndex === undefined || shade.imageFileIndex === null || shade.imageFileIndex === ""
          ? index
          : Number(shade.imageFileIndex);
      const uploadedImage = getUploadedShadeImagePath(shadeFiles[fileIndex]);
      const shadeImage = uploadedImage || shade.shadeImage || "";

      return {
        shadeName: shade.shadeName?.trim() || "",
        shadeColor: shade.shadeColor?.trim() || "",
        shadeImage,
        stock: parseNumber(shade.stock, 0),
        price:
          shade.price === undefined || shade.price === null || shade.price === ""
            ? undefined
            : parseNumber(shade.price, 0),
        sku: shade.sku?.trim() || "",
        isAvailable: parseBoolean(shade.isAvailable, true),
      };
    })
    .filter((shade) => shade.shadeName && shade.shadeImage);

exports.getProducts = asyncHandler(async (req, res) => {
  const {
    category,
    search,
    minPrice,
    maxPrice,
    rating,
    featured,
    ids,
    sort,
    page = 1,
    limit = 12,
  } = req.query;

  const filter = {
    isActive: true,
  };

  if (category) {
    const categoryDoc = await Category.findOne({
      $or: [{ slug: category }, { name: category }, { categoryName: category }],
      isActive: true,
    });

    if (categoryDoc) {
      filter.category = categoryDoc._id;
    } else {
      filter.category = null;
    }
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { shortDescription: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
    ];
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (rating) {
    filter.rating = { $gte: Number(rating) };
  }

  if (featured === "true") {
    filter.isFeatured = true;
  } else if (featured === "false") {
    filter.isFeatured = false;
  }

  const rawRequestedIds = normalizeArray(ids);
  const requestedIds = rawRequestedIds.filter((id) =>
    mongoose.Types.ObjectId.isValid(id),
  );

  if (rawRequestedIds.length && !requestedIds.length) {
    filter._id = null;
  } else if (requestedIds.length) {
    filter._id = { $in: requestedIds };
  }

  const sortOptions = {
    latest: { createdAt: -1 },
    "price-low-high": { price: 1 },
    "price-high-low": { price: -1 },
    "top-rated": { rating: -1, reviewsCount: -1 },
  };

  const currentPage = Math.max(Number(page), 1);
  const perPage = Math.max(Number(limit), 1);

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate(productPopulate)
      .sort(sortOptions[sort] || { createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    products,
    pagination: {
      page: currentPage,
      limit: perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  });
});

exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true,
    isFeatured: true,
  })
    .populate(productPopulate)
    .sort({ createdAt: -1 })
    .limit(8);

  res.json({ success: true, products });
});

exports.getNewArrivals = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true,
    isNewArrival: true,
  })
    .populate(productPopulate)
    .sort({ createdAt: -1 })
    .limit(8);

  res.json({ success: true, products });
});

exports.getBestSellers = asyncHandler(async (req, res) => {
  const products = await Product.find({
    isActive: true,
    isBestSeller: true,
  })
    .populate(productPopulate)
    .sort({ rating: -1, reviewsCount: -1 })
    .limit(8);

  res.json({ success: true, products });
});

exports.getProductByIdOrSlug = asyncHandler(async (req, res) => {
  const identifier = req.params.idOrSlug;
  const lookup = mongoose.Types.ObjectId.isValid(identifier)
    ? { _id: identifier }
    : { slug: identifier };

  const product = await Product.findOne({
    ...lookup,
    isActive: true,
  }).populate(productPopulate);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({
    success: true,
    product,
  });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const uploadedImage = getUploadedMainImage(req);
  const rawShades = parseJsonArray(req.body.shades);
  const shades = buildShades(rawShades, req.files?.shadeImages || []);
  const images = uploadedImage ? [uploadedImage] : normalizeArray(req.body.images);
  const finalImages = images.length ? images : shades[0]?.shadeImage ? [shades[0].shadeImage] : [];

  if (!finalImages.length) {
    res.status(400);
    throw new Error("Product image or at least one shade image is required");
  }

  const slug = slugify(req.body.slug || req.body.name);
  const existing = await Product.findOne({ slug });

  if (existing) {
    res.status(400);
    throw new Error("Product slug already exists");
  }

  const category = await Category.findById(req.body.category);

  if (!category) {
    res.status(400);
    throw new Error("Valid category is required");
  }

  const product = await Product.create({
    name: req.body.name,
    slug,
    description: req.body.description,
    shortDescription: req.body.shortDescription,
    price: Number(req.body.price),
    discountPrice: Number(req.body.discountPrice || 0),
    category: category._id,
    images: finalImages,
    shades,
    brand: req.body.brand,
    stock: Number(req.body.stock || 0),
    rating: Number(req.body.rating || 0),
    reviewsCount: Number(req.body.reviewsCount || 0),
    isFeatured: parseBoolean(req.body.isFeatured),
    isNewArrival: parseBoolean(req.body.isNewArrival),
    isBestSeller: parseBoolean(req.body.isBestSeller),
    isActive: parseBoolean(req.body.isActive, true),
    skinType: req.body.skinType || "",
    hairType: req.body.hairType || "",
    howToUse: req.body.howToUse || "",
  });

  const populated = await Product.findById(product._id).populate(productPopulate);

  res.status(201).json({
    success: true,
    product: populated,
  });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (req.body.category) {
    const category = await Category.findById(req.body.category);

    if (!category) {
      res.status(400);
      throw new Error("Valid category is required");
    }

    product.category = category._id;
  }

  if (req.body.name || req.body.slug) {
    const nextSlug = slugify(req.body.slug || req.body.name || product.name);
    const existing = await Product.findOne({
      slug: nextSlug,
      _id: { $ne: product._id },
    });

    if (existing) {
      res.status(400);
      throw new Error("Product slug already exists");
    }

    product.slug = nextSlug;
  }

  product.name = req.body.name ?? product.name;
  product.description = req.body.description ?? product.description;
  product.shortDescription =
    req.body.shortDescription ?? product.shortDescription;
  product.price = req.body.price ?? product.price;
  product.discountPrice = req.body.discountPrice ?? product.discountPrice;
  const uploadedImage = getUploadedMainImage(req);
  if (uploadedImage) {
    product.images = [uploadedImage];
  } else if (req.body.images) {
    product.images = normalizeArray(req.body.images);
  }
  product.brand = req.body.brand ?? product.brand;
  product.stock = req.body.stock ?? product.stock;
  product.rating = req.body.rating ?? product.rating;
  product.reviewsCount = req.body.reviewsCount ?? product.reviewsCount;
  product.isFeatured =
    req.body.isFeatured === undefined
      ? product.isFeatured
      : parseBoolean(req.body.isFeatured);
  product.isNewArrival =
    req.body.isNewArrival === undefined
      ? product.isNewArrival
      : parseBoolean(req.body.isNewArrival);
  product.isBestSeller =
    req.body.isBestSeller === undefined
      ? product.isBestSeller
      : parseBoolean(req.body.isBestSeller);
  product.isActive =
    req.body.isActive === undefined ? product.isActive : parseBoolean(req.body.isActive);
  product.skinType = req.body.skinType ?? product.skinType;
  product.hairType = req.body.hairType ?? product.hairType;
  product.howToUse = req.body.howToUse ?? product.howToUse;

  if (req.body.shades !== undefined) {
    product.shades = buildShades(
      parseJsonArray(req.body.shades),
      req.files?.shadeImages || [],
    );

    if (!product.images.length && product.shades[0]?.shadeImage) {
      product.images = [product.shades[0].shadeImage];
    }
  }

  await product.save();

  const populated = await Product.findById(product._id).populate(productPopulate);

  res.json({
    success: true,
    product: populated,
  });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  product.isActive = false;
  await product.save();

  res.json({
    success: true,
    message: "Product deactivated successfully",
  });
});
