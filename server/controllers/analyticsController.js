const asyncHandler = require("express-async-handler");
const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const AttendanceSession = require("../models/AttendanceSession");
const User = require("../models/User");

/**
 * Helper: calculate required consecutive classes to hit target percentage
 * Formula: Target = (P + x) / (T + x) => x = (Target * T - P) / (1 - Target)
 */
const calculateRequiredClasses = (present, total, targetPct) => {
  if (total === 0) return 0;
  const currentPct = (present / total) * 100;
  if (currentPct >= targetPct) return 0;
  
  const targetDecimal = targetPct / 100;
  const required = Math.ceil((targetDecimal * total - present) / (1 - targetDecimal));
  return required > 0 ? required : 0;
};

/**
 * @desc    Get Student Analytics
 * @route   GET /api/analytics/student
 * @access  Private (Student)
 */
const getStudentAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userName = req.user.name;

  // Match attendance records for this student
  const studentQuery = {
    $or: [{ student: userId }, { studentName: userName }]
  };

  const records = await Attendance.find(studentQuery).sort({ verifiedAt: -1 });

  const totalClasses = records.length;
  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;

  records.forEach((r) => {
    if (r.status === "Present") presentCount++;
    else if (r.status === "Absent") absentCount++;
    else if (r.status === "Late") lateCount++;
  });

  // Effective present weighting: Present = 1, Late = 0.5
  const effectivePresent = presentCount + lateCount * 0.5;
  const attendancePercentage = totalClasses > 0 
    ? parseFloat(((effectivePresent / totalClasses) * 100).toFixed(1))
    : 0.0;

  // Predictor Targets
  const req75 = calculateRequiredClasses(effectivePresent, totalClasses, 75);
  const req80 = calculateRequiredClasses(effectivePresent, totalClasses, 80);
  const req90 = calculateRequiredClasses(effectivePresent, totalClasses, 90);

  let predictorMessage = "";
  if (totalClasses === 0) {
    predictorMessage = "No attendance records found yet. Attend your upcoming classes to build compliance.";
  } else if (attendancePercentage >= 80) {
    predictorMessage = "You are safely above university attendance requirement (75%). Keep it up!";
  } else if (attendancePercentage >= 75) {
    predictorMessage = `Your attendance is ${attendancePercentage}%. You need ${req80} more consecutive classes to reach 80%.`;
  } else {
    predictorMessage = `Warning: Your attendance is ${attendancePercentage}%. You need ${req75} more consecutive classes to reach 75% compliance.`;
  }

  // Subject-wise Breakdown via aggregation
  const subjectAgg = await Attendance.aggregate([
    { $match: studentQuery },
    {
      $group: {
        _id: "$subject",
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] }
        },
        absent: {
          $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] }
        },
        late: {
          $sum: { $cond: [{ $eq: ["$status", "Late"] }, 1, 0] }
        }
      }
    }
  ]);

  const subjectWiseAttendance = subjectAgg.map((s) => {
    const total = s.total || 1;
    const pct = parseFloat((((s.present + s.late * 0.5) / total) * 100).toFixed(1));
    return {
      subject: s._id || "General",
      total: s.total,
      present: s.present,
      absent: s.absent,
      late: s.late,
      percentage: pct
    };
  });

  // Weekly Trend
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyTrend = daysOfWeek.map((day, idx) => {
    const dayRecords = records.filter(r => new Date(r.verifiedAt).getDay() === idx);
    const pres = dayRecords.filter(r => r.status === "Present").length;
    const abs = dayRecords.filter(r => r.status === "Absent").length;
    const total = dayRecords.length;
    return {
      day,
      present: pres,
      absent: abs,
      percentage: total > 0 ? parseFloat(((pres / total) * 100).toFixed(1)) : 0
    };
  });

  // Monthly Trend
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthIdx = new Date().getMonth();
  const recentMonths = months.slice(Math.max(0, currentMonthIdx - 5), currentMonthIdx + 1);

  const monthlyTrend = recentMonths.map((month, idx) => {
    const mIdx = months.indexOf(month);
    const mRecords = records.filter(r => new Date(r.verifiedAt).getMonth() === mIdx);
    const pres = mRecords.filter(r => r.status === "Present").length;
    const total = mRecords.length;
    return {
      month,
      present: pres,
      absent: mRecords.filter(r => r.status === "Absent").length,
      percentage: total > 0 ? parseFloat(((pres / total) * 100).toFixed(1)) : 0
    };
  });

  // Attendance Heatmap for past 30 days
  const attendanceHeatmap = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    const match = records.find(r => new Date(r.verifiedAt).toISOString().split("T")[0] === dateStr);
    attendanceHeatmap.push({
      date: dateStr,
      count: match ? 1 : 0,
      status: match ? match.status : "No Class"
    });
  }

  res.status(200).json({
    success: true,
    overallAttendance: attendancePercentage,
    attendancePercentage,
    presentCount,
    absentCount,
    lateCount,
    totalClasses,
    requiredClassesToReach75: req75,
    requiredClassesToReach80: req80,
    requiredClassesToReach90: req90,
    predictorMessage,
    subjectWiseAttendance,
    weeklyTrend,
    monthlyTrend,
    attendanceHeatmap,
    recentAttendance: records.slice(0, 10)
  });
});

