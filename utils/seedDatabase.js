const Banner = require("../Models/Banner");
const Category = require("../Models/Category");
const Product = require("../Models/Product");
const Review = require("../Models/Review");
const {
  categories,
  products,
  banners,
  reviews,
} = require("../data/cosmeticSeedData");

const seedDatabase = async () => {
  const shouldSeedProducts =
    process.argv.includes("--include-products") ||
    process.env.SEED_PRODUCTS === "true";

  const categoryCount = await Category.countDocuments();

  if (categoryCount === 0) {
    await Category.insertMany(categories);
  }

  const bannerCount = await Banner.countDocuments();

  if (bannerCount === 0) {
    await Banner.insertMany(banners);
  }

  const reviewCount = await Review.countDocuments();

  if (reviewCount === 0) {
    await Review.insertMany(reviews);
  }

  const productCount = await Product.countDocuments();

  if (productCount === 0 && shouldSeedProducts) {
    const categoryDocs = await Category.find({}, "_id slug");
    const categoryMap = categoryDocs.reduce((acc, category) => {
      acc[category.slug] = category._id;
      return acc;
    }, {});

    await Product.insertMany(
      products.map((product) => ({
        name: product.name,
        slug: product.slug,
        shortDescription: product.shortDescription,
        description: product.description,
        price: product.price,
        discountPrice: product.discountPrice,
        category: categoryMap[product.categorySlug],
        images: [product.image],
        brand: product.brand,
        stock: product.stock,
        rating: product.rating,
        reviewsCount: product.reviewsCount,
        isFeatured: product.isFeatured,
        isNewArrival: product.isNewArrival,
        isBestSeller: product.isBestSeller,
        isActive: true,
        tags: product.tags,
        skinType: product.skinType || "",
        hairType: product.hairType || "",
        volume: product.volume || "",
        ingredients: product.ingredients || [],
        howToUse: product.howToUse || "",
      })),
    );
  } else if (productCount === 0) {
    console.log(
      "Product seeding skipped. Run with --include-products or SEED_PRODUCTS=true to insert optional demo products.",
    );
  }
};

if (require.main === module) {
  require("dotenv").config();
  const mongoose = require("mongoose");

  mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
      await seedDatabase();
      console.log("Optional seed completed.");
    })
    .catch((error) => {
      console.error("Optional seed failed:", error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.connection.close();
    });
}

module.exports = seedDatabase;
