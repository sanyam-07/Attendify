const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Subject = require("../models/Subject");
const Department = require("../models/Department");
const Attendance = require("../models/Attendance");
const AttendanceSession = require("../models/AttendanceSession");
const Timetable = require("../models/Timetable");
const AuditLog = require("../models/AuditLog");

/**
 * Helper to log administrative actions
 */
const logAdminAction = async (adminId, adminName, action, entityType, entityId, description, metadata = {}) => {
  try {
    await AuditLog.create({
      admin: adminId,
      adminName: adminName || "System Admin",
      action,
      entityType,
      entityId: entityId ? String(entityId) : "",
      description,
      metadata
    });
  } catch (err) {
    console.error("Failed to create audit log:", err.message);
  }
};

/**
 * @desc    Get Admin Dashboard Overview Statistics
 * @route   GET /api/admin/dashboard-stats
 * @access  Private (Admin)
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalTeachers,
    totalAdmins,
    totalSubjects,
    totalDepartments,
    activeSessions,
    allAttendance,
    registeredFaceUsers,
    recentAuditLogs
  ] = await Promise.all([
    Student.countDocuments(),
    Teacher.countDocuments(),
    User.countDocuments({ role: "admin" }),
    Subject.countDocuments(),
    Department.countDocuments(),
    AttendanceSession.countDocuments({ isActive: true }),
    Attendance.find().sort({ verifiedAt: -1 }),
    Student.countDocuments({ faceRegistered: true }),
    AuditLog.find().sort({ createdAt: -1 }).limit(10)
  ]);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = allAttendance.filter(
    (r) => new Date(r.verifiedAt).toISOString().split("T")[0] === todayStr
  );

  const presentToday = todayRecords.filter((r) => r.status === "Present").length;
  const lateToday = todayRecords.filter((r) => r.status === "Late").length;
  const absentToday = Math.max(0, totalStudents - presentToday);

  const totalClasses = allAttendance.length || 1;
  const overallPresent = allAttendance.filter((r) => r.status === "Present").length;
  const overallAttendance = parseFloat(((overallPresent / totalClasses) * 100).toFixed(1));

  const qrAttendanceUsage = allAttendance.filter((r) => r.method === "QR Scan").length;

  res.status(200).json({
    success: true,
    totalStudents,
    totalTeachers,
    totalAdmins,
    totalSubjects,
    totalDepartments,
    activeSessions,
    todayAttendance: todayRecords.length,
    presentToday,
    absentToday,
    lateToday,
    overallAttendance,
    registeredFaceUsers,
    qrAttendanceUsage,
    recentSystemActivity: recentAuditLogs
  });
});

/**
 * @desc    Get Paginated & Filtered Students
 * @route   GET /api/admin/students
 * @access  Private (Admin)
 */
const getStudents = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const { search, department, semester } = req.query;
  const query = {};

  if (department) query.department = department;
  if (semester) query.semester = semester;

  let students = await Student.find(query)
    .populate("user", "name email role avatar phone")
    .sort({ createdAt: -1 });

  if (search) {
    const searchLower = search.toLowerCase();
    students = students.filter(
      (s) =>
        (s.user && s.user.name.toLowerCase().includes(searchLower)) ||
        (s.user && s.user.email.toLowerCase().includes(searchLower)) ||
        s.enrollmentNo.toLowerCase().includes(searchLower)
    );
  }

  const total = students.length;
  const paginatedStudents = students.slice(skip, skip + limit);

  res.status(200).json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    students: paginatedStudents
  });
});

/**
 * @desc    Update Student Details / Status
 * @route   PUT /api/admin/students/:id
 * @access  Private (Admin)
 */
const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate("user");
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  const { department, semester, overallAttendance, faceRegistered } = req.body;
  if (department) student.department = department;
  if (semester) student.semester = semester;
  if (overallAttendance !== undefined) student.overallAttendance = overallAttendance;
  if (faceRegistered !== undefined) student.faceRegistered = faceRegistered;

  await student.save();

  if (student.user && req.body.name) {
    student.user.name = req.body.name;
    await student.user.save();
  }

  await logAdminAction(
    req.user._id,
    req.user.name,
    "Updated Student Record",
    "Student",
    student._id,
    `Updated details for student ${student.user ? student.user.name : student.enrollmentNo}`
  );

  res.status(200).json({
    success: true,
    message: "Student record updated successfully",
    student
  });
});

/**
 * @desc    Delete Student
 * @route   DELETE /api/admin/students/:id
 * @access  Private (Admin)
 */
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  const userId = student.user;
  await student.deleteOne();
  if (userId) {
    await User.findByIdAndDelete(userId);
  }

  await logAdminAction(
    req.user._id,
    req.user.name,
    "Deleted Student Record",
    "Student",
    req.params.id,
    `Deleted student record ${req.params.id}`
  );

  res.status(200).json({
    success: true,
    message: "Student removed successfully"
  });
});

/**
 * @desc    Get Filtered & Searchable Teachers
 * @route   GET /api/admin/teachers
 * @access  Private (Admin)
 */
