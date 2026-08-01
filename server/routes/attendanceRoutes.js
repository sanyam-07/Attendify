// Attendance Routes
// Endpoints for starting sessions, stopping sessions, active session state, 10s QR token generation, QR verification, marking check-ins, and history logs.

const express = require("express");
const router = express.Router();
const {
  createSession,
  endSession,
  getActiveSession,
  getQRToken,
  verifyQRToken,
  markAttendance,
  getAttendanceHistory,
  getAllAttendance,
} = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post("/session", protect, authorizeRoles("teacher", "admin"), createSession);
router.post("/session/end", protect, authorizeRoles("teacher", "admin"), endSession);
router.get("/session/active", protect, getActiveSession);
router.post("/get-qr", protect, getQRToken);
router.post("/verify-qr", protect, verifyQRToken);
router.post("/mark", protect, markAttendance);
router.get("/history", protect, getAttendanceHistory);
router.get("/", protect, getAllAttendance);

module.exports = router;
