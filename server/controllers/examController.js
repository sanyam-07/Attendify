const asyncHandler = require("express-async-handler");
const Exam = require("../models/Exam");

/**
 * @desc    Get all exam schedules
 * @route   GET /api/exams
 * @access  Private
 */
const getExams = asyncHandler(async (req, res) => {
  const { subject, examType } = req.query;
  let filter = {};

  if (subject) filter.subject = subject;
  if (examType) filter.examType = examType;

  const exams = await Exam.find(filter).sort({ examDate: 1 });

  res.status(200).json({
    success: true,
    count: exams.length,
    exams
  });
});

/**
 * @desc    Create new exam schedule
 * @route   POST /api/exams
 * @access  Private (Teacher, Admin)
 */
const createExam = asyncHandler(async (req, res) => {
  const { title, subject, examType, room, examDate, duration, totalMarks } = req.body;

  if (!title || !subject || !examDate) {
    res.status(400);
    throw new Error("Please provide title, subject, and examDate");
  }

  const exam = await Exam.create({
    title,
    subject,
    examType: examType || "Mid-Term",
    room: room || "Auditorium A",
    examDate,
    duration: duration || "2 Hours",
    totalMarks: totalMarks || 100
  });

  res.status(201).json({
    success: true,
    message: "Exam schedule created successfully",
    exam
  });
});

/**
 * @desc    Update exam schedule
 * @route   PUT /api/exams/:id
 * @access  Private (Teacher, Admin)
 */
const updateExam = asyncHandler(async (req, res) => {
  let exam = await Exam.findById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error("Exam schedule not found");
  }

  exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: "Exam schedule updated successfully",
    exam
  });
});

/**
 * @desc    Delete exam schedule
 * @route   DELETE /api/exams/:id
 * @access  Private (Teacher, Admin)
 */
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error("Exam schedule not found");
  }

  await exam.deleteOne();

  res.status(200).json({
    success: true,
    message: "Exam schedule deleted successfully"
  });
});

module.exports = {
  getExams,
  createExam,
  updateExam,
  deleteExam
};