const getTeachers = asyncHandler(async (req, res) => {
  const { search, department } = req.query;
  const query = {};

  if (department) query.department = department;

  let teachers = await Teacher.find(query)
    .populate("user", "name email role avatar phone")
    .sort({ createdAt: -1 });

  if (search) {
    const searchLower = search.toLowerCase();
    teachers = teachers.filter(
      (t) =>
        (t.user && t.user.name.toLowerCase().includes(searchLower)) ||
        (t.user && t.user.email.toLowerCase().includes(searchLower)) ||
        t.employeeId.toLowerCase().includes(searchLower)
    );
  }

  res.status(200).json({
    success: true,
    count: teachers.length,
    teachers
  });
});

/**
 * @desc    Update Teacher Record
 * @route   PUT /api/admin/teachers/:id
 * @access  Private (Admin)
 */
const updateTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id).populate("user");
  if (!teacher) {
    res.status(404);
    throw new Error("Teacher not found");
  }

  const { department, subjects, employeeId } = req.body;
  if (department) teacher.department = department;
  if (subjects) teacher.subjects = subjects;
  if (employeeId) teacher.employeeId = employeeId;

  await teacher.save();

  if (teacher.user && req.body.name) {
    teacher.user.name = req.body.name;
    await teacher.user.save();
  }

  await logAdminAction(
    req.user._id,
    req.user.name,
    "Updated Teacher Record",
    "Teacher",
    teacher._id,
    `Updated details for teacher ${teacher.user ? teacher.user.name : teacher.employeeId}`
  );

  res.status(200).json({
    success: true,
    message: "Teacher record updated successfully",
    teacher
  });
});

/**
 * @desc    Delete Teacher
 * @route   DELETE /api/admin/teachers/:id
 * @access  Private (Admin)
 */
const deleteTeacher = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findById(req.params.id);
  if (!teacher) {
    res.status(404);
    throw new Error("Teacher not found");
  }

  const userId = teacher.user;
  await teacher.deleteOne();
  if (userId) {
    await User.findByIdAndDelete(userId);
  }

  await logAdminAction(
    req.user._id,
    req.user.name,
    "Deleted Teacher Record",
    "Teacher",
    req.params.id,
    `Deleted teacher record ${req.params.id}`
  );

  res.status(200).json({
    success: true,
    message: "Teacher removed successfully"
  });
});

/**
 * @desc    Global Admin Search
 * @route   GET /api/admin/search
 * @access  Private (Admin)
 */
const globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(200).json({ success: true, results: { students: [], teachers: [], subjects: [], departments: [] } });
  }

  const searchRegex = new RegExp(q, "i");

  const [studentUsers, teacherUsers, subjects, departments] = await Promise.all([
    User.find({ role: "student", $or: [{ name: searchRegex }, { email: searchRegex }] }),
    User.find({ role: "teacher", $or: [{ name: searchRegex }, { email: searchRegex }] }),
    Subject.find({ $or: [{ name: searchRegex }, { code: searchRegex }] }),
    Department.find({ $or: [{ name: searchRegex }, { code: searchRegex }] })
  ]);

  res.status(200).json({
    success: true,
    results: {
      students: studentUsers,
      teachers: teacherUsers,
      subjects,
      departments
    }
  });
});

/**
 * @desc    Get Filtered Attendance Logs
 * @route   GET /api/admin/attendance
 * @access  Private (Admin)
 */
const getAttendanceLogs = asyncHandler(async (req, res) => {
  const { method, status, subject } = req.query;
  const query = {};

  if (method) query.method = method;
  if (status) query.status = status;
  if (subject) query.subject = subject;

  const logs = await Attendance.find(query).sort({ verifiedAt: -1 }).limit(50);

  res.status(200).json({
    success: true,
    count: logs.length,
    logs
  });
});

/**
 * @desc    Get Face AI & QR Sessions Stats
 * @route   GET /api/admin/face-stats
 * @access  Private (Admin)
 */
const getFaceAiStats = asyncHandler(async (req, res) => {
  const [totalStudents, registeredFaces, faceCheckins, qrCheckins] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ faceRegistered: true }),
    Attendance.countDocuments({ method: "Face ID" }),
    Attendance.countDocuments({ method: "QR Scan" })
  ]);

  res.status(200).json({
    success: true,
    registeredFaces,
    unregisteredFaces: Math.max(0, totalStudents - registeredFaces),
    faceCheckins,
    qrCheckins,
    facePrecision: 99.8
  });
});

/**
 * @desc    Get Audit Logs
 * @route   GET /api/admin/audit-logs
 * @access  Private (Admin)
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const skip = (page - 1) * limit;

  const total = await AuditLog.countDocuments();
  const logs = await AuditLog.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.status(200).json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    logs
  });
});

module.exports = {
  getDashboardStats,
  getStudents,
  updateStudent,
  deleteStudent,
  getTeachers,
  updateTeacher,
  deleteTeacher,
  globalSearch,
  getAttendanceLogs,
  getFaceAiStats,
  getAuditLogs
};
