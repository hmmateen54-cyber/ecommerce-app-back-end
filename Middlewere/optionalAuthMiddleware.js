const jwt = require("jsonwebtoken");
const User = require("../Models/Users");

const optionalAuthMiddleware = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    return next();
  } catch (error) {
    return next();
  }
};

module.exports = optionalAuthMiddleware;
