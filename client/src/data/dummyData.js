// Dummy JSON data for Attendify platform
// This file acts as the local "database" for our frontend mock services.

export const dummyUsers = {
  student: {
    id: "STU001",
    name: "Alex Rivera",
    email: "alex.rivera@university.edu",
    role: "student",
    enrollmentNo: "ENR202409831",
    department: "Computer Science & Engineering",
    semester: "6th Semester",
    phone: "+1 (555) 234-5678",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120",
    faceRegistered: true,
    faceRegistrationDate: "2026-02-15",
    overallAttendance: 78.4,
    presentDays: 62,
    absentDays: 14,
    lateDays: 3,
  },
  teacher: {
    id: "TCH012",
    name: "Dr. Sarah Jenkins",
    email: "sarah.jenkins@university.edu",
    role: "teacher",
    department: "Computer Science & Engineering",
    designation: "Associate Professor",
    phone: "+1 (555) 987-6543",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=120",
    classesToday: [
      { id: "c1", name: "Mathematics IV", time: "09:00 AM - 10:30 AM", room: "LHC-102", batch: "CSE-A", semester: "6th" },
      { id: "c2", name: "AI & Machine Learning", time: "11:00 AM - 12:30 PM", room: "Lab-3", batch: "CSE-A & B", semester: "6th" },
      { id: "c3", name: "Software Engineering", time: "02:00 PM - 03:30 PM", room: "LHC-204", batch: "CSE-B", semester: "6th" }
    ]
  },
  admin: {
    id: "ADM001",
    name: "Principal Arthur Pendelton",
    email: "admin.office@university.edu",
    role: "admin",
    department: "Administration",
    phone: "+1 (555) 111-2222",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120",
  }
};

export const todayClasses = [
  {
    id: "SUB301",
    subject: "AI & Machine Learning",
    faculty: "Dr. Sarah Jenkins",
    time: "11:00 AM - 12:30 PM",
    room: "Lab-3",
    status: "Upcoming",
    sessionActive: true,
    code: "CSE-301"
  },
  {
    id: "SUB302",
    subject: "Database Management Systems",
    faculty: "Prof. Michael Chang",
    time: "01:30 PM - 03:00 PM",
    room: "LHC-104",
    status: "Scheduled",
    sessionActive: false,
    code: "CSE-302"
  },
  {
    id: "SUB303",
    subject: "Software Engineering",
    faculty: "Dr. Sarah Jenkins",
    time: "03:30 PM - 05:00 PM",
    room: "LHC-204",
    status: "Scheduled",
    sessionActive: false,
    code: "CSE-303"
  }
];

export const weeklyTimetable = {
  Monday: [
    { subject: "AI & Machine Learning", time: "11:00 AM - 12:30 PM", room: "Lab-3", faculty: "Dr. Sarah Jenkins" },
    { subject: "DBMS", time: "01:30 PM - 03:00 PM", room: "LHC-104", faculty: "Prof. Michael Chang" }
  ],
  Tuesday: [
    { subject: "Mathematics IV", time: "09:00 AM - 10:30 AM", room: "LHC-102", faculty: "Dr. Sarah Jenkins" },
    { subject: "Computer Networks", time: "11:00 AM - 12:30 PM", room: "Lab-1", faculty: "Dr. Robert Vance" },
    { subject: "Software Engineering", time: "03:30 PM - 05:00 PM", room: "LHC-204", faculty: "Dr. Sarah Jenkins" }
  ],
  Wednesday: [
    { subject: "AI & Machine Learning", time: "11:00 AM - 12:30 PM", room: "Lab-3", faculty: "Dr. Sarah Jenkins" },
    { subject: "DBMS", time: "01:30 PM - 03:00 PM", room: "LHC-104", faculty: "Prof. Michael Chang" },
    { subject: "Software Engineering", time: "03:30 PM - 05:00 PM", room: "LHC-204", faculty: "Dr. Sarah Jenkins" }
  ],
  Thursday: [
    { subject: "Computer Networks", time: "11:00 AM - 12:30 PM", room: "Lab-1", faculty: "Dr. Robert Vance" },
    { subject: "Mathematics IV", time: "02:00 PM - 03:30 PM", room: "LHC-102", faculty: "Dr. Sarah Jenkins" }
  ],
  Friday: [
    { subject: "AI & Machine Learning Lab", time: "09:00 AM - 12:00 PM", room: "Lab-3", faculty: "Dr. Sarah Jenkins" },
    { subject: "DBMS Lab", time: "01:30 PM - 04:30 PM", room: "Lab-2", faculty: "Prof. Michael Chang" }
  ]
};

