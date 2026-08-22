import React, { lazy, Suspense } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context providers
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationProvider } from "./context/NotificationContext";

// Protection layout wrapper
import ProtectedRoute from "./components/ProtectedRoute";

// Core UI Layout
import Layout from "./layouts/Layout";

// Safety boundaries & Skeleton
import ErrorBoundary from "./components/ErrorBoundary";
import Skeleton from "./components/Skeleton";

// Dynamic Code-split Page Views for optimal bundle size
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const SmartCurriculum = lazy(() => import("./pages/SmartCurriculum"));
const ProgressPage = lazy(() => import("./pages/ProgressPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));

const PageLoader = () => (
  <div className="p-8 max-w-4xl mx-auto space-y-6 text-left">
    <Skeleton variant="title" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Skeleton variant="card" count={3} />
    </div>
  </div>
);

export const App = () => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ErrorBoundary>
          {/* Router configuration utilizing HashRouter for robust static compilation */}
          <HashRouter>
            <Suspense fallback={<PageLoader />}>
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
                  <Route path="/notifications" element={<Layout><NotificationsPage /></Layout>} />
                  <Route path="/analytics" element={<Layout><AnalyticsPage /></Layout>} />
                  <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
                </Route>

                {/* FALLBACK REDIRECT */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
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
