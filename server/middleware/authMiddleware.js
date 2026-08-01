// JWT Authentication Protection Middleware
// Validates token from Authorization header or HTTP-only cookies and populates req.user.

const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Check Bearer token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  } 
  // 2. Check token in cookies if cookie-parser is configured
  else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized. Access token missing.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "attendify_jwt_super_secret_key_2026");
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      res.status(401);
      throw new Error("User associated with token no longer exists.");
    }

    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized. Invalid or expired token.");
  }
});

module.exports = { protect };
