// Routes/HomePageDesignRoutes.js

const express = require("express");

const router = express.Router();

const {
  updateHomePageDesign,
  getHomePageDesign,
} = require("../Controllers/HomePageDesignController");

// 🔥 GET
router.get("/", getHomePageDesign);

// 🔥 UPDATE
router.post("/update", updateHomePageDesign);

module.exports = router;
