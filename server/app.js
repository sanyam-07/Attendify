// Express Application Setup
// Registers middlewares, REST API routes, and global error handlers.

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const faceRoutes = require("./routes/faceRoutes");
const timetableRoutes = require("./routes/timetableRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const examRoutes = require("./routes/examRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// Enable CORS for frontend client
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    credentials: true
  })
);

// Body parsers & Cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Endpoint Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/face", faceRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

// Root health check endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Attendify REST API Backend Service is Running",
    timestamp: new Date().toISOString()
  });
});

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
