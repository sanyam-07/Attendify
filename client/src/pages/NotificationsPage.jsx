import React, { useState, useEffect } from "react";
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
  Sparkles,
  ExternalLink,
  Clock,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Skeleton from "../components/Skeleton";
import EmptyState from "../components/EmptyState";
import ErrorBoundary from "../components/ErrorBoundary";
import { useNotifications } from "../context/NotificationContext";
import notificationService from "../services/notificationService";

export const NotificationsPage = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
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
    } catch (err) {
      console.error("Failed to save preferences:", err);
      toast.error("Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
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

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === "unread" && n.isRead) return false;
    if (activeTab === "read" && !n.isRead) return false;
    if (selectedType !== "All" && n.type !== selectedType) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-6 text-left">
        <Skeleton variant="title" />
        <Skeleton variant="card" count={4} />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 text-left"
      >
        
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-850 pb-5">
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

        {/* CONTROLS BAR: TABS & CATEGORY SELECTOR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-100/70 dark:bg-slate-950/60 p-2 rounded-2xl border border-slate-200/50 dark:border-slate-850">
          
          {/* Read / Unread Tabs */}
          <div className="flex items-center gap-1">
            {[
              { id: "all", label: "All Alerts", count: notifications.length },
              { id: "unread", label: "Unread", count: unreadCount },
              { id: "read", label: "Read", count: notifications.length - unreadCount }
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

          {/* Category Dropdown */}
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

        {/* NOTIFICATIONS LIST */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <EmptyState
                icon={Bell}
                title="No Notifications Found"
                description="You are all caught up! No notifications match your selected filter criteria."
              />
            </Card>
          ) : (
            filteredNotifications.map((notif) => (
              <motion.div
                key={notif._id || notif.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card
                  hoverEffect={false}
                  className={`p-4 transition-all border ${
                    !notif.isRead
                      ? "bg-blue-500/5 border-blue-500/20 dark:bg-blue-500/10 dark:border-blue-500/30"
                      : "bg-white dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-850"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800 flex-shrink-0 mt-0.5">
                        {getTypeIcon(notif.type)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-sm font-black ${!notif.isRead ? "text-primary dark:text-blue-400" : "text-slate-900 dark:text-white"}`}>
                            {notif.title}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-950 text-slate-500 border border-slate-200/50 dark:border-slate-800">
                            {notif.type || "System"}
                          </span>
                          {getPriorityBadge(notif.priority)}
                          {!notif.isRead && (
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                          )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold pt-1">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {notif.createdAt ? new Date(notif.createdAt).toLocaleString() : "Just now"}
                          </span>
                          {notif.actionUrl && (
                            <a
                              href={notif.actionUrl}
                              className="text-primary hover:underline flex items-center gap-1 font-bold"
                            >
                              View Action <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notif.isRead && (
                        <button
                          onClick={() => markAsRead(notif._id || notif.id)}
                          className="p-1.5 rounded-xl hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                          title="Mark as Read"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif._id || notif.id)}
                        className="p-1.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition cursor-pointer"
                        title="Delete Notification"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
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
                    <Settings className="text-primary" size={18} /> Notification Preferences
                  </h3>
                  <button
                    onClick={() => setPrefsModalOpen(false)}
                    className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
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
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences[item.key] ?? true}
                        onChange={(e) => setPreferences({ ...preferences, [item.key]: e.target.checked })}
                        className="h-4 w-4 rounded accent-primary cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                  <Button
                    onClick={() => setPrefsModalOpen(false)}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSavePreferences}
                    variant="primary"
                    size="sm"
                    loading={savingPrefs}
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

export default NotificationsPage;
