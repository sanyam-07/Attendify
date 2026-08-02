const asyncHandler = require("express-async-handler");
const Timetable = require("../models/Timetable");

/**
 * @desc    Get all timetable schedule entries
 * @route   GET /api/timetable
 * @access  Private
 */
const getTimetable = asyncHandler(async (req, res) => {
  const { dayOfWeek, department, semester, section } = req.query;
  let filter = { isActive: true };

  if (dayOfWeek) filter.dayOfWeek = dayOfWeek;
  if (department) filter.department = department;
  if (semester) filter.semester = semester;
  if (section) filter.section = section;

  const timetable = await Timetable.find(filter).sort({ dayOfWeek: 1, startTime: 1 });

  res.status(200).json({
    success: true,
    count: timetable.length,
    timetable
  });
});

/**
 * @desc    Create new timetable entry
 * @route   POST /api/timetable
 * @access  Private (Teacher, Admin)
 */
const createTimetable = asyncHandler(async (req, res) => {
  const { subject, room, dayOfWeek, startTime, endTime, department, semester, section, teacherName } = req.body;

  if (!subject || !room || !dayOfWeek || !startTime || !endTime) {
    res.status(400);
    throw new Error("Please provide all required fields (subject, room, dayOfWeek, startTime, endTime)");
  }

  const timetable = await Timetable.create({
    subject,
    teacher: req.user._id,
    teacherName: teacherName || req.user.name,
    department: department || "Computer Science & AI",
    semester: semester || 6,
    section: section || "A",
    room,
    dayOfWeek,
    startTime,
    endTime,
    isActive: true
  });

  res.status(201).json({
    success: true,
    message: "Timetable entry created successfully",
    timetable
  });
});

/**
 * @desc    Update timetable entry
 * @route   PUT /api/timetable/:id
 * @access  Private (Teacher, Admin)
 */
const updateTimetable = asyncHandler(async (req, res) => {
  let timetable = await Timetable.findById(req.params.id);

  if (!timetable) {
    res.status(404);
    throw new Error("Timetable entry not found");
  }

  timetable = await Timetable.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: "Timetable entry updated successfully",
    timetable
  });
});

/**
 * @desc    Delete timetable entry
 * @route   DELETE /api/timetable/:id
 * @access  Private (Teacher, Admin)
 */
const deleteTimetable = asyncHandler(async (req, res) => {
  const timetable = await Timetable.findById(req.params.id);

  if (!timetable) {
    res.status(404);
    throw new Error("Timetable entry not found");
  }

  await timetable.deleteOne();

  res.status(200).json({
    success: true,
    message: "Timetable entry deleted successfully"
  });
});

module.exports = {
  getTimetable,
  createTimetable,
  updateTimetable,
  deleteTimetable
};