export const attendanceHistory = [
  { id: "h1", date: "2026-07-19", subject: "Mathematics IV", status: "Present", time: "09:05 AM", method: "Face ID", room: "LHC-102" },
  { id: "h2", date: "2026-07-18", subject: "Computer Networks", status: "Present", time: "11:02 AM", method: "Face ID", room: "Lab-1" },
  { id: "h3", date: "2026-07-18", subject: "Software Engineering", status: "Present", time: "03:38 PM", method: "QR Scan", room: "LHC-204" },
  { id: "h4", date: "2026-07-17", subject: "AI & Machine Learning", status: "Present", time: "11:04 AM", method: "Face ID", room: "Lab-3" },
  { id: "h5", date: "2026-07-17", subject: "Database Management Systems", status: "Absent", time: "-", method: "-", room: "LHC-104" },
  { id: "h6", date: "2026-07-16", subject: "Computer Networks", status: "Present", time: "11:15 AM", method: "QR Scan", room: "Lab-1" },
  { id: "h7", date: "2026-07-16", subject: "Mathematics IV", status: "Late", time: "09:22 AM", method: "QR Scan", room: "LHC-102" },
  { id: "h8", date: "2026-07-15", subject: "AI & Machine Learning", status: "Present", time: "11:03 AM", method: "Face ID", room: "Lab-3" },
];

export const subjectAttendance = [
  { subject: "AI & Machine Learning", code: "CSE-301", present: 16, absent: 2, late: 0, percentage: 88.8, faculty: "Dr. Sarah Jenkins", syllabus: 72 },
  { subject: "Database Management Systems", code: "CSE-302", present: 12, absent: 4, late: 1, percentage: 70.6, faculty: "Prof. Michael Chang", syllabus: 60 },
  { subject: "Software Engineering", code: "CSE-303", present: 14, absent: 3, late: 0, percentage: 82.3, faculty: "Dr. Sarah Jenkins", syllabus: 80 },
  { subject: "Computer Networks", code: "CSE-304", present: 11, absent: 4, late: 1, percentage: 68.7, faculty: "Dr. Robert Vance", syllabus: 65 },
  { subject: "Mathematics IV", code: "MTH-302", present: 9, absent: 1, late: 1, percentage: 81.8, faculty: "Dr. Sarah Jenkins", syllabus: 55 }
];

export const weeklyStats = [
  { day: "Mon", present: 90, average: 82 },
  { day: "Tue", present: 75, average: 80 },
  { day: "Wed", present: 88, average: 81 },
  { day: "Thu", present: 65, average: 80 },
  { day: "Fri", present: 95, average: 84 }
];

export const monthlyStats = [
  { month: "Feb", attendance: 82 },
  { month: "Mar", attendance: 85 },
  { month: "Apr", attendance: 76 },
  { month: "May", attendance: 79 },
  { month: "Jun", attendance: 81 },
  { month: "Jul", attendance: 78.4 }
];

export const heatmapData = [
  { week: 1, Mon: 4, Tue: 3, Wed: 4, Thu: 2, Fri: 4 },
  { week: 2, Mon: 4, Tue: 4, Wed: 3, Thu: 4, Fri: 4 },
  { week: 3, Mon: 3, Tue: 0, Wed: 4, Thu: 4, Fri: 3 },
  { week: 4, Mon: 4, Tue: 4, Wed: 4, Thu: 1, Fri: 4 }
];

export const mockNotifications = [
  { id: "n1", type: "session_start", title: "Attendance Session Started", message: "Dr. Sarah Jenkins started attendance for AI & Machine Learning. Mark your presence now.", time: "Just now", read: false, link: "/attendance" },
  { id: "n2", type: "success", title: "Attendance Marked", message: "Your attendance for Mathematics IV has been successfully verified using Face ID.", time: "1 hour ago", read: true },
  { id: "n3", type: "assignment", title: "New Assignment Added", message: "DBMS Assignment 3: 'Query Optimization' is due on July 25, 2026.", time: "Yesterday", read: true },
  { id: "n4", type: "warning", title: "Attendance Missed Alert", message: "You were marked absent for Database Management Systems on July 17.", time: "2 days ago", read: true },
  { id: "n5", type: "holiday", title: "Holiday Notice", message: "College will remain closed on July 24 on account of Founder's Day.", time: "3 days ago", read: true }
];

