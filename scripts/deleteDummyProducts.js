const dotenv = require("dotenv");
const mongoose = require("mongoose");

const Product = require("../Models/Product");
const { products: seededProducts } = require("../data/cosmeticSeedData");

dotenv.config();

const seededSlugs = seededProducts.map((product) => product.slug);
const hasConfirmFlag = process.argv.includes("--confirm");
const dummyProductFilter = {
  slug: { $in: seededSlugs },
  images: { $elemMatch: { $regex: "^/images/cosmetics/products/" } },
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required");
  }

  if (!seededSlugs.length) {
    console.log("No seeded product slugs were found. Nothing to delete.");
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);

  if (!hasConfirmFlag) {
    const matchingCount = await Product.countDocuments(dummyProductFilter);

    console.log("Dry run only. No products were deleted.");
    console.log(`${matchingCount} seeded dummy product(s) match the safe cleanup filter.`);
    console.log("Seeded product slugs checked:");
    seededSlugs.forEach((slug) => console.log(`- ${slug}`));
    console.log("");
    console.log("Run `npm run cleanup:dummy-products -- --confirm` to delete products with these exact seeded slugs.");
    return;
  }

  const result = await Product.deleteMany(dummyProductFilter);

  console.log(`Deleted ${result.deletedCount} seeded dummy product(s).`);
};

run()
  .catch((error) => {
    console.error("Dummy product cleanup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });
