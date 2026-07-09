const ContactMessage = require("../Models/ContactMessage");
const asyncHandler = require("../Middlewere/asyncHandler");

exports.createContactMessage = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    res.status(400);
    throw new Error("Name, email and message are required");
  }

  const contactMessage = await ContactMessage.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim() || "",
    subject: subject?.trim() || "",
    message: message.trim(),
  });

  res.status(201).json({
    success: true,
    message: "Contact message saved successfully",
    contactMessage,
  });
});

exports.getContactMessages = asyncHandler(async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 });

  res.json({
    success: true,
    messages,
  });
});

exports.updateContactStatus = asyncHandler(async (req, res) => {
  const contactMessage = await ContactMessage.findById(req.params.id);

  if (!contactMessage) {
    res.status(404);
    throw new Error("Contact message not found");
  }

  contactMessage.status = req.body.status || contactMessage.status;
  await contactMessage.save();

  res.json({
    success: true,
    contactMessage,
  });
});
