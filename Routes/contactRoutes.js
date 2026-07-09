const express = require("express");

const adminMiddleware = require("../Middlewere/adminMiddleware");
const {
  createContactMessage,
  getContactMessages,
  updateContactStatus,
} = require("../Controllers/contactController");

const router = express.Router();

router.post("/", createContactMessage);
router.get("/", adminMiddleware, getContactMessages);
router.put("/:id", adminMiddleware, updateContactStatus);

module.exports = router;
