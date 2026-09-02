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
const adminRoutes = require("./routes/adminRoutes");
const departmentRoutes = require("./routes/departmentRoutes");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const app = express();

// Allowed origins for development and production environments
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  process.env.CLIENT_URL,
  process.env.CORS_ORIGIN
].filter(Boolean);

const isDevelopment = process.env.NODE_ENV !== "production";
const devOriginRegex = /^http:\/\/(localhost|127\.0\.0\.1):(517[3-9]|518[0-9]|3000)$/;

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || (isDevelopment && devOriginRegex.test(origin))) {
      return callback(null, true);
    }

    callback(new Error(`CORS policy rejection: Origin ${origin} not allowed.`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
};

// Enable CORS middleware before API routes
app.use(cors(corsOptions));

// Body parsers & Cookie parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Endpoint Routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/face", faceRoutes);
app.use("/api/timetable", timetableRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);

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
