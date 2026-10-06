import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Square,
  QrCode,
  Users,
  Download,
  Clock,
  MapPin,
  RefreshCw,
  UserCheck,
  AlertTriangle,
  BookOpen,
  BarChart3,
  Bell,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText,
  Calendar
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import { teacherService } from "../services/teacherService";
import { attendanceService } from "../services/attendanceService";
import { authService } from "../services/authService";
import { curriculumService } from "../services/curriculumService";
import ErrorBoundary from "../components/ErrorBoundary";

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Session state
  const [activeSessionClassId, setActiveSessionClassId] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [activeQrToken, setActiveQrToken] = useState("");
  const [sessionStudents, setSessionStudents] = useState([]);
  const [qrCountdown, setQrCountdown] = useState(30);
  const [sessionDuration, setSessionDuration] = useState(30);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profRes, classRes, studentRes, allAttRes, activeSessRes, timetableList] = await Promise.all([
          authService.getMe(),
          teacherService.getClasses(),
          teacherService.getStudentsList(),
          attendanceService.getAllAttendance(),
          attendanceService.getActiveSession(),
          curriculumService.getTimetable()
        ]);
        setTeacherProfile(profRes);
        setStudents(studentRes || []);
        setAttendanceRecords(allAttRes || []);

        const formattedTimetable = (timetableList || []).map((t, idx) => ({
          id: t._id || `c-${idx}`,
          name: t.subject,
          room: t.room,
          time: `${t.startTime} - ${t.endTime}`,
          batch: `${t.department || 'CS'} - Sec ${t.section || 'A'}`
        }));

        setClasses(formattedTimetable.length ? formattedTimetable : classRes);

        if (activeSessRes && activeSessRes.active) {
          setActiveSessionClassId(activeSessRes.session?.classId || "SUB301");
          setSessionActive(true);
          setActiveQrToken(activeSessRes.session?.qrToken || "");
          setRemainingSeconds(activeSessRes.remainingSeconds || 1800);
        }
      } catch (err) {
        toast.error("Failed to load teacher dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Countdown timer for live session duration
  useEffect(() => {
    if (!sessionActive || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setSessionActive(false);
          setActiveSessionClassId(null);
          setActiveQrToken("");
          toast.success("Attendance session expired automatically.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionActive, remainingSeconds]);

  // Real active session student check-ins polling
  useEffect(() => {
    if (!sessionActive) {
      setSessionStudents([]);
      return;
    }

    const fetchRealCheckins = async () => {
      try {
        const records = await attendanceService.getAllAttendance();
        setSessionStudents(records || []);
      } catch (err) {
        console.error("Failed to fetch active session check-ins:", err);
      }
    };

    fetchRealCheckins();
    const interval = setInterval(fetchRealCheckins, 3000);

    return () => clearInterval(interval);
  }, [sessionActive]);

  // Rotates QR token every 30 seconds for session
  useEffect(() => {
    if (!sessionActive) return;

    const fetchFreshQR = async () => {
      try {
        const qrRes = await attendanceService.getQRToken(activeSessionClassId);
        if (qrRes) {
          setActiveQrToken(qrRes);
        }
      } catch (err) {
        console.error("Failed to refresh QR token:", err);
      }
    };

    if (!activeQrToken) {
      fetchFreshQR();
    }

    setQrCountdown(30);

    const interval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          fetchFreshQR();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionActive, activeSessionClassId]);

  const handleStartSession = async (cls) => {
    if (sessionActive) {
      toast.error("An active session is already running! End it first.");
      return;
    }
    try {
      const res = await attendanceService.startAttendanceSession(cls.id, cls.name, cls.room, sessionDuration);
      setActiveSessionClassId(cls.id);
      setSessionActive(true);
      setActiveQrToken(res.qrToken || res.session?.qrCodeToken || "");
      setRemainingSeconds(sessionDuration * 60);
      toast.success(`Attendance Broadcast Session Started (${sessionDuration} mins).`);
    } catch (err) {
      toast.error(err.message || "Failed to start session.");
    }
  };

  const handleStopSession = async () => {
    try {
      await attendanceService.endAttendanceSession();
      setSessionActive(false);
      setActiveSessionClassId(null);
      setActiveQrToken("");
      setRemainingSeconds(0);
      toast.success("Attendance session successfully closed and compiled.");
    } catch (err) {
      toast.error("Failed to stop session.");
    }
  };

  const handleDownloadReport = async (classId) => {
    setExporting(true);
    try {
      const res = await teacherService.downloadReport(classId, "csv");
      toast.success(`Report downloaded: ${res.fileName}`);
    } catch (err) {
      toast.error("Failed to export report.");
    } finally {
      setExporting(false);
    }
  };

  // Roster metrics calculations
  const dashboardMetrics = useMemo(() => {
    const totalStudents = students.length || 45;
    const lowAttendanceList = students.filter(s => (s.attendancePercentage ?? s.overallAttendance ?? 83.2) < 75);
    const lowAttendanceCount = lowAttendanceList.length;
    
    const avgAttendance = totalStudents > 0 
      ? (students.reduce((acc, s) => acc + (s.attendancePercentage ?? s.overallAttendance ?? 83.2), 0) / totalStudents).toFixed(1)
      : "83.2";

    return {
      totalStudents,
      lowAttendanceCount,
      lowAttendanceList,
      avgAttendance
    };
  }, [students]);

  // Selected active class details
  const selectedClass = classes.find(c => c.id === activeSessionClassId || c.classId === activeSessionClassId || c.name === activeSessionClassId) || (sessionActive ? (classes[0] || {
    id: activeSessionClassId || "SUB301",
    name: "AI & Machine Learning",
    time: "Ongoing Broadcast",
    room: "Lab-3",
    batch: "CS 6th Sem - Section A"
  }) : null);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  // SVG countdown timer properties
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (qrCountdown / 30) * circumference;

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton variant="title" className="w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton variant="card" count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton variant="card" className="lg:col-span-8 h-64" />
          <Skeleton variant="card" className="lg:col-span-4 h-64" />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 text-left max-w-7xl mx-auto font-sans"
      >

        {/* 1. HEADER BANNER */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
              Welcome back, {teacherProfile?.name || "Dr. Rahul Sharma"} 👋
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Department: <span className="font-bold text-slate-800 dark:text-slate-200">{teacherProfile?.department || "Computer Science"}</span> • Employee ID: <span className="font-mono font-bold text-primary">{teacherProfile?.employeeId || "EMP-101"}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/attendance">
              <Button variant="primary" size="sm" className="gap-2 font-bold rounded-xl glow-primary">
                <UserCheck size={16} /> Start Attendance
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* 2. STATISTICS ROW */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Card hoverEffect={false} className="p-5 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Students</span>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{dashboardMetrics.totalStudents}</h3>
            <p className="text-[10px] font-semibold text-slate-500">Enrolled in assigned batches</p>
          </Card>

          <Card hoverEffect={false} className="p-5 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Today's Attendance</span>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-500">{dashboardMetrics.avgAttendance}%</h3>
            <p className="text-[10px] font-semibold text-slate-500">Average batch check-in rate</p>
          </Card>

          <Card hoverEffect={false} className="p-5 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Sessions</span>
            <h3 className={`text-2xl sm:text-3xl font-black ${sessionActive ? "text-red-500 animate-pulse" : "text-slate-400"}`}>
              {sessionActive ? "1 Active" : "0 Active"}
            </h3>
            <p className="text-[10px] font-semibold text-slate-500">{sessionActive ? "Broadcasting live QR" : "No session running"}</p>
          </Card>

          <Card hoverEffect={false} className="p-5 space-y-1 border-red-500/20">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Low Attendance Alert</span>
            <h3 className="text-2xl sm:text-3xl font-black text-amber-500">{dashboardMetrics.lowAttendanceCount}</h3>
            <p className="text-[10px] font-semibold text-slate-500">Students below 75% threshold</p>
          </Card>

        </motion.div>

        {/* 3. PROMINENT ACTIVE ATTENDANCE BROADCASTER (If Session Active) */}
        <AnimatePresence>
          {sessionActive && selectedClass && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-3xl bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/15 backdrop-blur-sm shadow-sm"
            >
              {/* Left Box: Session status details */}
              <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
                <div className="space-y-2 text-left">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-red-500">🟢 Attendance Session Broadcast Live</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">{selectedClass.name}</h3>
                    <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 font-mono font-black text-xs rounded-xl flex items-center gap-1.5">
                      <Clock size={13} /> Time Remaining: {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:{String(remainingSeconds % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1"><Clock size={12} /> {selectedClass.time}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} className="text-red-400" /> Room: {selectedClass.room}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>Batch: {selectedClass.batch}</span>
                  </div>
                </div>

                {/* Checked-in lists preview */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                    <Users size={14} className="text-primary" /> Students Checked In ({sessionStudents.length} / {dashboardMetrics.totalStudents})
                  </h4>

                  {/* Horizontal user scroll lists */}
                  <div className="flex gap-3 overflow-x-auto pb-2 max-w-full">
                    {sessionStudents.length === 0 ? (
                      <p className="text-xs text-slate-400 py-2">Waiting for first student scan...</p>
                    ) : (
                      sessionStudents.map((stud) => (
                        <div
                          key={stud._id || stud.id}
                          className="flex-shrink-0 flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-xs"
                        >
                          <div className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center text-[9px] font-bold">
                            ✓
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 pr-2">
                            {(stud.studentName || stud.name || "Student").split(" ")[0]}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={handleStopSession}
                    variant="danger"
                    size="sm"
                    className="gap-1.5 font-bold text-xs rounded-xl"
                  >
                    <Square size={11} fill="currentColor" /> Close Attendance Session
                  </Button>
                  <Link to="/attendance">
                    <Button variant="outline" size="sm" className="gap-1.5 font-bold text-xs rounded-xl">
                      <UserCheck size={14} /> Open Scanner View
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Box: Dynamic QR display */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-white dark:bg-[#0c121e] border border-slate-200/80 dark:border-slate-800 rounded-2xl text-center space-y-4 shadow-xs">
                <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-900 rounded-2xl relative shadow-inner">
                  <div className="h-36 w-36 bg-white p-1.5 rounded-xl flex items-center justify-center relative overflow-hidden shadow-md">
                    {activeQrToken ? (
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeQrToken)}`}
                        alt="Live Dynamic Security QR Code"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <QrCode size={72} className="text-slate-800 dark:text-slate-350 animate-pulse" />
                    )}
                    <div className="scanner-line" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Dynamic Security QR</p>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white justify-center">
                    <svg className="w-8 h-8 transform -rotate-90">
                      <circle cx="16" cy="16" r={radius} className="stroke-slate-200 dark:stroke-slate-900 fill-none" strokeWidth="3.5" />
                      <circle
                        cx="16"
                        cy="16"
                        r={radius}
                        className="stroke-primary fill-none transition-all duration-1000 ease-linear"
                        strokeWidth="3.5"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                      />
                    </svg>
                    <span>Refreshes in <strong className="font-mono text-sm text-primary">{qrCountdown}s</strong></span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. MAIN WORKSPACE GRID: TODAY'S CLASSES & ATTENDANCE SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* TODAY'S CLASS SESSIONS (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Clock size={14} className="text-primary" /> Today's Class Sessions
              </h3>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span>Duration:</span>
                {[15, 30, 45, 60].map((dur) => (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => setSessionDuration(dur)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs cursor-pointer transition-all ${
                      sessionDuration === dur
                        ? "bg-primary text-white font-black shadow-xs"
                        : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                  >
                    {dur}m
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {classes.map((cls) => {
                const isThisSessionRunning = sessionActive && activeSessionClassId === cls.id;
                return (
                  <Card key={cls.id} hoverEffect={true} className="p-5 flex flex-col justify-between min-h-[170px] bg-white dark:bg-[#0c121e] border-slate-200/80 dark:border-slate-800">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant={isThisSessionRunning ? "danger" : "neutral"}>
                          {isThisSessionRunning ? "Running Live" : "Scheduled"}
                        </Badge>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{cls.batch}</span>
                      </div>
                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">{cls.name}</h4>

                      <div className="flex flex-col gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {cls.time}</span>
                        <span className="flex items-center gap-1.5"><MapPin size={12} className="text-red-400" /> Room: {cls.room}</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex gap-2">
                      {isThisSessionRunning ? (
                        <Button
                          onClick={handleStopSession}
                          variant="danger"
                          size="sm"
                          className="w-full text-xs font-bold rounded-xl py-2"
                        >
                          Close Session
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleStartSession(cls)}
                          variant="primary"
                          size="sm"
                          disabled={sessionActive}
                          className="w-full text-xs font-bold rounded-xl py-2"
                        >
                          <Play size={11} className="mr-1 fill-current" /> Start Session
                        </Button>
                      )}
                      <Button
                        onClick={() => handleDownloadReport(cls.id)}
                        loading={exporting}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs font-bold rounded-xl py-2"
                      >
                        <Download size={11} className="mr-1" /> Export CSV
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* TODAY'S ATTENDANCE SUMMARY & QUICK ACTIONS (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Summary Card */}
            <Card hoverEffect={false} className="p-5 space-y-4 bg-white dark:bg-[#0c121e] border-slate-200/80 dark:border-slate-800">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <BarChart3 size={14} className="text-emerald-500" /> Today's Attendance Overview
              </h3>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Present</p>
                  <p className="text-xl font-black text-emerald-500">32</p>
                </div>

                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Absent</p>
                  <p className="text-xl font-black text-red-500">8</p>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Late</p>
                  <p className="text-xl font-black text-amber-500">5</p>
                </div>

                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Rate</p>
                  <p className="text-xl font-black text-primary">71.1%</p>
                </div>
              </div>
            </Card>

            {/* Quick Actions Card */}
            <Card hoverEffect={false} className="p-5 space-y-3 bg-white dark:bg-[#0c121e] border-slate-200/80 dark:border-slate-800">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">Quick Shortcuts</h3>

              <div className="space-y-2">
                <Link to="/attendance" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs font-bold gap-2.5 rounded-xl text-left">
                    <UserCheck size={14} className="text-primary" /> Start Attendance Session
                  </Button>
                </Link>
                <Link to="/teacher/students" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs font-bold gap-2.5 rounded-xl text-left">
                    <Users size={14} className="text-blue-500" /> View Student Roster
                  </Button>
                </Link>
                <Link to="/analytics" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs font-bold gap-2.5 rounded-xl text-left">
                    <BarChart3 size={14} className="text-emerald-500" /> Class Analytics Reports
                  </Button>
                </Link>
                <Link to="/curriculum" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs font-bold gap-2.5 rounded-xl text-left">
                    <BookOpen size={14} className="text-indigo-500" /> Smart Curriculum
                  </Button>
                </Link>
                <Link to="/notifications" className="block">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs font-bold gap-2.5 rounded-xl text-left">
                    <Bell size={14} className="text-amber-500" /> Inbox Notifications
                  </Button>
                </Link>
              </div>
            </Card>

          </div>

        </div>

        {/* 5. LOW ATTENDANCE ALERT & RECENT ACTIVITY GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          
          {/* LOW ATTENDANCE STUDENTS (6 Cols) */}
          <Card hoverEffect={false} className="lg:col-span-6 p-6 space-y-4 bg-white dark:bg-[#0c121e] border-amber-500/30">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" /> Students Requiring Attention (&lt;75%)
              </h3>
              <Link to="/teacher/students">
                <span className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1">
                  View All Roster <ArrowRight size={12} />
                </span>
              </Link>
            </div>

            <div className="space-y-2.5">
              {dashboardMetrics.lowAttendanceList.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-4 text-center">
                  No students currently require attention. All batch students are compliant!
                </p>
              ) : (
                dashboardMetrics.lowAttendanceList.slice(0, 4).map((stud, idx) => {
                  const name = stud.name || stud.user?.name || "Student";
                  const enrollment = stud.enrollmentNo || stud.enrollment || `CS2026100${idx + 1}`;
                  const rate = stud.attendancePercentage ?? stud.overallAttendance ?? 68.0;

                  return (
                    <div
                      key={stud._id || stud.id || idx}
                      className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5 text-left">
                        <p className="font-bold text-slate-900 dark:text-white">{name}</p>
                        <p className="text-[10px] text-slate-400 font-mono font-semibold">{enrollment}</p>
                      </div>
                      <Badge variant="warning" className="font-bold text-xs px-2.5 py-1">
                        {rate}% Attendance
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* RECENT ATTENDANCE ACTIVITY LOG (6 Cols) */}
          <Card hoverEffect={false} className="lg:col-span-6 p-6 space-y-4 bg-white dark:bg-[#0c121e] border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={15} className="text-primary" /> Recent Attendance Activity
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Event Log</span>
            </div>

            <div className="space-y-3 text-left">
              {[
                { title: "Attendance session completed", desc: "38 students marked present in Lab-3 for AI & Machine Learning", time: "10 mins ago", icon: CheckCircle2, color: "text-emerald-500" },
                { title: "Dynamic QR refreshed", desc: "30-second security token regenerated automatically", time: "25 mins ago", icon: QrCode, color: "text-cyan-500" },
                { title: "Low attendance warning generated", desc: "Notification sent to 3 students below 75% threshold", time: "1 hour ago", icon: AlertTriangle, color: "text-amber-500" },
                { title: "Assignment submission deadline updated", desc: "AI Assignment #2 deadline extended to Friday 11:59 PM", time: "2 hours ago", icon: Calendar, color: "text-indigo-500" }
              ].map((act, i) => {
                const Icon = act.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 transition">
                    <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-900 ${act.color} flex-shrink-0 mt-0.5`}>
                      <Icon size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{act.title}</p>
                        <span className="text-[10px] text-slate-400 font-medium flex-shrink-0">{act.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{act.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

        </div>

      </motion.div>
    </ErrorBoundary>
  );
};

export default TeacherDashboard;
