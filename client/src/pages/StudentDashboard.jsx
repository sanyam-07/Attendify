import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  UserCheck, 
  Calendar, 
  BookOpen, 
  Clock, 
  MapPin, 
  CheckCircle,
  ArrowRight,
  Camera,
  Sparkles,
  Award,
  ChevronRight
} from "lucide-react";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import ErrorBoundary from "../components/ErrorBoundary";
import { attendanceService } from "../services/attendanceService";
import { studentService } from "../services/studentService";
import { subjectService } from "../services/subjectService";
import { curriculumService } from "../services/curriculumService";

import toast from "react-hot-toast";

export const StudentDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [history, setHistory] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [markedToday, setMarkedToday] = useState(false);
  const [marking, setMarking] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [profData, allAttendance, histData, subjectsList, timetableList, notifList, activeSessRes] = await Promise.all([
          studentService.getProfile(),
          attendanceService.getAllAttendance(),
          attendanceService.getAttendanceHistory(),
          curriculumService.getSubjects(),
          curriculumService.getTimetable(),
          curriculumService.getNotifications(),
          attendanceService.getActiveSession()
        ]);
        setProfile(profData);
        setAttendanceRecords(allAttendance);
        setHistory(histData);
        setSubjects(subjectsList);
        setNotifications(notifList);

        // Format today's classes from Timetable API
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayDay = days[new Date().getDay()];
        const todayTimetable = timetableList.filter(t => t.dayOfWeek === todayDay || t.dayOfWeek === "Monday");

        const formattedClasses = todayTimetable.map((t, idx) => ({
          id: t._id || `cls-${idx}`,
          subject: t.subject,
          faculty: t.teacherName || "Faculty Member",
          room: t.room,
          time: `${t.startTime} - ${t.endTime}`,
          sessionActive: activeSessRes?.active && activeSessRes?.session?.subject === t.subject,
          status: "Upcoming"
        }));

        setClasses(formattedClasses.length ? formattedClasses : [
          { id: "c1", subject: "AI & Machine Learning", faculty: "Dr. Sarah Jenkins", room: "Lab-3", time: "09:00 AM - 10:30 AM", sessionActive: activeSessRes?.active, status: "Active" },
          { id: "c2", subject: "Database Management Systems", faculty: "Prof. David Wilson", room: "Hall-101", time: "11:00 AM - 12:30 PM", sessionActive: false, status: "Upcoming" }
        ]);

        if (activeSessRes && activeSessRes.active) {
          setActiveSession(activeSessRes.session);
          setRemainingSeconds(activeSessRes.remainingSeconds || 1800);
          setMarkedToday(activeSessRes.studentMarked || false);
        }
      } catch (err) {
        console.error("Dashboard load failed", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  // Timer tick effect for active student session
  useEffect(() => {
    if (!activeSession || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setActiveSession(null);
          toast("Live attendance session has ended.", { icon: "ℹ️" });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession, remainingSeconds]);

  const handleJoinSession = () => {
    if (!activeSession) {
      navigate("/attendance");
      return;
    }
    navigate("/attendance", { state: activeSession });
  };

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
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton variant="card" count={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton variant="title" />
            <Skeleton variant="card" count={2} />
          </div>
          <div className="space-y-6">
            <Skeleton variant="title" />
            <Skeleton variant="card" />
          </div>
        </div>
      </div>
    );
  }

  const attendanceRate = profile?.overallAttendance || 78.4;
  const presentDays = profile?.presentDays || 62;
  const absentDays = profile?.absentDays || 14;
  const lateDays = profile?.lateDays || 3;

  // SVG Gauge calculations
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

  return (
    <ErrorBoundary>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 text-left"
      >
        
        {/* 1. WELCOME HERO SECTION */}
        <motion.div 
          variants={itemVariants} 
          className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent border border-slate-200/40 dark:border-slate-800/40 backdrop-blur-sm relative overflow-hidden"
        >
          {/* Decorative glows */}
          <div className="absolute -top-10 -right-10 h-32 w-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-2 relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black font-sans text-slate-905 dark:text-white flex items-center gap-2.5">
              Welcome back, {profile?.name || "Alex"} <span className="animate-pulse">👋</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wide">
              {profile?.department || "Computer Science Department"} • {profile?.semester || "6th Semester"} • Roll No: <span className="font-mono text-primary font-bold">{profile?.enrollmentNo || profile?.enrollment || "CS20261001"}</span>
            </p>
          </div>
          
          {/* face status */}
          <div className="flex items-center gap-4 relative z-10 bg-white/40 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-200/50 dark:border-slate-850">
            <div className="text-left space-y-0.5">
              <p className="text-[9px] uppercase font-bold tracking-widest text-slate-450 dark:text-slate-550">Biometrics Identity</p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Face Verified</p>
            </div>
            <Badge variant={profile?.faceRegistered ? "success" : "danger"}>
              {profile?.faceRegistered ? "Enrolled" : "Not Enrolled"}
            </Badge>
          </div>
        </motion.div>

        {/* LIVE ATTENDANCE SESSION CARD (If session is active) */}
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-blue-500/10 border border-blue-500/30 dark:border-blue-500/20 backdrop-blur-sm shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-2 text-left">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-red-500">Live Attendance Session Active</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{activeSession.subject}</h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Faculty: <span className="text-slate-900 dark:text-slate-200">{activeSession.teacherName || "Faculty Member"}</span> • Room: <span className="text-red-400 font-mono font-extrabold">{activeSession.room}</span>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right space-y-0.5">
                <p className="text-[9px] uppercase font-bold tracking-wider text-slate-450">Remaining Time</p>
                <p className="text-lg font-black font-mono text-primary">
                  {String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:{String(remainingSeconds % 60).padStart(2, '0')}
                </p>
              </div>

              {markedToday ? (
                <Badge variant="success" className="px-4 py-2 text-xs font-bold gap-1">
                  ✓ Attendance Recorded
                </Badge>
              ) : (
                <Button
                  onClick={handleJoinSession}
                  variant="primary"
                  size="md"
                  className="gap-2 font-bold shadow-md text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  <UserCheck size={16} /> Join & Mark Attendance
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* 2. ANALYTICS TILES */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Circular attendance gauge card */}
          <Card hoverEffect={true} className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Attendance Rate</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{attendanceRate}%</h3>
              <span className="inline-block text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                Target &gt; 75%
              </span>
            </div>
            
            {/* SVG Circular indicator */}
            <div className="relative h-18 w-18 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={radius} className="stroke-slate-100 dark:stroke-slate-900 fill-none" strokeWidth="6" />
                <circle 
                  cx="40" 
                  cy="40" 
                  r={radius} 
                  className="stroke-primary fill-none transition-all duration-1000 ease-out" 
                  strokeWidth="6" 
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[10px] font-black text-slate-805 dark:text-white">Rate</span>
            </div>
          </Card>

          {/* Card 2: Present */}
          <Card hoverEffect={true} className="flex flex-col justify-between p-6 min-h-[110px]">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Present Days</p>
              <h3 className="text-2xl font-black text-emerald-500">{presentDays}</h3>
            </div>
            <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-500">Lectures checked-in successfully</p>
          </Card>

          {/* Card 3: Absent */}
          <Card hoverEffect={true} className="flex flex-col justify-between p-6 min-h-[110px]">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Absent Days</p>
              <h3 className="text-2xl font-black text-danger">{absentDays}</h3>
            </div>
            <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-500">Missed session counters</p>
          </Card>

          {/* Card 4: Late */}
          <Card hoverEffect={true} className="flex flex-col justify-between p-6 min-h-[110px]">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-500">Late Days</p>
              <h3 className="text-2xl font-black text-amber-500">{lateDays}</h3>
            </div>
            <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-500">Late session logs</p>
          </Card>
          
        </motion.div>

        {/* 3. COLUMNS WRAPPERS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Today's schedule */}
          <motion.div variants={itemVariants} className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-900/60 pb-3">
              <h3 className="text-base sm:text-lg font-extrabold font-sans text-slate-950 dark:text-white flex items-center gap-2.5">
                <Calendar size={18} className="text-primary" /> Today's Lectures
              </h3>
              <span className="text-xs font-bold text-slate-400">
                {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="space-y-4">
              {classes.length === 0 ? (
                <EmptyState 
                  title="No Scheduled Classes Today" 
                  description="Enjoy your day! There are no lectures or practical labs set for today." 
                />
              ) : (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      cls.sessionActive
                        ? "bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/30 dark:border-blue-500/25 glow-primary"
                        : "bg-white/80 dark:bg-[#0c121e]/85 border-slate-200/50 dark:border-slate-800/45 hover:border-slate-350 dark:hover:border-slate-700/80"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Active ping pip */}
                      <div className="mt-1">
                        {cls.status === "Attended" ? (
                          <div className="h-4 w-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-sm">
                            <CheckCircle size={11} />
                          </div>
                        ) : cls.sessionActive ? (
                          <span className="relative flex h-3.5 w-3.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
                          </span>
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
                        )}
                      </div>

                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">{cls.subject}</h4>
                          <Badge variant={cls.sessionActive ? "primary" : cls.status === "Attended" ? "success" : "neutral"}>
                            {cls.sessionActive ? "Active" : cls.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 flex-wrap">
                          <span className="flex items-center gap-1"><Clock size={12} /> {cls.time}</span>
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-red-400" /> {cls.room}</span>
                          <span className="hidden sm:inline text-slate-300 dark:text-slate-800">•</span>
                          <span>{cls.faculty}</span>
                        </div>
                      </div>
                    </div>

                    {/* Button check-in */}
                    <div className="self-end sm:self-auto">
                      {cls.sessionActive ? (
                        <Link to="/attendance" state={{ classId: cls.id, subject: cls.subject, faculty: cls.faculty, room: cls.room }}>
                          <Button variant="primary" size="sm" className="glow-primary animate-pulse w-full sm:w-auto font-bold rounded-xl text-xs px-4">
                            Check In
                          </Button>
                        </Link>
                      ) : cls.status === "Attended" ? (
                        <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                          <CheckCircle size={14} /> Verified
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" disabled={true} className="w-full sm:w-auto text-slate-400 dark:text-slate-600 border-slate-200/50 dark:border-slate-850/50 bg-slate-50/50 dark:bg-slate-900/10 font-bold rounded-xl text-xs">
                          Locked
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Actions grid */}
            <div className="space-y-4 pt-4">
              <h3 className="text-base font-extrabold font-sans text-slate-905 dark:text-white">Quick Shortcuts</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card hoverEffect={true} onClick={() => navigate("/attendance")} className="p-5 text-center cursor-pointer">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-500 mb-3 shadow-inner">
                    <UserCheck size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Attendance Scan</p>
                </Card>
                
                <Card hoverEffect={true} onClick={() => navigate("/curriculum")} className="p-5 text-center cursor-pointer">
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-500 mb-3 shadow-inner">
                    <Calendar size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Class Timetable</p>
                </Card>

                <Card hoverEffect={true} onClick={() => navigate("/curriculum")} className="p-5 text-center cursor-pointer">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-555 mb-3 shadow-inner">
                    <BookOpen size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Syllabus Sync</p>
                </Card>

                <Card hoverEffect={true} onClick={() => navigate("/profile")} className="p-5 text-center cursor-pointer">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-500 mb-3 shadow-inner">
                    <Camera size={18} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Biometric Enroll</p>
                </Card>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Recent check-ins and AI warnings */}
          <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-900/60 pb-3">
              <h3 className="text-base sm:text-lg font-extrabold font-sans text-slate-950 dark:text-white">
                Recent Check-ins
              </h3>
              <Link to="/analytics" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                View All <ArrowRight size={13} />
              </Link>
            </div>

            {/* List */}
            <Card hoverEffect={false} className="divide-y divide-slate-100 dark:divide-slate-850 p-0 overflow-hidden">
              {history.slice(0, 4).map((hist) => (
                <div key={hist.id} className="p-4.5 flex items-center justify-between gap-3 text-left">
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{hist.subject}</p>
                    <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 flex items-center gap-1.5">
                      <span>{hist.date}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><MapPin size={10} /> {hist.room}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Badge variant={hist.status === "Present" ? "success" : hist.status === "Late" ? "warning" : "danger"}>
                      {hist.status}
                    </Badge>
                    <p className="text-[9px] text-slate-450 font-mono mt-1">{hist.time !== "-" ? hist.time : ""}</p>
                  </div>
                </div>
              ))}
            </Card>

            {/* AI suggestion panel */}
            <Card hoverEffect={true} className="bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-transparent border border-indigo-500/25 dark:border-indigo-500/20 text-left p-6 relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 h-20 w-20 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
              
              <h4 className="text-xs font-extrabold text-indigo-400 flex items-center gap-2">
                <Sparkles size={15} className="animate-spin-slow text-indigo-400" />
                AI Attendance insights
              </h4>
              <p className="text-[11px] text-slate-650 dark:text-slate-350 leading-relaxed mt-3">
                Your attendance in <strong>DBMS (70.6%)</strong> is below university guidelines (75%). You must attend the next 3 consecutive lectures to restore compliance.
              </p>
              <Button
                onClick={() => navigate("/attendance")}
                variant="ghost"
                size="sm"
                className="mt-4 p-0 text-xs font-bold text-indigo-400 hover:text-indigo-300 hover:bg-transparent inline-flex items-center"
              >
                Scan Next Session <ChevronRight size={13} className="ml-0.5" />
              </Button>
            </Card>

            {/* System Notifications Panel */}
            <Card hoverEffect={true} className="bg-white/80 dark:bg-[#0c121e]/85 border border-slate-200/50 dark:border-slate-800/45 text-left p-5 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center justify-between">
                <span>System Notifications</span>
                <span className="text-[10px] font-mono text-primary font-bold">{notifications.length} New</span>
              </h4>
              <div className="space-y-2.5">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-450 dark:text-slate-500 py-1">No notifications.</p>
                ) : (
                  notifications.slice(0, 2).map((notif) => (
                    <div key={notif._id || notif.id} className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/40 dark:border-slate-850 space-y-1">
                      <p className="text-xs font-bold text-slate-850 dark:text-slate-200">{notif.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </motion.div>
          
        </div>
        
      </motion.div>
    </ErrorBoundary>
  );
};

export default StudentDashboard;
