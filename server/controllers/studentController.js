// Student Controller
// Handles CRUD operations for student records.

const asyncHandler = require("express-async-handler");
const Student = require("../models/Student");
const User = require("../models/User");

/**
 * @desc    Get all students
 * @route   GET /api/students
 * @access  Private (Teacher, Admin)
 */
const getStudents = asyncHandler(async (req, res) => {
  const students = await Student.find().populate("user", "name email avatar phone role");
  
  const formatted = students.map(s => ({
    _id: s._id,
    id: s._id,
    userId: s.user ? s.user._id : null,
    name: s.user ? s.user.name : "Unknown Student",
    email: s.user ? s.user.email : "",
    enrollment: s.enrollmentNo,
    enrollmentNo: s.enrollmentNo,
    department: s.department,
    semester: s.semester,
    attendance: s.overallAttendance,
    overallAttendance: s.overallAttendance,
    presentDays: s.presentDays,
    absentDays: s.absentDays,
    lateDays: s.lateDays,
    faceRegistered: s.faceRegistered
  }));

  res.json({
    success: true,
    count: formatted.length,
    students: formatted
  });
});

/**
 * @desc    Create a new student
 * @route   POST /api/students
 * @access  Private (Admin, Teacher)
 */
const createStudent = asyncHandler(async (req, res) => {
  const { name, email, password, enrollmentNo, department, semester } = req.body;

  if (!name || !email || !password || !enrollmentNo) {
    res.status(400);
    throw new Error("Please provide name, email, password, and enrollment number.");
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
    role: "student"
  });

  const student = await Student.create({
    user: user._id,
    enrollmentNo,
    department: department || "Computer Science",
    semester: semester || "6th Semester"
  });

  res.status(201).json({
    success: true,
    message: "Student record created successfully",
    student: {
      _id: student._id,
      name: user.name,
      email: user.email,
      enrollmentNo: student.enrollmentNo,
      department: student.department,
      semester: student.semester
    }
  });
});

/**
 * @desc    Update student profile
 * @route   PUT /api/students/:id
 * @access  Private (Admin, Teacher)
 */
const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error("Student not found.");
  }

  if (req.body.name || req.body.email) {
    const user = await User.findById(student.user);
    if (user) {
      if (req.body.name) user.name = req.body.name;
      if (req.body.email) user.email = req.body.email;
      await user.save();
    }
  }

  student.enrollmentNo = req.body.enrollmentNo || student.enrollmentNo;
  student.department = req.body.department || student.department;
  student.semester = req.body.semester || student.semester;
  if (req.body.overallAttendance !== undefined) student.overallAttendance = req.body.overallAttendance;

  const updatedStudent = await student.save();

  res.json({
    success: true,
    message: "Student record updated successfully",
    student: updatedStudent
  });
});

/**
 * @desc    Delete student record
 * @route   DELETE /api/students/:id
 * @access  Private (Admin)
 */
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error("Student not found.");
  }

  // Delete linked User
  if (student.user) {
    await User.findByIdAndDelete(student.user);
  }

  await Student.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Student record and associated user deleted successfully."
  });
});

module.exports = {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent
};
