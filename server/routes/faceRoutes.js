// Face Recognition Routes
// Endpoints for face biometric embedding registration and facial identity verification.

const express = require("express");
const router = express.Router();
const { registerFace, verifyFace } = require("../controllers/faceController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", protect, registerFace);
router.post("/verify", protect, verifyFace);

module.exports = router;
