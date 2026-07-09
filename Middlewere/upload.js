const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadRoot = path.join(__dirname, "..", "uploads");
const productUploadDir = path.join(uploadRoot, "products");
const productShadeUploadDir = path.join(productUploadDir, "shades");
const bannerUploadDir = path.join(uploadRoot, "banners");
const allowedImageTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const allowedImageExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
]);
const maxImageSize = 5 * 1024 * 1024;

fs.mkdirSync(productUploadDir, { recursive: true });
fs.mkdirSync(productShadeUploadDir, { recursive: true });
fs.mkdirSync(bannerUploadDir, { recursive: true });

const createStorage = (uploadDir) =>
  multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
  });

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedImageTypes.has(file.mimetype) || !allowedImageExtensions.has(ext)) {
    return cb(new Error("Only jpg, jpeg, png, webp, gif, and avif images are allowed"));
  }

  cb(null, true);
};

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, file.fieldname === "shadeImages" ? productShadeUploadDir : productUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const productImageUpload = multer({
  storage: productStorage,
  fileFilter,
  limits: {
    fileSize: maxImageSize,
  },
}).fields([
  { name: "image", maxCount: 1 },
  { name: "shadeImages", maxCount: 20 },
]);

const bannerImageUpload = multer({
  storage: createStorage(bannerUploadDir),
  fileFilter,
  limits: {
    fileSize: maxImageSize,
  },
}).single("image");

const handleUpload = (upload) => (req, res, next) => {
  upload(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Image must be 5MB or smaller"
          : error.message || "Image upload failed";

      return res.status(400).json({
        success: false,
        message,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Image upload failed",
    });
  });
};

module.exports = {
  uploadProductImage: handleUpload(productImageUpload),
  uploadBannerImage: handleUpload(bannerImageUpload),
};
