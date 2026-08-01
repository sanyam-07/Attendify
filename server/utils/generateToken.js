const jwt = require("jsonwebtoken");

const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || "attendify_jwt_super_secret_key_2026", {
    expiresIn: process.env.JWT_EXPIRE || "30d"
  });

  // Set JWT as an HTTP-only cookie if res object is passed
  if (res && res.cookie) {
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
  }

  return token;
};

module.exports = generateToken;
