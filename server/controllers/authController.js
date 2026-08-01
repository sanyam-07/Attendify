// Authentication Controller
// Handles user registration, login with bcrypt validation, JWT generation, and profile retrieval.

const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const generateToken = require("../utils/generateToken");

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, enrollmentNo, employeeId } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email, and password.");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User with this email already exists.");
  }

  const userRole = role || "student";

  const user = await User.create({
    name,
    email,
    password,
    role: userRole
  });

  if (user) {
    // If student, create Student document
    if (userRole === "student") {
      await Student.create({
        user: user._id,
        enrollmentNo: enrollmentNo || `CS2026${Math.floor(1000 + Math.random() * 9000)}`,
        department: department || "Computer Science",
        semester: "6th Semester"
      });
    }
    // If teacher, create Teacher document
    else if (userRole === "teacher") {
      await Teacher.create({
        user: user._id,
        employeeId: employeeId || `EMP${Math.floor(100 + Math.random() * 900)}`,
        department: department || "Computer Science"
      });
    }

    const token = generateToken(res, user._id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data.");
  }
});

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  const loginCredential = email || username;

  if (!loginCredential || !password) {
    res.status(400);
    throw new Error("Please provide email/username and password.");
  }

  // Find user by email or name match
  const user = await User.findOne({
    $or: [{ email: loginCredential.toLowerCase() }, { name: loginCredential }]
  }).select("+password");

  if (user && (await user.matchPassword(password))) {
    const token = generateToken(res, user._id);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } else {
    res.status(401);
    throw new Error("Invalid email/username or password.");
  }
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  let profileDetails = {};
  if (user.role === "student") {
    profileDetails = await Student.findOne({ user: user._id }) || {};
  } else if (user.role === "teacher") {
    profileDetails = await Teacher.findOne({ user: user._id }) || {};
  }

  res.json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      ...profileDetails._doc
    }
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe
};
