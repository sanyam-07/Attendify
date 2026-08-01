import React, { createContext, useContext, useState, useEffect } from "react";
import { mockNotifications } from "../data/dummyData";
import toast from "react-hot-toast";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("attendify_notifications");
    return saved ? JSON.parse(saved) : mockNotifications;
  });

  useEffect(() => {
    localStorage.setItem("attendify_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Simulate real-time session updates
  useEffect(() => {
    // Set a timer to trigger an "Attendance Session Started" notification after 15 seconds
    const timer = setTimeout(() => {
      const alreadyAlerted = sessionStorage.getItem("attendify_alerted_session");
      if (!alreadyAlerted) {
        // Add new notification to active student user
        const newNotification = {
          id: `notif-${Date.now()}`,
          type: "session_start",
          title: "Attendance Session Started",
          message: "Dr. Jenkins started AI & Machine Learning check-in. Open attendance to scan face.",
          time: "Just now",
          read: false,
          link: "/attendance"
        };

        setNotifications((prev) => [newNotification, ...prev]);
        sessionStorage.setItem("attendify_alerted_session", "true");

        // Custom premium toast notification
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white dark:bg-slate-900 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-slate-200 dark:border-slate-800`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-500">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    Attendance Session Started
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    AI & Machine Learning check-in is now active. Verify your attendance.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  // Redirect could be handled via event
                  window.location.hash = "#/attendance";
                }}
                className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus:outline-none"
              >
                Scan Now
              </button>
            </div>
          </div>
        ), { duration: 8000 });
      }
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addNotification = (notif) => {
    setNotifications((prev) => [
      { id: `n-${Date.now()}`, read: false, time: "Just now", ...notif },
      ...prev
    ]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, markAllAsRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
export default NotificationContext;
