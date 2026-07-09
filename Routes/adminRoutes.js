const express = require("express");

const adminMiddleware = require("../Middlewere/adminMiddleware");
const { getAdminOverview } = require("../Controllers/adminController");

const router = express.Router();

router.get("/overview", adminMiddleware, getAdminOverview);

module.exports = router;
