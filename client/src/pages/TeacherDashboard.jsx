import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Square,
  QrCode,
  Users,
  Download,
  Clock,
  MapPin,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import { teacherService } from "../services/teacherService";
import { attendanceService } from "../services/attendanceService";
import { subjectService } from "../services/subjectService";
import { authService } from "../services/authService";
import ErrorBoundary from "../components/ErrorBoundary";

export const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Session state
  const [activeSessionClassId, setActiveSessionClassId] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [activeQrToken, setActiveQrToken] = useState("");
  const [sessionStudents, setSessionStudents] = useState([]); // Students checking in
  const [qrCountdown, setQrCountdown] = useState(10);
  const [sessionDuration, setSessionDuration] = useState(30); // 15, 30, 45, 60 mins
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profRes, classRes, studentRes, allAttRes, attHistRes, activeSessRes] = await Promise.all([
          authService.getMe(),
          teacherService.getClasses(),
          teacherService.getStudentsList(),
          attendanceService.getAllAttendance(),
          attendanceService.getAttendanceHistory(),
          attendanceService.getActiveSession()
        ]);
        setTeacherProfile(profRes);
        setClasses(classRes);
        setStudents(studentRes);
        setAttendanceRecords(allAttRes);
        setAttendanceHistory(attHistRes);

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

  // Real active session student check-ins polling from MongoDB
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

  // Rotates QR token every 10 seconds for session
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

    setQrCountdown(10);

    const interval = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          fetchFreshQR();
          return 10;
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="title" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="card" count={2} />
        </div>
      </div>
    );
  }

  const selectedClass = classes.find(c => c.id === activeSessionClassId);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  // SVG countdown timer properties
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (qrCountdown / 10) * circumference;

  return (
    <ErrorBoundary>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 text-left"
      >

        {/* HEADER BANNER */}
        <motion.div variants={itemVariants} className="border-b border-slate-205 dark:border-slate-855 pb-5">
          <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
            Faculty Console — {teacherProfile?.name || "Dr. Sarah Jenkins"}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-450 mt-1.5 font-medium leading-relaxed">
            Department: {teacherProfile?.department || "Computer Science"} • Employee ID: <span className="font-mono font-bold text-primary">{teacherProfile?.employeeId || "EMP-101"}</span>
          </p>
        </motion.div>

        {/* ACTIVE ATTENDANCE BROADCASTER SPLIT */}
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
                    <span className="text-[10px] uppercase font-bold tracking-widest text-red-500">Attendance Session Broadcast Live</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-black text-slate-950 dark:text-white leading-tight">{selectedClass.name}</h3>
                    <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 font-mono font-black text-xs rounded-xl flex items-center gap-1.5">
                      <Clock size={13} /> Time Remaining: {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:{String(remainingSeconds % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500 dark:text-slate-450">
                    <span className="flex items-center gap-1"><Clock size={12} /> {selectedClass.time}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} className="text-red-400" /> {selectedClass.room}</span>
                    <span className="text-slate-200 dark:text-slate-800">•</span>
                    <span>Batch: {selectedClass.batch}</span>
                  </div>
                </div>

                {/* Checked-in lists preview */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-400 flex items-center gap-1.5">
                    <Users size={14} className="text-primary" /> Students Checked In ({sessionStudents.length})
                  </h4>

                  {/* Horizontal user scroll lists */}
                  <div className="flex gap-3 overflow-x-auto pb-2 max-w-full">
                    {sessionStudents.length === 0 ? (
                      <p className="text-xs text-slate-450 dark:text-slate-500 py-2">Waiting for first student scan...</p>
                    ) : (
                      sessionStudents.map((stud) => (
                        <div
                          key={stud.id}
                          className="flex-shrink-0 flex items-center gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 rounded-xl shadow-sm"
                        >
                          <div className="h-5 w-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center text-[9px] font-bold shadow-inner">
                            ✓
                          </div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-250 pr-2">{(stud.studentName || stud.name || "Unknown").split(" ")[0]}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleStopSession}
                    variant="danger"
                    size="sm"
                    className="gap-1.5 font-bold text-xs rounded-xl"
                  >
                    <Square size={11} fill="currentColor" /> Close Attendance Session
                  </Button>
                </div>
              </div>

              {/* Right Box: Dynamic QR display */}
              <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 bg-white dark:bg-[#0c121e] border border-slate-200/50 dark:border-slate-850 rounded-2xl text-center space-y-4 shadow-sm">
                <div className="p-3 bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-900 rounded-2xl relative shadow-inner">
                  {/* Scannable Dynamic 2D QR Code Image */}
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

                    {/* Scanning sweep line */}
                    <div className="scanner-line" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-450">Dynamic Security QR</p>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white justify-center">
                    <svg className="w-8 h-8 transform -rotate-90">
                      <circle cx="16" cy="16" r={radius} className="stroke-slate-150 dark:stroke-slate-900 fill-none" strokeWidth="3.5" />
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

        {/* TODAY'S LECTURES */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Today's Class Sessions</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>Session Duration:</span>
              {[15, 30, 45, 60].map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => setSessionDuration(dur)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs cursor-pointer transition-all ${sessionDuration === dur
                      ? "bg-primary text-white font-black shadow-sm"
                      : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                    }`}
                >
                  {dur}m
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => {
              const isThisSessionRunning = sessionActive && activeSessionClassId === cls.id;
              return (
                <Card key={cls.id} hoverEffect={true} className="p-5 flex flex-col justify-between min-h-[160px]">
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <Badge variant={isThisSessionRunning ? "danger" : "neutral"}>
                        {isThisSessionRunning ? "Running" : "Idle"}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wide">{cls.batch}</span>
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-905 dark:text-white leading-snug">{cls.name}</h4>

                    <div className="flex flex-col gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {cls.time}</span>
                      <span className="flex items-center gap-1.5"><MapPin size={12} className="text-red-400" /> {cls.room}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-850 flex gap-3">
                    {isThisSessionRunning ? (
                      <Button
                        onClick={handleStopSession}
                        variant="danger"
                        size="sm"
                        className="w-full text-xs font-bold rounded-xl py-2"
                      >
                        Stop Broadcast
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleStartSession(cls)}
                        variant="primary"
                        size="sm"
                        disabled={sessionActive} // Can only run 1 session at a time
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
        </motion.div>

        {/* STUDENT LISTINGS */}
        <motion.div variants={itemVariants} className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Student Roster</h3>
            <div className="flex bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl px-3 py-1.5 gap-2 text-slate-400 items-center w-full sm:w-64 shadow-sm">
              <input
                type="text"
                placeholder="Search roster..."
                className="bg-transparent border-none outline-none text-xs text-slate-800 dark:text-slate-200 w-full font-semibold"
              />
            </div>
          </div>

          <Card hoverEffect={false} className="p-0 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-semibold">
                <thead>
                  <tr className="bg-slate-100/40 dark:bg-slate-900/40 border-b border-slate-200/40 dark:border-slate-800/40 text-slate-450 dark:text-slate-400">
                    <th className="p-4 font-bold uppercase tracking-wider">Student Name</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Enrollment No</th>
                    <th className="p-4 font-bold uppercase tracking-wider">Department</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-center">Avg Attendance</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-100/20 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="p-4 font-extrabold text-slate-950 dark:text-white">{student.name}</td>
                      <td className="p-4 font-mono text-slate-500 font-bold">{student.enrollment}</td>
                      <td className="p-4 text-slate-550 dark:text-slate-400">{student.department}</td>
                      <td className="p-4 font-extrabold text-center text-slate-900 dark:text-slate-200">{student.attendance}%</td>
                      <td className="p-4 text-right">
                        <Badge variant={student.attendance >= 75 ? "success" : "danger"}>
                          {student.attendance >= 75 ? "Compliant" : "Deficit"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

      </motion.div>
    </ErrorBoundary>
  );
};

export default TeacherDashboard;
