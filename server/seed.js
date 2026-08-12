// Database Seeder Script for Attendify
// Populates MongoDB Atlas with 1 Admin, 3 Teachers, 20 Students, 5 Subjects, Departments, Sessions & Attendance Records.

const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = require("./config/db");

// Load Mongoose Models
const User = require("./models/User");
const Student = require("./models/Student");
const Teacher = require("./models/Teacher");
const Subject = require("./models/Subject");
const Department = require("./models/Department");
const Attendance = require("./models/Attendance");
const AttendanceSession = require("./models/AttendanceSession");

const seedData = async () => {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await connectDB();

    console.log("Clearing existing collections...");
    await User.deleteMany();
    await Student.deleteMany();
    await Teacher.deleteMany();
    await Subject.deleteMany();
    await Department.deleteMany();
    await Attendance.deleteMany();
    await AttendanceSession.deleteMany();

    console.log("Creating Departments...");
    const depts = await Department.insertMany([
      { name: "Computer Science", code: "CS", description: "Department of Computer Science & Engineering" },
      { name: "Information Technology", code: "IT", description: "Department of Information Technology" },
      { name: "Electronics & Communication", code: "ECE", description: "Department of ECE" }
    ]);
    const csDept = depts[0];

    console.log("Creating Admin User...");
    const adminUser = await User.create({
      name: "System Admin",
      email: "admin@attendify.com",
      password: "password123",
      role: "admin",
      phone: "+1 (555) 999-0000"
    });

    console.log("Creating 3 Teachers...");
    const teacherData = [
      { name: "Dr. Sarah Jenkins", email: "sarah.jenkins@attendify.com", empId: "EMP-101", subject: "AI & Machine Learning" },
      { name: "Prof. David Wilson", email: "david.wilson@attendify.com", empId: "EMP-102", subject: "Database Management Systems" },
      { name: "Dr. Michael Brown", email: "michael.brown@attendify.com", empId: "EMP-103", subject: "Web Technologies" }
    ];

    const teacherDocs = [];
    for (const t of teacherData) {
      const u = await User.create({
        name: t.name,
        email: t.email,
        password: "password123",
        role: "teacher"
      });

      const teacherDoc = await Teacher.create({
        user: u._id,
        employeeId: t.empId,
        department: "Computer Science",
        subjects: [t.subject]
      });

      teacherDocs.push({ user: u, teacher: teacherDoc, subjectName: t.subject });
    }

    console.log("Creating 5 Subjects...");
    const subjectsData = [
      { name: "AI & Machine Learning", code: "CS601", teacher: teacherDocs[0].user._id, syllabusPercentage: 85 },
      { name: "Database Management Systems", code: "CS602", teacher: teacherDocs[1].user._id, syllabusPercentage: 78 },
      { name: "Web Technologies", code: "CS603", teacher: teacherDocs[2].user._id, syllabusPercentage: 92 },
      { name: "Operating Systems", code: "CS604", teacher: teacherDocs[0].user._id, syllabusPercentage: 70 },
      { name: "Computer Networks", code: "CS605", teacher: teacherDocs[1].user._id, syllabusPercentage: 88 }
    ];

    const createdSubjects = [];
    for (const sub of subjectsData) {
      const createdSub = await Subject.create({
        name: sub.name,
        code: sub.code,
        department: csDept._id,
        departmentName: "Computer Science",
        teacher: sub.teacher,
        credits: 4,
        syllabusPercentage: sub.syllabusPercentage
      });
      createdSubjects.push(createdSub);
    }

    console.log("Creating 20 Students...");
    const studentNames = [
      "Alex Rivera", "Emma Watson", "Liam Johnson", "Olivia Smith", "Noah Williams",
      "Ava Brown", "Ethan Davis", "Sophia Miller", "Mason Wilson", "Isabella Moore",
      "Lucas Taylor", "Mia Anderson", "Oliver Thomas", "Amelia Jackson", "Elijah White",
      "Charlotte Harris", "James Martin", "Harper Thompson", "Benjamin Garcia", "Evelyn Martinez"
    ];

    const studentDocs = [];
    for (let i = 0; i < studentNames.length; i++) {
      const name = studentNames[i];
      const firstName = name.split(" ")[0].toLowerCase();
      const email = `${firstName}.rivera@attendify.com`; // e.g. alex.rivera@attendify.com or alex.rivera
      const enrollmentNo = `CS2026${1001 + i}`;

      const u = await User.create({
        name,
        email: i === 0 ? "alex.rivera@attendify.com font" && "alex.rivera@attendify.com" : email,
        password: "password123",
        role: "student"
      });

      const s = await Student.create({
        user: u._id,
        enrollmentNo,
        department: "Computer Science",
        semester: "6th Semester",
        overallAttendance: parseFloat((75 + Math.random() * 20).toFixed(1)),
        presentDays: 55 + Math.floor(Math.random() * 15),
        absentDays: 5 + Math.floor(Math.random() * 5),
        lateDays: Math.floor(Math.random() * 4),
        faceRegistered: true
      });

      studentDocs.push({ user: u, student: s });
    }

    console.log("Creating Active & Past Attendance Sessions...");
    const activeSession = await AttendanceSession.create({
      teacher: teacherDocs[0].user._id,
      teacherName: teacherDocs[0].user.name,
      subject: "AI & Machine Learning",
      room: "Lab-3",
      classId: "SUB301",
      isActive: true,
      qrCodeToken: `qr-token-active-${Date.now()}`
    });

    console.log("Creating Timetable Schedules...");
    const Timetable = require("./models/Timetable");
    await Timetable.deleteMany();
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const timetableData = [
      { subject: "AI & Machine Learning", dayOfWeek: "Monday", startTime: "09:00 AM", endTime: "10:30 AM", room: "Lab-3", teacherName: "Dr. Sarah Jenkins" },
      { subject: "Database Management Systems", dayOfWeek: "Monday", startTime: "11:00 AM", endTime: "12:30 PM", room: "Hall-101", teacherName: "Prof. David Wilson" },
      { subject: "Web Technologies", dayOfWeek: "Tuesday", startTime: "10:00 AM", endTime: "11:30 AM", room: "Lab-1", teacherName: "Dr. Michael Brown" },
      { subject: "Operating Systems", dayOfWeek: "Wednesday", startTime: "02:00 PM", endTime: "03:30 PM", room: "Room-204", teacherName: "Dr. Sarah Jenkins" },
      { subject: "Computer Networks", dayOfWeek: "Thursday", startTime: "09:00 AM", endTime: "10:30 AM", room: "Hall-102", teacherName: "Prof. David Wilson" },
      { subject: "AI & Machine Learning", dayOfWeek: "Friday", startTime: "01:00 PM", endTime: "02:30 PM", room: "Lab-3", teacherName: "Dr. Sarah Jenkins" }
    ];
    await Timetable.insertMany(timetableData);

    console.log("Creating Assignments...");
    const Assignment = require("./models/Assignment");
    await Assignment.deleteMany();
    await Assignment.insertMany([
      { title: "Neural Network Architecture Optimization", subject: "AI & Machine Learning", teacherName: "Dr. Sarah Jenkins", dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), status: "Pending", description: "Implement backpropagation algorithm from scratch in Python." },
      { title: "SQL Schema Normalization & Indexing", subject: "Database Management Systems", teacherName: "Prof. David Wilson", dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), status: "Pending", description: "Design 3NF database schema for e-commerce system." },
      { title: "RESTful API Integration Project", subject: "Web Technologies", teacherName: "Dr. Michael Brown", dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), status: "Submitted", description: "Build full stack React Express application." }
    ]);

    console.log("Creating Exam Schedule...");
    const Exam = require("./models/Exam");
    await Exam.deleteMany();
    await Exam.insertMany([
      { title: "Mid-Term Evaluation: Machine Learning", subject: "AI & Machine Learning", examType: "Mid-Term", room: "Auditorium A", examDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), duration: "2 Hours", totalMarks: 100 },
      { title: "Lab Practical: Web Systems", subject: "Web Technologies", examType: "Lab Practical", room: "Lab-1", examDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), duration: "3 Hours", totalMarks: 50 },
      { title: "Final Comprehensive: Database Systems", subject: "Database Management Systems", examType: "Final", room: "Auditorium B", examDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), duration: "3 Hours", totalMarks: 100 }
    ]);

    console.log("Creating Notifications...");
    const Notification = require("./models/Notification");
    await Notification.deleteMany();
    await Notification.insertMany([
      { title: "Attendance Session Active", message: "Dr. Sarah Jenkins started AI & Machine Learning check-in in Lab-3.", receiverType: "Student", type: "Attendance", priority: "High", actionUrl: "#/attendance", isRead: false },
      { title: "Assignment Deadline Approaching", message: "Neural Network Architecture Optimization is due in 3 days.", receiverType: "Student", type: "Assignment", priority: "Medium", actionUrl: "#/curriculum", isRead: false },
      { title: "Mid-Term Evaluation Scheduled", message: "Machine Learning Mid-Term exam scheduled in Auditorium A.", receiverType: "Student", type: "Exam", priority: "High", actionUrl: "#/curriculum", isRead: false },
      { title: "Timetable Room Update", message: "Web Technologies lecture moved from Lab-1 to Room-204.", receiverType: "Student", type: "Timetable", priority: "Low", actionUrl: "#/curriculum", isRead: true },
      { title: "Low Attendance Alert", message: "Attention: 3 students in Database Management Systems have attendance below 75%.", receiverType: "Teacher", type: "Attendance", priority: "High", actionUrl: "#/analytics", isRead: false },
      { title: "Assignment Submissions Received", message: "18 students submitted Neural Network Architecture assignment.", receiverType: "Teacher", type: "Assignment", priority: "Medium", isRead: true },
      { title: "Biometric AI System Active", message: "Dual Face ID & Dynamic QR verification system operating at 99.8% precision.", receiverType: "All", type: "System", priority: "Medium", isRead: false },
      { title: "System Maintenance Notice", message: "Scheduled database backup will take place on Sunday at 02:00 AM.", receiverType: "All", type: "Announcement", priority: "Low", isRead: false }
    ]);

    console.log("Creating Attendance Records...");
    const rooms = ["Lab-3", "Hall-101", "Lab-1", "Room-204"];
    const statuses = ["Present", "Present", "Present", "Late", "Absent"];
    const methods = ["Face ID", "QR Scan", "Face ID"];

    for (let i = 0; i < 30; i++) {
      const randomStudent = studentDocs[i % studentDocs.length];
      const randomSubject = createdSubjects[i % createdSubjects.length];

      await Attendance.create({
        student: randomStudent.user._id,
        studentName: randomStudent.user.name,
        subject: randomSubject.name,
        faculty: teacherDocs[i % teacherDocs.length].user.name,
        room: rooms[i % rooms.length],
        status: statuses[i % statuses.length],
        method: methods[i % methods.length],
        session: activeSession._id,
        verifiedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      });
    }

    console.log("\n================================================");
    console.log("✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("================================================");
    console.log("Default Login Credentials:");
    console.log("------------------------------------------------");
    console.log("🔑 Admin:   admin@attendify.com        / password123");
    console.log("🔑 Teacher: sarah.jenkins@attendify.com/ password123");
    console.log("🔑 Student: alex.rivera@attendify.com  / password123");
    console.log("================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedData();
