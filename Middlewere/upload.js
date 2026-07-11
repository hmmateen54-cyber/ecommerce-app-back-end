const path = require("path");
const multer = require("multer");

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

// Vercel serverless request limit ko dekhte hue 4MB rakha hai
const maxImageSize = 4 * 1024 * 1024;

/*
  Vercel par multer.diskStorage use nahi karna.
  Image temporary memory mein req.file.buffer ya req.files mein milegi.
*/
const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();

  const validMimeType = allowedImageTypes.has(file.mimetype);
  const validExtension = allowedImageExtensions.has(extension);

  if (!validMimeType || !validExtension) {
    return cb(
      new Error(
        "Only jpg, jpeg, png, webp, gif, and avif images are allowed"
      ),
      false
    );
  }

  cb(null, true);
};

/*
  Product upload:

  req.files.image[0]
  req.files.shadeImages
*/
const productImageUpload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: maxImageSize,
    files: 21,
  },
}).fields([
  {
    name: "image",
    maxCount: 1,
  },
  {
    name: "shadeImages",
    maxCount: 20,
  },
]);

/*
  Banner upload:

  req.file
*/
const bannerImageUpload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: maxImageSize,
    files: 1,
  },
}).single("image");

const handleUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (error) => {
      if (!error) {
        return next();
      }

      console.error("Image upload middleware error:", error);

      if (error instanceof multer.MulterError) {
        let message = error.message || "Image upload failed";

        switch (error.code) {
          case "LIMIT_FILE_SIZE":
            message = "Each image must be 4MB or smaller";
            break;

          case "LIMIT_FILE_COUNT":
            message = "Too many images uploaded";
            break;

          case "LIMIT_UNEXPECTED_FILE":
            message = `Unexpected image field: ${error.field}`;
            break;

          case "LIMIT_FIELD_COUNT":
            message = "Too many form fields";
            break;

          default:
            message = error.message || "Image upload failed";
        }

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
};

module.exports = {
  uploadProductImage: handleUpload(productImageUpload),
  uploadBannerImage: handleUpload(bannerImageUpload),
};