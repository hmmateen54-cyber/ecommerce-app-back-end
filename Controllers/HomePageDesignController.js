// Controllers/HomePageDesignController.js

const HomePageDesign = require("../Models/HomePageDesign");

// ==============================
// 🔥 CREATE / UPDATE DESIGN
// ==============================
exports.updateHomePageDesign = async (req, res) => {
  try {
    const {
      bannerTitle,
      bannerSubtitle,
      bannerImage,
      bannerButtonText,
      bannerButtonLink,
      showCategories,
      showFeaturedProducts,
      showNewArrivals,
      showReviews,
    } = req.body;

    let design = await HomePageDesign.findOne();

    // 🔥 IF DESIGN ALREADY EXISTS
    if (design) {
      design.bannerTitle = bannerTitle;
      design.bannerSubtitle = bannerSubtitle;
      design.bannerImage = bannerImage;
      design.bannerButtonText = bannerButtonText;
      design.bannerButtonLink = bannerButtonLink;

      design.showCategories = showCategories;
      design.showFeaturedProducts = showFeaturedProducts;
      design.showNewArrivals = showNewArrivals;
      design.showReviews = showReviews;

      await design.save();

      return res.status(200).json({
        success: true,
        message: "Homepage updated successfully",
        design,
      });
    }

    // 🔥 CREATE NEW
    design = await HomePageDesign.create({
      bannerTitle,
      bannerSubtitle,
      bannerImage,
      bannerButtonText,
      bannerButtonLink,
      showCategories,
      showFeaturedProducts,
      showNewArrivals,
      showReviews,
    });

    res.status(201).json({
      success: true,
      message: "Homepage design created",
      design,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==============================
// 🔥 GET HOMEPAGE DESIGN
// ==============================
exports.getHomePageDesign = async (req, res) => {
  try {
    const design = await HomePageDesign.findOne();

    res.status(200).json({
      success: true,
      design,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
