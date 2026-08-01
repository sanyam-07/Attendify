import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  UserCheck, 
  BookOpen, 
  TrendingUp, 
  BarChart3, 
  User, 
  Settings, 
  LogOut, 
  Sun, 
  Moon, 
  Bell, 
  Menu, 
  X, 
  Search,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useNotifications } from "../context/NotificationContext";
import authService from "../services/authService";

export const Layout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { notifications, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifTrayOpen, setNotifTrayOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const currentUser = authService.getCurrentUser() || {
    name: "Alex Rivera",
    email: "alex.rivera@university.edu",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=120"
  };

  const handleLogout = () => {
    authService.logout();
    navigate("/login");
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNavItems = () => {
    if (currentUser.role === "teacher") {
      return [
        { path: "/teacher", label: "Dashboard", icon: LayoutDashboard },
        { path: "/analytics", label: "Class Analytics", icon: BarChart3 },
        { path: "/settings", label: "Settings", icon: Settings }
      ];
    } else if (currentUser.role === "admin") {
      return [
        { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { path: "/settings", label: "Settings", icon: Settings }
      ];
    } else {
      return [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/attendance", label: "Attendance Scanner", icon: UserCheck, highlight: true },
        { path: "/curriculum", label: "Smart Curriculum", icon: BookOpen },
        { path: "/progress", label: "Progress Compliance", icon: TrendingUp },
        { path: "/analytics", label: "Analytics Reports", icon: BarChart3 },
        { path: "/profile", label: "Profile Settings", icon: User },
        { path: "/settings", label: "System Preferences", icon: Settings }
      ];
    }
  };

  const navItems = getNavItems();

  const sidebarVariants = {
    open: { width: 270, transition: { duration: 0.25, ease: "easeOut" } },
    closed: { width: 88, transition: { duration: 0.25, ease: "easeOut" } }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#03060d] text-slate-800 dark:text-slate-100 flex transition-colors duration-300 font-sans">
      
      {/* 1. SIDEBAR (DESKTOP) */}
      <motion.aside
        animate={sidebarOpen ? "open" : "closed"}
        variants={sidebarVariants}
        className="hidden md:flex flex-col border-r border-slate-200/50 dark:border-slate-900/60 bg-white/80 dark:bg-[#060a12]/80 backdrop-blur-xl fixed top-0 bottom-0 left-0 z-20"
      >
        {/* Brand Logo Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200/40 dark:border-slate-900/45">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold shadow-md glow-primary">
              ⚡
            </div>
            {sidebarOpen && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-extrabold text-base bg-gradient-to-r from-slate-900 via-slate-850 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent"
              >
                Attendify
              </motion.span>
            )}
          </Link>
          
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900/70 transition"
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}>
                <motion.div
                  whileHover={{ x: sidebarOpen ? 4 : 0 }}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-bold transition-all group ${
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/10 glow-primary"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
                  } ${item.highlight && !isActive ? "border border-primary/20 bg-primary/5 dark:bg-primary/10 text-primary dark:text-blue-400" : ""}`}
                >
                  <Icon size={18} className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-205"} />
                  {sidebarOpen && <span>{item.label}</span>}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User Card footer */}
        <div className="p-4 border-t border-slate-200/40 dark:border-slate-900/45 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-10 w-10 rounded-2xl border border-slate-200 dark:border-slate-850 object-cover flex-shrink-0"
              />
              {sidebarOpen && (
                <div className="text-left overflow-hidden">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 capitalize flex items-center gap-1 truncate font-semibold">
                    {currentUser.role === "student" && <GraduationCap size={10} />}
                    {currentUser.role === "teacher" && <Sparkles size={10} />}
                    {currentUser.role === "admin" && <ShieldCheck size={10} />}
                    {currentUser.role}
                  </p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button
                onClick={handleLogout}
                className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-450 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* 2. MAIN WORKSPACE */}
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-200"
        style={{ paddingLeft: sidebarOpen ? "270px" : "88px" }}
      >
        
        {/* HEADER NAVBAR */}
        <header className="h-20 border-b border-slate-200/40 dark:border-slate-900/60 bg-white/40 dark:bg-[#03060d]/40 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900/50 text-slate-500"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-900 rounded-xl px-3.5 py-2.5 gap-2 text-slate-400 w-72 max-w-full">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search classes, schedules..."
                className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-250 placeholder-slate-450 w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition shadow-sm"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Notification alert bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifTrayOpen(!notifTrayOpen);
                  setProfileDropdownOpen(false);
                }}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition shadow-sm"
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifTrayOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotifTrayOpen(false)} />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#0c121f] border border-slate-200/80 dark:border-slate-850 shadow-2xl p-4.5 z-40"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-xs">Inbox Alerts</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => {
                              markAllAsRead();
                              setNotifTrayOpen(false);
                            }}
                            className="text-[10px] font-bold text-primary hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-6">No notifications</p>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              onClick={() => {
                                setNotifTrayOpen(false);
                                if (notif.link) navigate(notif.link);
                              }}
                              className={`p-3 rounded-xl border transition cursor-pointer text-left ${
                                notif.read
                                  ? "border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-900/30"
                                  : "border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10 dark:border-blue-500/15 dark:bg-blue-500/10"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <p className={`text-xs font-bold ${notif.read ? "text-slate-800 dark:text-slate-200" : "text-blue-500"}`}>
                                  {notif.title}
                                </p>
                                <span className="text-[9px] text-slate-400 flex-shrink-0 font-medium">{notif.time}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                {notif.message}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Avatar */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotifTrayOpen(false);
                }}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 object-cover cursor-pointer hover:opacity-90 transition"
                />
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-56 rounded-2xl bg-white dark:bg-[#0c121f] border border-slate-200/80 dark:border-slate-850 shadow-2xl p-2 z-40 text-left"
                    >
                      <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate mt-0.5">
                          {currentUser.email}
                        </p>
                      </div>
                      <Link to="/profile" onClick={() => setProfileDropdownOpen(false)}>
                        <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900/40 rounded-xl transition cursor-pointer">
                          <User size={14} /> My Profile
                        </button>
                      </Link>
                      <Link to="/settings" onClick={() => setProfileDropdownOpen(false)}>
                        <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900/40 rounded-xl transition cursor-pointer">
                          <Settings size={14} /> Account Settings
                        </button>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition mt-1 cursor-pointer"
                      >
                        <LogOut size={14} /> Log Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            
          </div>
        </header>

        {/* MAIN PANEL CONTENT */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
        
        <footer className="py-6 text-center border-t border-slate-200/40 dark:border-slate-900/45 text-xs text-slate-400 font-medium">
          <p>© 2026 Attendify Inc. Premium SaaS Presentation Prototype.</p>
        </footer>

      </div>

      {/* 3. DRAWER (MOBILE VIEW ONLY) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-30 md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed top-0 bottom-0 left-0 w-72 bg-white dark:bg-[#060a12] border-r border-slate-200/60 dark:border-slate-900/60 z-40 p-6 flex flex-col md:hidden text-left"
            >
              <div className="flex items-center justify-between mb-8">
                <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileMenuOpen(false)}>
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold shadow-md">
                    ⚡
                  </div>
                  <span className="font-extrabold text-base text-slate-900 dark:text-white">Attendify</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
                      <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-primary text-white shadow-md"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/40"
                      } ${item.highlight && !isActive ? "border border-primary/20 bg-primary/5 dark:bg-primary/10 text-primary dark:text-blue-400" : ""}`}>
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/40 flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-800 object-cover"
                />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 capitalize font-bold">{currentUser.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Layout;