/**
 * @desc    Get Teacher Analytics
 * @route   GET /api/analytics/teacher
 * @access  Private (Teacher, Admin)
 */
const getTeacherAnalytics = asyncHandler(async (req, res) => {
  const allRecords = await Attendance.find().sort({ verifiedAt: -1 });
  const totalStudents = await Student.countDocuments();

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = allRecords.filter(
    r => new Date(r.verifiedAt).toISOString().split("T")[0] === todayStr
  );

  // Distinct student counts for today (preventing present > classStrength)
  const uniquePresentNames = new Set(
    todayRecords.filter(r => r.status === "Present").map(r => r.studentName || r.student?.toString())
  );
  const uniqueLateNames = new Set(
    todayRecords.filter(r => r.status === "Late").map(r => r.studentName || r.student?.toString())
  );

  const presentStudents = Math.min(uniquePresentNames.size, totalStudents);
  const lateStudents = uniqueLateNames.size;
  const absentStudents = Math.max(0, totalStudents - presentStudents);

  const totalClasses = allRecords.length || 1;
  const overallPresent = allRecords.filter(r => r.status === "Present").length;
  const overallClassAttendance = parseFloat(((overallPresent / totalClasses) * 100).toFixed(1));

  // Subject Statistics Aggregation
  const subjectAgg = await Attendance.aggregate([
    {
      $group: {
        _id: "$subject",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } }
      }
    }
  ]);

  const subjectStatistics = subjectAgg.map(s => ({
    subject: s._id || "Computer Science",
    averageAttendance: parseFloat(((s.present / (s.total || 1)) * 100).toFixed(1)),
    totalStudents: totalStudents,
    presentToday: presentStudents
  }));

  // Top Performing & Low Attendance Students
  const studentAgg = await Attendance.aggregate([
    {
      $group: {
        _id: "$studentName",
        total: { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } }
      }
    },
    { $sort: { present: -1 } }
  ]);

  const topPerformingStudents = studentAgg.slice(0, 5).map(s => ({
    name: s._id || "Student",
    attendance: parseFloat(((s.present / (s.total || 1)) * 100).toFixed(1))
  }));

  const lowAttendanceStudents = studentAgg.slice(-5).map(s => ({
    name: s._id || "Student",
    attendance: parseFloat(((s.present / (s.total || 1)) * 100).toFixed(1))
  }));

  res.status(200).json({
    success: true,
    todayAttendance: {
      present: presentStudents,
      absent: absentStudents,
      late: lateStudents,
      total: totalStudents
    },
    overallClassAttendance,
    classStrength: totalStudents,
    presentStudents,
    absentStudents,
    lateStudents,
    subjectStatistics,
    topPerformingStudents,
    lowAttendanceStudents,
    weeklyTrend: [
      { day: "Mon", present: Math.min(presentStudents, totalStudents), absent: absentStudents },
      { day: "Tue", present: Math.min(presentStudents, totalStudents), absent: absentStudents },
      { day: "Wed", present: Math.min(presentStudents, totalStudents), absent: absentStudents },
      { day: "Thu", present: Math.min(presentStudents, totalStudents), absent: absentStudents },
      { day: "Fri", present: Math.min(presentStudents, totalStudents), absent: absentStudents }
    ],
    monthlyTrend: [
      { month: "Jan", attendance: overallClassAttendance },
      { month: "Feb", attendance: overallClassAttendance },
      { month: "Mar", attendance: overallClassAttendance }
    ]
  });
});

/**
 * @desc    Get Admin System Analytics
 * @route   GET /api/analytics/admin
 * @access  Private (Admin)
 */
const getAdminAnalytics = asyncHandler(async (req, res) => {
  const [totalStudents, totalTeachers, activeSessions, allRecords] = await Promise.all([
    Student.countDocuments(),
    Teacher.countDocuments(),
    AttendanceSession.countDocuments({ isActive: true }),
    Attendance.find()
  ]);

  const totalCheckins = allRecords.length;
  const faceCount = allRecords.filter(r => r.method === "Face ID").length;
  const qrCount = allRecords.filter(r => r.method === "QR Scan").length;

  const faceVerificationSuccess = totalCheckins > 0 
    ? parseFloat(((faceCount / totalCheckins) * 100).toFixed(1))
    : 0.0;
  const qrVerificationSuccess = totalCheckins > 0
    ? parseFloat(((qrCount / totalCheckins) * 100).toFixed(1))
    : 0.0;

  const overallPresentCount = allRecords.filter(r => r.status === "Present").length;
  const overallAttendancePct = totalCheckins > 0
    ? parseFloat(((overallPresentCount / totalCheckins) * 100).toFixed(1))
    : 0.0;

  const departmentStatistics = [
    { department: "Computer Science", totalStudents, averageAttendance: overallAttendancePct }
  ];

  res.status(200).json({
    success: true,
    totalStudents,
    totalTeachers,
    activeSessions,
    todayAttendance: allRecords.length,
    overallAttendance: overallAttendancePct,
    faceVerificationSuccess,
    qrVerificationSuccess,
    departmentStatistics,
    systemUsage: [
      { month: "Current", faceScans: faceCount, qrScans: qrCount }
    ]
  });
});

module.exports = {
  getStudentAnalytics,
  getTeacherAnalytics,
  getAdminAnalytics
};
