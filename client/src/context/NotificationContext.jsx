import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import notificationService from "../services/notificationService";
import authService from "../services/authService";
import toast from "react-hot-toast";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    const user = authService.getCurrentUser();
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [list, count] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount()
      ]);

      setNotifications(list || []);
      setUnreadCount(typeof count === "number" ? count : 0);
    } catch (err) {
      console.warn("Failed to fetch notifications from backend:", err);
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    // 30-second polling for real-time unread updates from MongoDB
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id, targetState = true) => {
    try {
      await notificationService.markAsRead(id, targetState);
      setNotifications(prev =>
        prev.map(n => ((n._id === id || n.id === id) ? { ...n, isRead: targetState, read: targetState } : n))
      );
      const updatedCount = await notificationService.getUnreadCount();
      setUnreadCount(updatedCount);
      toast.success(targetState ? "Notification marked as read" : "Notification marked as unread");
    } catch (err) {
      console.error("Failed to mark notification state:", err);
      const msg = err?.response?.data?.message || err.message || "Failed to update notification state";
      toast.error(msg);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, read: true })));
      setUnreadCount(0);
      toast.success("All notifications marked as read!");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      const msg = err?.response?.data?.message || err.message || "Failed to mark all notifications as read";
      toast.error(msg);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id && n.id !== id));
      const updatedCount = await notificationService.getUnreadCount();
      setUnreadCount(updatedCount);
      toast.success("Notification deleted.");
    } catch (err) {
      console.error("Failed to delete notification:", err);
      const msg = err?.response?.data?.message || err.message || "Failed to delete notification";
      toast.error(msg);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
      }}
    >
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
