import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context providers
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";

// Protection layout wrapper
import ProtectedRoute from "./components/ProtectedRoute";

// Core UI Layout
import Layout from "./layouts/Layout";

// Safety boundaries
import ErrorBoundary from "./components/ErrorBoundary";

// Page Views
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import AttendancePage from "./pages/AttendancePage";
import SmartCurriculum from "./pages/SmartCurriculum";
import ProgressPage from "./pages/ProgressPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SettingsPage from "./pages/SettingsPage";

export const App = () => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ErrorBoundary>
          {/* Router configuration utilizing HashRouter for robust static compilation */}
          <HashRouter>
            <Routes>
              {/* 1. PUBLIC ROUTES */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* 2. PROTECTED STUDENT DASHBOARD ENVIRONMENT */}
              <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
                <Route path="/dashboard" element={<Layout><StudentDashboard /></Layout>} />
                <Route path="/attendance" element={<Layout><AttendancePage /></Layout>} />
                <Route path="/curriculum" element={<Layout><SmartCurriculum /></Layout>} />
                <Route path="/progress" element={<Layout><ProgressPage /></Layout>} />
                <Route path="/profile" element={<Layout><ProfilePage /></Layout>} />
              </Route>

              {/* 3. PROTECTED TEACHER CONSOLE */}
              <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
                <Route path="/teacher" element={<Layout><TeacherDashboard /></Layout>} />
              </Route>

              {/* 4. PROTECTED ADMIN CONSOLE */}
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
              </Route>

              {/* 5. SHARED PROTECTED ROUTES */}
              <Route element={<ProtectedRoute allowedRoles={["student", "teacher", "admin"]} />}>
                <Route path="/analytics" element={<Layout><AnalyticsPage /></Layout>} />
                <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
              </Route>

              {/* FALLBACK REDIRECT */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>

          {/* Global styling toast notification hub */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#0f172a",
                color: "#f8fafc",
                border: "1px border rgba(30, 41, 59, 0.5)",
                fontSize: "12px",
                borderRadius: "12px"
              }
            }}
          />
        </ErrorBoundary>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;
