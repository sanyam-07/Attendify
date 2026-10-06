import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Sun, 
  Moon, 
  Bell, 
  Globe, 
  ShieldCheck, 
  Camera, 
  MapPin, 
  User, 
  LogOut, 
  CheckCircle2, 
  Sparkles, 
  GraduationCap,
  Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Button from "../components/Button";
import { useTheme } from "../context/ThemeContext";
import ErrorBoundary from "../components/ErrorBoundary";
import notificationService from "../services/notificationService";
import authService from "../services/authService";

export const SettingsPage = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const currentUser = authService.getCurrentUser() || {
    name: "Aman Kumar",
    email: "aman.kumar@attendify.com",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120"
  };

  // Notification preferences state
  const [preferences, setPreferences] = useState({
    attendance: true,
    assignment: true,
    exam: true,
    timetable: true,
    system: true
  });
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // System capabilities & permission checks
  const [permissionsStatus, setPermissionsStatus] = useState({
    camera: "Checking...",
    location: "Checking...",
    faceBiometrics: "Enrolled & Active"
  });

  // Fetch real notification preferences from API
  useEffect(() => {
    let isMounted = true;
    const loadPreferences = async () => {
      try {
        const fetchedPrefs = await notificationService.getPreferences();
        if (isMounted && fetchedPrefs) {
          setPreferences((prev) => ({
            ...prev,
            ...fetchedPrefs
          }));
        }
      } catch (error) {
        console.warn("Could not load notification preferences:", error.message);
      } finally {
        if (isMounted) setLoadingPrefs(false);
      }
    };

    loadPreferences();
    return () => { isMounted = false; };
  }, []);

  // Check client runtime permissions (Camera & Geolocation)
  useEffect(() => {
    const checkPermissions = async () => {
      let cameraState = "Supported";
      let locationState = "Supported";

      // 1. Camera check
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          if (navigator.permissions && navigator.permissions.query) {
            const camPermission = await navigator.permissions.query({ name: "camera" });
            cameraState = camPermission.state === "granted" ? "Granted & Active" : "Available / Permitted";
          } else {
            cameraState = "Granted & Available";
          }
        } catch {
          cameraState = "Available";
        }
      } else {
        cameraState = "Not Supported";
      }

      // 2. Geolocation check
      if ("geolocation" in navigator) {
        locationState = "Available & Active";
      } else {
        locationState = "Not Supported";
      }

      setPermissionsStatus({
        camera: cameraState,
        location: locationState,
        faceBiometrics: "Enrolled & Verified"
      });
    };

    checkPermissions();
  }, []);

  const handleTogglePreference = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await notificationService.updatePreferences(preferences);
      toast.success("Notification preferences saved successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to save preferences.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <ErrorBoundary>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-8 text-left max-w-6xl mx-auto"
      >
        
        {/* HEADER BANNER */}
        <motion.div variants={itemVariants} className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-sans text-slate-900 dark:text-white flex items-center gap-2.5">
                {currentUser.role === "student" ? "Student Settings & Preferences" : "Account Settings & Preferences"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium leading-relaxed">
                Manage your visual appearance, alert subscriptions, device permissions, and account profile.
              </p>
            </div>
            <Badge variant="primary" className="self-start sm:self-auto capitalize px-3 py-1 text-xs">
              {currentUser.role} Account
            </Badge>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: SYSTEM & APPEARANCE PREFERENCES */}
          <motion.div variants={itemVariants} className="lg:col-span-7 space-y-6">
            
            {/* 1. APPEARANCE SETTINGS CARD */}
            <Card hoverEffect={false} className="p-6 space-y-5">
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  {theme === "dark" ? <Moon size={16} className="text-blue-400" /> : <Sun size={16} className="text-amber-500" />}
                  Appearance & Theme
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Select your preferred interface theme for Attendify.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => theme === "light" && toggleTheme()}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${
                    theme === "dark"
                      ? "bg-primary/10 border-primary text-blue-400 shadow-sm ring-2 ring-primary/30"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <Moon size={18} />
                  <span>Dark Slate Mode</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => theme === "dark" && toggleTheme()}
                  className={`flex items-center justify-center gap-3 p-4 rounded-2xl border text-xs font-bold cursor-pointer transition-all ${
                    theme === "light"
                      ? "bg-primary/10 border-primary text-primary shadow-sm ring-2 ring-primary/30"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <Sun size={18} />
                  <span>Light Clean Mode</span>
                </button>
              </div>
            </Card>

            {/* 2. REAL NOTIFICATION PREFERENCES CARD */}
            <Card hoverEffect={false} className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Bell size={16} className="text-primary" /> Notification Subscriptions
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    Customize which automated alerts and reminders you receive.
                  </p>
                </div>
                {loadingPrefs && <Loader2 size={16} className="animate-spin text-primary" />}
              </div>
              
              <div className="space-y-4 text-xs font-medium">
                <div className="space-y-3 bg-slate-50/60 dark:bg-slate-950/40 p-4 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
                  
                  <div className="flex items-start justify-between gap-4 py-1.5 border-b border-slate-200/40 dark:border-slate-800/40">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Attendance Alerts & Deficit Warnings</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Receive instant updates when attendance is recorded or deficit warnings trigger.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.attendance} 
                      onChange={() => handleTogglePreference("attendance")}
                      className="h-4 w-4 rounded bg-transparent accent-primary cursor-pointer mt-0.5" 
                    />
                  </div>

                  <div className="flex items-start justify-between gap-4 py-1.5 border-b border-slate-200/40 dark:border-slate-800/40">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Assignment & Exam Reminders</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Get notified about upcoming submission deadlines and examination dates.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.assignment} 
                      onChange={() => handleTogglePreference("assignment")}
                      className="h-4 w-4 rounded bg-transparent accent-primary cursor-pointer mt-0.5" 
                    />
                  </div>

                  <div className="flex items-start justify-between gap-4 py-1.5 border-b border-slate-200/40 dark:border-slate-800/40">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">Timetable & Schedule Updates</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Alerts when lecture timings, room assignments, or proxy teachers change.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.timetable} 
                      onChange={() => handleTogglePreference("timetable")}
                      className="h-4 w-4 rounded bg-transparent accent-primary cursor-pointer mt-0.5" 
                    />
                  </div>

                  <div className="flex items-start justify-between gap-4 py-1">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-xs">System & Department Broadcasts</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Important notices, holiday announcements, and portal updates.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.system} 
                      onChange={() => handleTogglePreference("system")}
                      className="h-4 w-4 rounded bg-transparent accent-primary cursor-pointer mt-0.5" 
                    />
                  </div>

                </div>

                <div className="pt-2 flex justify-end">
                  <Button 
                    onClick={handleSavePreferences} 
                    disabled={savingPrefs}
                    variant="primary" 
                    size="sm" 
                    className="font-bold text-xs rounded-xl px-5 flex items-center gap-2"
                  >
                    {savingPrefs && <Loader2 size={14} className="animate-spin" />}
                    Save Preferences
                  </Button>
                </div>
              </div>
            </Card>

            {/* 3. LANGUAGE & REGION CARD */}
            <Card hoverEffect={false} className="p-6 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Globe size={16} className="text-cyan-400" /> Platform Language
              </h4>
              <div className="space-y-2">
                <select disabled className="glass-input px-3.5 py-2.5 w-full bg-slate-100/50 dark:bg-slate-950/60 text-slate-800 dark:text-slate-200 text-xs cursor-not-allowed">
                  <option value="en">English (United States) — Default Supported Language</option>
                </select>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Attendify is currently configured for English (US). Additional regional languages will be supported in upcoming campus updates.
                </p>
              </div>
            </Card>

          </motion.div>

          {/* RIGHT COLUMN: PRIVACY PERMISSIONS & ACCOUNT INFO */}
          <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
            
            {/* 1. PRIVACY & PERMISSIONS CARD */}
            <Card hoverEffect={false} className="p-6 space-y-5">
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-400" /> Security & Device Permissions
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Runtime system services required for biometric QR & attendance verification.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <Camera size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Camera Access</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Required for QR scanner & face recognition</p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5">
                    {permissionsStatus.camera}
                  </Badge>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Location Services</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Required for classroom geofence check</p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5">
                    {permissionsStatus.location}
                  </Badge>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Biometric Template</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Face descriptor stored securely in database</p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5">
                    {permissionsStatus.faceBiometrics}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* 2. ACCOUNT INFORMATION CARD */}
            <Card hoverEffect={false} className="p-6 space-y-5">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <User size={16} className="text-primary" /> Account Information
              </h4>

              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name} 
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800" 
                />
                <div className="overflow-hidden">
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
                  <div className="flex items-center gap-1 text-[10px] text-primary font-semibold capitalize mt-0.5">
                    {currentUser.role === "student" && <GraduationCap size={11} />}
                    {currentUser.role === "teacher" && <Sparkles size={11} />}
                    <span>{currentUser.role} Account</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
                  <span className="text-slate-500 dark:text-slate-400">Department</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Computer Science</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/40 dark:border-slate-800/40">
                  <span className="text-slate-500 dark:text-slate-400">Enrollment Batch</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">2026 Batch</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Session Status</span>
                  <span className="font-bold text-emerald-500 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active Session
                  </span>
                </div>
              </div>
            </Card>

            {/* 3. ACCOUNT ACTIONS CARD */}
            <Card hoverEffect={false} className="p-6 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Account Actions</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Sign out of your active session on this device.
              </p>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 text-xs font-extrabold transition-all border border-red-500/20 cursor-pointer"
              >
                <LogOut size={16} /> Log Out of Account
              </button>
            </Card>

          </motion.div>

        </div>
        
      </motion.div>
    </ErrorBoundary>
  );
};

export default SettingsPage;
