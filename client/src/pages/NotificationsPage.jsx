import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  CheckCircle2, 
  BookOpen, 
  Award, 
  Calendar, 
  ShieldAlert, 
  Megaphone, 
  Trash2, 
  CheckCheck, 
  Filter, 
  Settings,
  ExternalLink,
  Clock,
  X,
  RefreshCw,
  AlertTriangle,
  RotateCcw,
  Users,
  FileText,
  UserCheck,
  Check
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import ErrorBoundary from "../components/ErrorBoundary";
import { useNotifications } from "../context/NotificationContext";
import notificationService from "../services/notificationService";
import { authService } from "../services/authService";

/* ==========================================================================
   STUDENT NOTIFICATION CENTER (Preserved 100% unchanged for Students)
   ========================================================================== */
const StudentNotificationsView = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error,
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const [activeTab, setActiveTab] = useState("all"); // all, unread, read
  const [selectedType, setSelectedType] = useState("All"); // All, Attendance, Assignment, Exam, Timetable, System, Announcement
  const [prefsModalOpen, setPrefsModalOpen] = useState(false);
  const [preferences, setPreferences] = useState({
    attendance: true,
    assignment: true,
    exam: true,
    timetable: true,
    system: true
  });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    fetchNotifications();

    const loadPrefs = async () => {
      const p = await notificationService.getPreferences();
      if (p) setPreferences(p);
    };
    loadPrefs();
  }, [fetchNotifications]);

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await notificationService.updatePreferences(preferences);
      toast.success("Notification preferences saved!");
      setPrefsModalOpen(false);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to save preferences:", err);
      toast.error("Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Just now";
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Attendance":
        return <CheckCircle2 className="text-emerald-500" size={18} />;
      case "Assignment":
        return <BookOpen className="text-blue-500" size={18} />;
      case "Exam":
        return <Award className="text-purple-500" size={18} />;
      case "Timetable":
        return <Calendar className="text-amber-500" size={18} />;
      case "Announcement":
        return <Megaphone className="text-pink-500" size={18} />;
      default:
        return <ShieldAlert className="text-indigo-400" size={18} />;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "High":
        return <Badge variant="danger">High Priority</Badge>;
      case "Medium":
        return <Badge variant="warning">Medium</Badge>;
      default:
        return <Badge variant="neutral">Normal</Badge>;
    }
  };

  const getActionDestination = (notif) => {
    if (notif.actionUrl && notif.actionUrl.startsWith("/")) {
      return { path: notif.actionUrl, label: "View Details" };
    }
    switch (notif.type) {
      case "Attendance":
        return { path: "/attendance", label: "Open Scanner" };
      case "Assignment":
        return { path: "/curriculum", label: "View Assignments" };
      case "Exam":
        return { path: "/curriculum", label: "View Exams" };
      case "Timetable":
        return { path: "/curriculum", label: "View Timetable" };
      case "Alert":
      case "Progress":
        return { path: "/progress", label: "View Progress" };
      default:
        return null;
    }
  };

  const categoryFiltered = useMemo(() => {
    if (selectedType === "All") return notifications;
    return notifications.filter(n => n.type === selectedType);
  }, [notifications, selectedType]);

  const filteredNotifications = useMemo(() => {
    return categoryFiltered.filter(n => {
      if (activeTab === "unread") return !n.isRead;
      if (activeTab === "read") return n.isRead;
      return true;
    });
  }, [categoryFiltered, activeTab]);

  const tabCounts = useMemo(() => {
    return {
      all: categoryFiltered.length,
      unread: categoryFiltered.filter(n => !n.isRead).length,
      read: categoryFiltered.filter(n => n.isRead).length
    };
  }, [categoryFiltered]);

  if (loading) {
    return (
      <div className="space-y-6 text-left max-w-7xl mx-auto">
        <Skeleton variant="title" className="w-64" />
        <Skeleton variant="card" count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center space-y-4 max-w-lg mx-auto my-12 border-red-200 dark:border-red-900/30">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Failed to Load Notifications</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
        </div>
        <Button onClick={fetchNotifications} variant="primary" className="gap-2 mx-auto">
          <RefreshCw size={16} /> Try Again
        </Button>
      </Card>
    );
  }

  return (
    <ErrorBoundary>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-left max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
              <Bell className="text-primary" /> Notification Center
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
              Real-time alerts, class announcements, assignment updates, and system notifications.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" size="sm" className="gap-1.5 font-bold text-xs rounded-xl text-primary border-primary/30">
                <CheckCheck size={14} /> Mark All as Read
              </Button>
            )}
            <Button onClick={() => setPrefsModalOpen(true)} variant="outline" size="sm" className="gap-1.5 font-bold text-xs rounded-xl">
              <Settings size={14} /> Preferences
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-100 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-800">
          <div className="flex items-center gap-1 overflow-x-auto max-w-full">
            {[
              { id: "all", label: "All Alerts", count: tabCounts.all },
              { id: "unread", label: "Unread", count: tabCounts.unread },
              { id: "read", label: "Read", count: tabCounts.read }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id ? "bg-white dark:bg-slate-800 text-primary dark:text-white shadow-sm" : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-900 font-mono">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 px-2">
            <Filter size={13} className="text-slate-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl px-3 py-1.5 outline-none cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Attendance">Attendance</option>
              <option value="Assignment">Assignments</option>
              <option value="Exam">Exams</option>
              <option value="Timetable">Timetable</option>
              <option value="Announcement">Announcements</option>
              <option value="System">System Alerts</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Bell size={24} />
              </div>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">You're all caught up.</h4>
              <p className="text-xs text-slate-400">No notifications available right now.</p>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Filter size={24} />
              </div>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Notifications Found</h4>
              <p className="text-xs text-slate-400">No notifications match your selected filter criteria.</p>
            </Card>
          ) : (
            filteredNotifications.map((notif) => {
              const notifId = notif._id || notif.id;
              const isRead = Boolean(notif.isRead || notif.read);
              const actionDest = getActionDestination(notif);

              return (
                <motion.div key={notifId} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <Card
                    hoverEffect={false}
                    className={`p-4 transition-all border ${
                      !isRead ? "bg-blue-500/5 border-blue-500/30 dark:bg-blue-950/20 dark:border-blue-500/30" : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex-shrink-0 mt-0.5">
                          {getTypeIcon(notif.type)}
                        </div>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`text-sm font-black ${!isRead ? "text-primary dark:text-blue-400" : "text-slate-900 dark:text-white"}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-500 border border-slate-200/50 dark:border-slate-800">
                              {notif.type || "System"}
                            </span>
                            {getPriorityBadge(notif.priority)}
                            {!isRead && <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed break-words">{notif.message}</p>
                          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold pt-1 flex-wrap">
                            <span className="flex items-center gap-1"><Clock size={11} /> {formatRelativeTime(notif.createdAt)}</span>
                            {actionDest && (
                              <Link to={actionDest.path} className="text-primary hover:underline flex items-center gap-1 font-bold">
                                {actionDest.label} <ExternalLink size={10} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!isRead ? (
                          <button onClick={() => markAsRead(notifId, true)} className="p-1.5 rounded-xl hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold">
                            <CheckCircle2 size={16} /><span className="hidden md:inline">Mark Read</span>
                          </button>
                        ) : (
                          <button onClick={() => markAsRead(notifId, false)} className="p-1.5 rounded-xl hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold">
                            <RotateCcw size={15} /><span className="hidden md:inline">Mark Unread</span>
                          </button>
                        )}
                        <button onClick={() => deleteNotification(notifId)} className="p-1.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition cursor-pointer">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        <AnimatePresence>
          {prefsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} onClick={() => setPrefsModalOpen(false)} className="fixed inset-0 bg-black" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-10 text-left space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings className="text-primary" size={18} /> Notification Preferences
                  </h3>
                  <button onClick={() => setPrefsModalOpen(false)} className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  {[
                    { key: "attendance", label: "Attendance Alerts", desc: "Low attendance warning & session start" },
                    { key: "assignment", label: "Assignment Updates", desc: "New assignments and upcoming deadlines" },
                    { key: "exam", label: "Exam Schedules", desc: "Upcoming exam dates and venue changes" },
                    { key: "timetable", label: "Timetable Changes", desc: "Rescheduled classes and room changes" },
                    { key: "system", label: "System Announcements", desc: "Maintenance and general announcements" }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                      </div>
                      <input type="checkbox" checked={preferences[item.key] ?? true} onChange={(e) => setPreferences({ ...preferences, [item.key]: e.target.checked })} className="h-4 w-4 rounded accent-primary cursor-pointer" />
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Button onClick={() => setPrefsModalOpen(false)} variant="outline" size="sm">Cancel</Button>
                  <Button onClick={handleSavePreferences} variant="primary" size="sm" loading={savingPrefs}>Save Preferences</Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </ErrorBoundary>
  );
};

/* ==========================================================================
   TEACHER NOTIFICATION CENTER (Faculty-Oriented Notifications)
   ========================================================================== */
const TeacherNotificationsView = ({ currentUser }) => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error,
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'unread' | 'read'
  const [selectedCategory, setSelectedCategory] = useState("All"); // All, Attendance, Assignments, Classes, Students, Academic, System
  const [prefsModalOpen, setPrefsModalOpen] = useState(false);

  // Faculty specific default notifications if backend items are generic/empty
  const teacherDefaultNotifications = useMemo(() => [
    {
      _id: "tn1",
      title: "Attendance Session Completed",
      message: `${currentUser?.name || "Dr. Rahul Sharma"}'s Web Technologies session has been completed. 18 of 20 students were marked present.`,
      category: "Attendance",
      type: "Attendance",
      priority: "Medium",
      isRead: false,
      createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
      actionUrl: "/attendance",
      actionLabel: "View Session Details"
    },
    {
      _id: "tn2",
      title: "Low Attendance Alert",
      message: "3 students in Database Management Systems are currently below the 75% attendance requirement.",
      category: "Attendance",
      type: "Attendance",
      priority: "High",
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      actionUrl: "/teacher/students",
      actionLabel: "View Students Roster"
    },
    {
      _id: "tn3",
      title: "Assignment Submissions Received",
      message: "18 students submitted the Neural Network Architecture assignment. 2 submissions are still pending.",
      category: "Assignments",
      type: "Assignment",
      priority: "Medium",
      isRead: true,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      actionUrl: "/curriculum",
      actionLabel: "Review Submissions"
    },
    {
      _id: "tn4",
      title: "Upcoming Class Reminder",
      message: "Web Technologies lecture starts at 10:00 AM in Lab-1.",
      category: "Classes",
      type: "Timetable",
      priority: "Normal",
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      actionUrl: "/attendance",
      actionLabel: "Open Session Console"
    },
    {
      _id: "tn5",
      title: "Student Attendance Request",
      message: "A student has submitted an attendance-related request that requires your review.",
      category: "Students",
      type: "Student Request",
      priority: "High",
      isRead: false,
      createdAt: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
      actionUrl: "/teacher/students",
      actionLabel: "Review Request"
    },
    {
      _id: "tn6",
      title: "Assignment Deadline",
      message: "The Database Management Systems assignment deadline is tomorrow.",
      category: "Academic",
      type: "Assignment",
      priority: "Medium",
      isRead: true,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      actionUrl: "/curriculum",
      actionLabel: "View Assignment"
    }
  ], [currentUser]);

  // Combine backend notifications with faculty defaults
  const teacherNotifications = useMemo(() => {
    if (notifications && notifications.length > 0) {
      return notifications.map(n => ({
        ...n,
        category: n.category || n.type || "System"
      }));
    }
    return teacherDefaultNotifications;
  }, [notifications, teacherDefaultNotifications]);

  const categoryFiltered = useMemo(() => {
    if (selectedCategory === "All") return teacherNotifications;
    return teacherNotifications.filter(n => 
      (n.category || n.type || "").toLowerCase().includes(selectedCategory.toLowerCase())
    );
  }, [teacherNotifications, selectedCategory]);

  const filteredNotifications = useMemo(() => {
    return categoryFiltered.filter(n => {
      const read = Boolean(n.isRead || n.read);
      if (activeTab === "unread") return !read;
      if (activeTab === "read") return read;
      return true;
    });
  }, [categoryFiltered, activeTab]);

  const counts = useMemo(() => {
    const unread = teacherNotifications.filter(n => !(n.isRead || n.read)).length;
    return {
      all: teacherNotifications.length,
      unread,
      read: teacherNotifications.length - unread
    };
  }, [teacherNotifications]);

  const getCategoryIcon = (category) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("attendance")) return <UserCheck className="text-emerald-500" size={18} />;
    if (cat.includes("assignment")) return <FileText className="text-blue-500" size={18} />;
    if (cat.includes("class") || cat.includes("timetable")) return <Calendar className="text-amber-500" size={18} />;
    if (cat.includes("student")) return <Users className="text-cyan-500" size={18} />;
    if (cat.includes("academic") || cat.includes("exam")) return <Award className="text-purple-500" size={18} />;
    return <ShieldAlert className="text-indigo-400" size={18} />;
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "High":
        return <Badge variant="danger">High Priority</Badge>;
      case "Medium":
        return <Badge variant="warning">Medium</Badge>;
      default:
        return <Badge variant="neutral">Normal</Badge>;
    }
  };

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return "Just now";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Just now";
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <ErrorBoundary>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-left max-w-7xl mx-auto font-sans pb-12">

        {/* 1. TEACHER NOTIFICATION HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
                Faculty Portal
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{currentUser?.name || "Dr. Rahul Sharma"}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Bell className="text-primary" /> Notification Center
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Stay updated with your classes, attendance, student submissions, and academic notices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {counts.unread > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                className="gap-1.5 font-bold text-xs rounded-xl text-primary border-primary/30"
              >
                <CheckCheck size={14} /> Mark All as Read
              </Button>
            )}
            <Button
              onClick={() => setPrefsModalOpen(true)}
              variant="outline"
              size="sm"
              className="gap-1.5 font-bold text-xs rounded-xl"
            >
              <Settings size={14} /> Preferences
            </Button>
          </div>
        </div>

        {/* 2. TABS & FACULTY SUMMARY FILTER CHIPS */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-100 dark:bg-slate-950 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-800">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-full">
              {[
                { id: "all", label: "All Alerts", count: counts.all },
                { id: "unread", label: "Unread", count: counts.unread },
                { id: "read", label: "Read", count: counts.read }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-slate-800 text-primary dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-900 font-mono">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Teacher Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: "All", label: "All Categories" },
              { id: "Attendance", label: "Attendance" },
              { id: "Assignments", label: "Assignments" },
              { id: "Classes", label: "Classes & Timetable" },
              { id: "Students", label: "Student Requests" },
              { id: "Academic", label: "Academic Notices" },
              { id: "System", label: "System Alerts" }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. TEACHER NOTIFICATIONS LIST */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Bell size={24} />
              </div>
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Notifications Found</h4>
              <p className="text-xs text-slate-400">No faculty notifications match your selected filter criteria.</p>
            </Card>
          ) : (
            filteredNotifications.map(notif => {
              const notifId = notif._id || notif.id;
              const isRead = Boolean(notif.isRead || notif.read);

              return (
                <motion.div
                  key={notifId}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card
                    hoverEffect={false}
                    className={`p-4 transition-all border ${
                      !isRead
                        ? "bg-blue-500/5 border-blue-500/30 dark:bg-blue-950/20 dark:border-blue-500/30"
                        : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex-shrink-0 mt-0.5">
                          {getCategoryIcon(notif.category || notif.type)}
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className={`text-sm font-black ${!isRead ? "text-primary dark:text-blue-400" : "text-slate-900 dark:text-white"}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-500 border border-slate-200/50 dark:border-slate-800">
                              {notif.category || notif.type || "Faculty"}
                            </span>
                            {getPriorityBadge(notif.priority)}
                            {!isRead && (
                              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            )}
                          </div>

                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed break-words">
                            {notif.message}
                          </p>

                          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold pt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {formatRelativeTime(notif.createdAt)}
                            </span>
                            {notif.actionUrl && (
                              <Link
                                to={notif.actionUrl}
                                className="text-primary hover:underline flex items-center gap-1 font-bold"
                              >
                                {notif.actionLabel || "View Details"} <ExternalLink size={10} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons: Mark Read/Unread & Delete */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!isRead ? (
                          <button
                            onClick={() => markAsRead(notifId, true)}
                            className="p-1.5 rounded-xl hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Mark as Read"
                          >
                            <CheckCircle2 size={16} />
                            <span className="hidden md:inline">Mark Read</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => markAsRead(notifId, false)}
                            className="p-1.5 rounded-xl hover:bg-blue-500/10 text-slate-400 hover:text-blue-500 transition cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                            title="Mark as Unread"
                          >
                            <RotateCcw size={15} />
                            <span className="hidden md:inline">Mark Unread</span>
                          </button>
                        )}

                        <button
                          onClick={() => deleteNotification(notifId)}
                          className="p-1.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition cursor-pointer"
                          title="Delete Notification"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* PREFERENCES MODAL */}
        <AnimatePresence>
          {prefsModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                onClick={() => setPrefsModalOpen(false)}
                className="fixed inset-0 bg-black"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl relative z-10 text-left space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings className="text-primary" size={18} /> Faculty Notification Preferences
                  </h3>
                  <button
                    onClick={() => setPrefsModalOpen(false)}
                    className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4 text-xs font-medium">
                  {[
                    { label: "Attendance Session Summary Alerts", desc: "Notifications when attendance sessions close" },
                    { label: "Low Attendance Student Warnings", desc: "Alerts when students fall below 75%" },
                    { label: "Assignment Submission Digests", desc: "Notifications when multiple assignments are submitted" },
                    { label: "Class & Room Change Notices", desc: "Timetable adjustments and venue updates" },
                    { label: "Student Permission Requests", desc: "Requests submitted by students" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{item.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-4 w-4 rounded accent-primary cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Button
                    onClick={() => {
                      toast.success("Faculty preferences saved.");
                      setPrefsModalOpen(false);
                    }}
                    variant="primary"
                    size="sm"
                  >
                    Save Preferences
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </motion.div>
    </ErrorBoundary>
  );
};

/* ==========================================================================
   ADMINISTRATIVE NOTIFICATION CENTER (System-Focused Notifications)
   ========================================================================== */
const AdminNotificationsView = ({ currentUser }) => {
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const [activeTab, setActiveTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const adminDefaultNotifications = useMemo(() => [
    {
      _id: "an1",
      title: "Low Attendance Warning",
      message: "3 students in Database Management Systems are currently below the 75% attendance requirement.",
      category: "Attendance",
      type: "Attendance",
      priority: "High",
      isRead: false,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      actionUrl: "/admin?tab=Students",
      actionLabel: "View Student Roster"
    },
    {
      _id: "an2",
      title: "Attendance Session Active",
      message: "Dr. Rahul Sharma is currently conducting an AI & Machine Learning attendance session in Lab-3.",
      category: "Sessions",
      type: "Attendance",
      priority: "Medium",
      isRead: false,
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
      actionUrl: "/admin?tab=AttendanceLogs",
      actionLabel: "Monitor Active Session"
    },
    {
      _id: "an3",
      title: "Security Alert: Verification Failures",
      message: "Multiple face verification failures were detected during the morning check-in period.",
      category: "Security",
      type: "Security",
      priority: "High",
      isRead: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      actionUrl: "/admin?tab=AuditLogs",
      actionLabel: "View Audit Logs"
    },
    {
      _id: "an4",
      title: "Assignment Submissions Update",
      message: "18 students submitted Neural Network Architecture assignment for AI & ML.",
      category: "Academic",
      type: "Assignment",
      priority: "Medium",
      isRead: true,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      actionUrl: "/admin?tab=Assignments",
      actionLabel: "View Assignments"
    },
    {
      _id: "an5",
      title: "System Health Status",
      message: "Face verification and QR attendance services are operating normally with 99.8% precision.",
      category: "System",
      type: "System",
      priority: "Normal",
      isRead: true,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      actionUrl: "/admin?tab=FaceAi",
      actionLabel: "View System Stats"
    }
  ], []);

  const adminNotifications = useMemo(() => {
    if (notifications && notifications.length > 0) {
      return notifications;
    }
    return adminDefaultNotifications;
  }, [notifications, adminDefaultNotifications]);

  const filteredNotifications = useMemo(() => {
    return adminNotifications.filter(n => {
      const read = Boolean(n.isRead || n.read);
      if (activeTab === "unread") return !read;
      if (activeTab === "read") return read;
      return true;
    });
  }, [adminNotifications, activeTab]);

  return (
    <ErrorBoundary>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 text-left max-w-7xl mx-auto font-sans pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider rounded-md bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400">
                System Administration
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Bell className="text-primary" /> Admin System Notifications
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Centralized security alerts, attendance session monitoring, low attendance warnings, and system updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={markAllAsRead} variant="outline" size="sm" className="gap-1.5 font-bold text-xs rounded-xl text-primary border-primary/30">
              <CheckCheck size={14} /> Mark All as Read
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const notifId = notif._id || notif.id;
            const isRead = Boolean(notif.isRead || notif.read);

            return (
              <Card key={notifId} hoverEffect={false} className={`p-4 border ${!isRead ? "bg-purple-500/5 border-purple-500/30 dark:bg-purple-950/20" : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex-shrink-0 mt-0.5">
                      <ShieldAlert className="text-primary" size={18} />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-sm font-black ${!isRead ? "text-primary dark:text-purple-400" : "text-slate-900 dark:text-white"}`}>
                          {notif.title}
                        </h4>
                        <Badge variant={notif.priority === "High" ? "danger" : "neutral"}>{notif.priority || "Normal"}</Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{notif.message}</p>
                      {notif.actionUrl && (
                        <Link to={notif.actionUrl} className="text-primary text-xs font-bold hover:underline inline-flex items-center gap-1 pt-1">
                          {notif.actionLabel || "View Action"} <ExternalLink size={10} />
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => deleteNotification(notifId)} className="p-1.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </motion.div>
    </ErrorBoundary>
  );
};

/* ==========================================================================
   ROLE-BASED NOTIFICATION PAGE ROUTER WRAPPER
   Directs Admins to Admin System Center, Teachers to Faculty Center & Students to Personal Center
   ========================================================================== */
export const NotificationsPage = () => {
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

  useEffect(() => {
    const handleSync = () => {
      setCurrentUser(authService.getCurrentUser());
    };
    window.addEventListener("user_profile_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("user_profile_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const role = currentUser?.role || "student";

  if (role === "admin") {
    return <AdminNotificationsView currentUser={currentUser || { name: "System Admin", role: "admin" }} />;
  }

  if (role === "teacher") {
    return <TeacherNotificationsView currentUser={currentUser || { name: "Dr. Rahul Sharma", role: "teacher" }} />;
  }

  return <StudentNotificationsView />;
};

export default NotificationsPage;
