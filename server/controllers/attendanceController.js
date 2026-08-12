// Attendance Controller
// Handles session creation, active session tracking, 10-second dynamic QR signing & verification, check-in marking, and history log retrieval.

const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const Attendance = require("../models/Attendance");
const AttendanceSession = require("../models/AttendanceSession");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "attendify_jwt_super_secret_key_2026";

/**
 * Generate a cryptographically signed 10-second dynamic QR token
 */
const generateQRTokenHelper = (classId, sessionId) => {
  const payload = {
    classId: classId || "SUB301",
    sessionId: sessionId ? sessionId.toString() : "session-1",
    nonce: crypto.randomBytes(8).toString("hex"),
    timestamp: Date.now()
  };

  // Sign JWT with 10 seconds expiration
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "10s" });
};

/**
 * @desc    Create / Start live attendance session
 * @route   POST /api/attendance/session
 * @access  Private (Teacher, Admin)
 */
const createSession = asyncHandler(async (req, res) => {
  const { classId, subject, room, duration } = req.body;

  if (!subject) {
    res.status(400);
    throw new Error("Subject is required to start a session.");
  }

  // Deactivate any existing active sessions for this teacher
  await AttendanceSession.updateMany(
    { teacher: req.user._id, isActive: true },
    { isActive: false, endTime: Date.now() }
  );

  const sessionDuration = parseInt(duration, 10) || 30; // default 30 mins
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + sessionDuration * 60 * 1000);

  const session = await AttendanceSession.create({
    teacher: req.user._id,
    teacherName: req.user.name,
    classId: classId || "SUB301",
    subject,
    room: room || "Lab-3",
    duration: sessionDuration,
    isActive: true,
    startTime,
    endTime
  });

  const qrToken = generateQRTokenHelper(session.classId, session._id);
  session.qrCodeToken = qrToken;
  await session.save();

  res.status(201).json({
    success: true,
    message: `Attendance broadcast session started (${sessionDuration} mins)`,
    session,
    qrToken,
    remainingSeconds: sessionDuration * 60
  });
});

/**
 * @desc    End active attendance session
 * @route   POST /api/attendance/session/end
 * @access  Private (Teacher, Admin)
 */
const endSession = asyncHandler(async (req, res) => {
  let query = { isActive: true };
  if (req.user.role !== "admin") {
    query.teacher = req.user._id;
  }

  await AttendanceSession.updateMany(
    query,
    { isActive: false, endTime: Date.now() }
  );

  res.json({
    success: true,
    message: "Attendance session successfully closed."
  });
});

/**
 * @desc    Get currently active attendance session
 * @route   GET /api/attendance/session/active
 * @access  Private
 */
const getActiveSession = asyncHandler(async (req, res) => {
  let query = { isActive: true };

  // If user is a teacher, check their active session
  if (req.user.role === "teacher") {
    query.teacher = req.user._id;
  }

  let session = await AttendanceSession.findOne(query).sort({ startTime: -1 });

  if (!session) {
    return res.json({
      success: true,
      active: false
    });
  }

  // Check if session has expired
  const now = new Date();
  if (session.endTime && new Date(session.endTime) < now) {
    session.isActive = false;
    await session.save();
    return res.json({
      success: true,
      active: false
    });
  }

  const remainingSeconds = Math.max(0, Math.floor((new Date(session.endTime).getTime() - now.getTime()) / 1000));
  const presentCount = await Attendance.countDocuments({ session: session._id, status: "Present" });

  // Generate fresh 10-second signed QR token
  const qrToken = generateQRTokenHelper(session.classId, session._id);

  // Check if current student has already marked attendance for this session
  let studentMarked = false;
  if (req.user.role === "student") {
    const existingCheckin = await Attendance.findOne({
      student: req.user._id,
      session: session._id
    });
    studentMarked = !!existingCheckin;
  }

  res.json({
    success: true,
    active: true,
    session: {
      _id: session._id,
      classId: session.classId,
      subject: session.subject,
      faculty: session.teacherName || "Faculty Member",
      room: session.room,
      expiresAt: session.endTime,
      qrToken: qrToken
    },
    remainingSeconds,
    presentCount,
    studentMarked
  });
});

/**
 * @desc    Fetch/Refresh fresh 10-second dynamic QR token for active session
 * @route   POST /api/attendance/get-qr
 * @access  Private
 */
const getQRToken = asyncHandler(async (req, res) => {
  const { classId } = req.body;
  let session = await AttendanceSession.findOne({ isActive: true }).sort({ startTime: -1 });

  if (!session) {
    res.status(400);
    throw new Error("No active attendance session exists.");
  }

  const token = generateQRTokenHelper(classId || session.classId, session._id);

  res.json({
    success: true,
    token,
    expiresIn: 10
  });
});

/**
 * @desc    Verify scanned QR Token & Mark Attendance
 * @route   POST /api/attendance/verify-qr
 * @access  Private (Student, Admin)
 */
const verifyQRToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    res.status(400);
    throw new Error("QR token is required for verification.");
  }

  // 1. Verify cryptographic JWT signature & 10-second expiration
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      res.status(400);
      throw new Error("QR token has expired (10s limit). Please scan fresh QR code.");
    }
    res.status(400);
    throw new Error("Invalid or tampered QR security token.");
  }

  // 2. Validate active session
  let session = await AttendanceSession.findOne({
    $or: [{ _id: decoded.sessionId }, { classId: decoded.classId }],
    isActive: true
  }).sort({ startTime: -1 });

  if (!session) {
    session = await AttendanceSession.findOne({ isActive: true }).sort({ startTime: -1 });
  }

  if (!session) {
    res.status(400);
    throw new Error("The attendance session for this QR code is closed or inactive.");
  }

  // 3. Check if session time has expired
  if (session.endTime && new Date(session.endTime) < new Date()) {
    session.isActive = false;
    await session.save();
    res.status(400);
    throw new Error("Attendance session has expired.");
  }

  // 4. Check if student has already marked attendance
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const existing = await Attendance.findOne({
    student: req.user._id,
    $or: [
      { session: session._id },
      { subject: session.subject, verifiedAt: { $gte: startOfDay } }
    ]
  });

  if (existing) {
    return res.json({
      success: true,
      verified: true,
      alreadyMarked: true,
      message: "Attendance was already recorded for this session.",
      record: {
        id: existing._id,
        subject: existing.subject,
        time: existing.verifiedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        room: existing.room,
        method: existing.method,
        status: existing.status
      }
    });
  }

  // 5. Record verified attendance check-in
  const record = await Attendance.create({
    student: req.user._id,
    studentName: req.user.name,
    subject: session.subject,
    faculty: session.teacherName || "Faculty Member",
    room: session.room,
    status: "Present",
    method: "QR Scan",
    session: session._id
  });

  res.status(201).json({
    success: true,
    verified: true,
    alreadyMarked: false,
    message: "QR Attendance verified and marked successfully!",
    record: {
      id: record._id,
      subject: record.subject,
      time: record.verifiedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      room: record.room,
      method: record.method,
      status: record.status
    }
  });
});

/**
 * @desc    Get all attendance records
 * @route   GET /api/attendance
 * @access  Private
 */
const getAllAttendance = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === "student") {
    query.student = req.user._id;
  }

  const attendance = await Attendance.find(query).sort({
    verifiedAt: -1
  });

  res.json({
    success: true,
    count: attendance.length,
    attendance
  });
});

/**
 * @desc    Mark attendance check-in
 * @route   POST /api/attendance/mark
 * @access  Private (Student, Admin)
 */
const markAttendance = asyncHandler(async (req, res) => {
  const { classId, subject, faculty, room, method } = req.body;

  if (!subject) {
    res.status(400);
    throw new Error("Subject is required to mark attendance.");
  }

  // Validate active session
  const now = new Date();
  let activeSession = await AttendanceSession.findOne({
    subject,
    isActive: true
  }).sort({ startTime: -1 });

  if (!activeSession) {
    activeSession = await AttendanceSession.findOne({ isActive: true }).sort({ startTime: -1 });
  }

  if (!activeSession) {
    res.status(400);
    throw new Error("No active attendance session is open for this class.");
  }

  if (activeSession.endTime && new Date(activeSession.endTime) < now) {
    activeSession.isActive = false;
    await activeSession.save();
    res.status(400);
    throw new Error("Attendance session has expired.");
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const existing = await Attendance.findOne({
    student: req.user._id,
    $or: [
      { session: activeSession._id },
      { subject, verifiedAt: { $gte: startOfDay } }
    ]
  });

  if (existing) {
    return res.json({
      success: true,
      alreadyMarked: true,
      message: "Attendance was already recorded for this session.",
      record: {
        id: existing._id,
        subject: existing.subject,
        time: existing.verifiedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        room: existing.room,
        method: existing.method,
        status: existing.status
      }
    });
  }

  const record = await Attendance.create({
    student: req.user._id,
    studentName: req.user.name,
    subject: activeSession.subject || subject,
    faculty: activeSession.teacherName || faculty || "Faculty Member",
    room: activeSession.room || room || "Lab-3",
    status: "Present",
    method: method || "Face ID",
    session: activeSession._id
  });

  res.status(201).json({
    success: true,
    alreadyMarked: false,
    message: "Attendance marked successfully",
    record: {
      id: record._id,
      subject: record.subject,
      time: record.verifiedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      room: record.room,
      method: record.method,
      status: record.status
    }
  });
});

/**
 * @desc    Get attendance history logs
 * @route   GET /api/attendance/history
 * @access  Private
 */
const getAttendanceHistory = asyncHandler(async (req, res) => {
  let query = {};
  if (req.user.role === "student") {
    query = { student: req.user._id };
  }

  const records = await Attendance.find(query).sort({ verifiedAt: -1 }).limit(50);

  const formatted = records.map((r) => ({
    id: r._id,
    subject: r.subject,
    date: r.verifiedAt.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
    time: r.verifiedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: r.status,
    room: r.room,
    method: r.method,
    studentName: r.studentName
  }));

  res.json({
    success: true,
    count: formatted.length,
    history: formatted
  });
});

module.exports = {
  createSession,
  endSession,
  getActiveSession,
  getQRToken,
  verifyQRToken,
  markAttendance,
  getAttendanceHistory,
  getAllAttendance
};
