const express = require("express");

const adminMiddleware = require("../Middlewere/adminMiddleware");
const {
  subscribeNewsletter,
  getSubscribers,
} = require("../Controllers/newsletterController");

const router = express.Router();

router.post("/", subscribeNewsletter);
router.get("/", adminMiddleware, getSubscribers);

module.exports = router;
