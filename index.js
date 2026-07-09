const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const connectDB = require("./config/db");
const authRoutes = require("./Routes/Routes");
const homePageDesignRoutes = require("./Routes/HomePageDesignRoutes");
const categoryRoutes = require("./Routes/categoryRoutes");
const productRoutes = require("./Routes/productRoutes");
const bannerRoutes = require("./Routes/bannerRoutes");
const contactRoutes = require("./Routes/contactRoutes");
const newsletterRoutes = require("./Routes/newsletterRoutes");
const reviewRoutes = require("./Routes/reviewRoutes");
const homepageRoutes = require("./Routes/homepageRoutes");
const adminRoutes = require("./Routes/adminRoutes");
const orderRoutes = require("./Routes/orderRoutes");
const { verifyEmailConfig } = require("./config/mail");
const { errorHandler, notFound } = require("./Middlewere/errorMiddleware");

const startServer = async () => {
  await connectDB();
  await verifyEmailConfig();

  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    }),
  );

  app.use(cookieParser());
  app.use(express.json());
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));

  app.use("/api/auth", authRoutes);
  app.use("/api/home-design", homePageDesignRoutes);
  app.use("/api/homepage", homepageRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/banners", bannerRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/newsletter", newsletterRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/orders", orderRoutes);

  app.get("/", (req, res) => {
    res.send("Cosmetic ecommerce API running...");
  });

  app.use(notFound);
  app.use(errorHandler);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
