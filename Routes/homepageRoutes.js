const express = require("express");

const { getHomepageData } = require("../Controllers/homepageController");

const router = express.Router();

router.get("/", getHomepageData);

module.exports = router;
