// Teacher Controller
// Handles operations for teacher/faculty profiles.

const asyncHandler = require("express-async-handler");
const Teacher = require("../models/Teacher");
const User = require("../models/User");

/**
 * @desc    Get all teachers
 * @route   GET /api/teachers
 * @access  Private (Admin, Teacher, Student)
 */
const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await Teacher.find().populate("user", "name email avatar role");

  const formatted = teachers.map(t => ({
    _id: t._id,
    id: t._id,
    userId: t.user ? t.user._id : null,
    name: t.user ? t.user.name : "Faculty Member",
    email: t.user ? t.user.email : "",
    employeeId: t.employeeId,
    department: t.department,
    subjects: t.subjects,
    classes: t.subjects ? t.subjects.length * 3 : 6
  }));

  res.json({
    success: true,
    count: formatted.length,
    teachers: formatted
  });
});

/**
 * @desc    Create a new teacher profile
 * @route   POST /api/teachers
 * @access  Private (Admin)
 */
const createTeacher = asyncHandler(async (req, res) => {
  const { name, email, password, employeeId, department, subjects } = req.body;

  if (!name || !email || !password || !employeeId) {
    res.status(400);
    throw new Error("Please provide name, email, password, and employee ID.");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User with this email already exists.");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: "teacher"
  });

  const teacher = await Teacher.create({
    user: user._id,
    employeeId,
    department: department || "Computer Science",
    subjects: subjects || ["AI & Machine Learning"]
  });

  res.status(201).json({
    success: true,
    message: "Teacher record created successfully",
    teacher: {
      _id: teacher._id,
      name: user.name,
      email: user.email,
      employeeId: teacher.employeeId,
      department: teacher.department,
      subjects: teacher.subjects
    }
  });
});

module.exports = {
  getTeachers,
  createTeacher
};
