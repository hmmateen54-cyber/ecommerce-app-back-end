const NewsletterSubscriber = require("../Models/NewsletterSubscriber");
const asyncHandler = require("../Middlewere/asyncHandler");

exports.subscribeNewsletter = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await NewsletterSubscriber.findOne({ email: normalizedEmail });

  if (existing) {
    return res.json({
      success: true,
      message: "You are already subscribed",
      subscriber: existing,
    });
  }

  const subscriber = await NewsletterSubscriber.create({
    email: normalizedEmail,
  });

  res.status(201).json({
    success: true,
    message: "Subscribed successfully",
    subscriber,
  });
});

exports.getSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await NewsletterSubscriber.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    subscribers,
  });
});