export const assignments = [
  { id: "a1", title: "Neural Networks Implementation", subject: "AI & Machine Learning", due: "2026-07-22", status: "Submitted", grade: "A" },
  { id: "a2", title: "Normalization & Indexing Problems", subject: "Database Management Systems", due: "2026-07-25", status: "Pending", grade: "-" },
  { id: "a3", title: "SRS Documentation", subject: "Software Engineering", due: "2026-07-30", status: "Pending", grade: "-" }
];

export const upcomingExams = [
  { id: "e1", title: "Mid-Term Examination", subject: "AI & Machine Learning", date: "2026-08-05", time: "10:00 AM - 12:00 PM", portion: "Units 1 to 3" },
  { id: "e2", title: "Practical Lab Exam", subject: "Database Management Systems", date: "2026-08-07", time: "01:30 PM - 04:30 PM", portion: "SQL & Schema Design" }
];

export const adminStats = {
  totalStudents: 1240,
  totalTeachers: 68,
  totalDepartments: 6,
  averageAttendance: 81.2,
  departmentStats: [
    { name: "Computer Science", students: 450, attendance: 84.5 },
    { name: "Electrical Eng.", students: 220, attendance: 78.2 },
    { name: "Mechanical Eng.", students: 190, attendance: 76.8 },
    { name: "Civil Eng.", students: 150, attendance: 75.4 },
    { name: "Electronics Eng.", students: 180, attendance: 80.1 },
    { name: "Bio-Technology", students: 50, attendance: 82.9 }
  ],
  systemActivities: [
    { id: "sa1", user: "Dr. Jenkins", action: "Started attendance session", target: "AI & ML (CSE-A)", time: "10 mins ago" },
    { id: "sa2", user: "Admin Office", action: "Added new teacher profile", target: "Dr. Frank Miller", time: "1 hour ago" },
    { id: "sa3", user: "System", action: "Auto-archived weekly logs", target: "Week 28 Reports", time: "12 hours ago" },
    { id: "sa4", user: "Prof. Chang", action: "Exported attendance sheet", target: "DBMS Lab", time: "Yesterday" }
  ]
};

export const mockTeachers = [
  { id: "TCH012", name: "Dr. Sarah Jenkins", email: "sarah.jenkins@university.edu", department: "Computer Science", subjects: ["AI & ML", "Software Eng.", "Maths"], classes: 12, rating: 4.8 },
  { id: "TCH013", name: "Prof. Michael Chang", email: "michael.chang@university.edu", department: "Computer Science", subjects: ["DBMS", "OS"], classes: 15, rating: 4.6 },
  { id: "TCH014", name: "Dr. Robert Vance", email: "robert.vance@university.edu", department: "Computer Science", subjects: ["Computer Networks", "Cyber Security"], classes: 10, rating: 4.5 },
  { id: "TCH015", name: "Prof. Clara Higgins", email: "clara.higgins@university.edu", department: "Electrical Eng.", subjects: ["Digital Circuits", "Signal Processing"], classes: 14, rating: 4.7 }
];

export const mockStudents = [
  { id: "STU001", name: "Alex Rivera", email: "alex.rivera@university.edu", enrollment: "ENR202409831", department: "Computer Science", semester: "6th", attendance: 78.4, status: "Active" },
  { id: "STU002", name: "Brenda Vance", email: "brenda.v@university.edu", enrollment: "ENR202409832", department: "Computer Science", semester: "6th", attendance: 89.1, status: "Active" },
  { id: "STU003", name: "Charles Miller", email: "charles.m@university.edu", enrollment: "ENR202409833", department: "Computer Science", semester: "6th", attendance: 64.2, status: "Warning" },
  { id: "STU004", name: "David Kim", email: "david.k@university.edu", enrollment: "ENR202409834", department: "Computer Science", semester: "6th", attendance: 92.5, status: "Active" },
  { id: "STU005", name: "Emma Watson", email: "emma.w@university.edu", enrollment: "ENR202409835", department: "Computer Science", semester: "6th", attendance: 74.8, status: "Warning" }
];
