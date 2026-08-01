import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import authService from "../services/authService";

/**
 * Route protection wrapper.
 * Checks for localStorage token/user and redirects unauthorized access to login.
 * Useful for future MERN JWT integration.
 * 
 * @param {object} props
 * @param {string[]} props.allowedRoles Array of roles authorized to view this path
 */
export const ProtectedRoute = ({ allowedRoles = [] }) => {
  const isAuth = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();

  // If not logged in, redirect to login page
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check if user's role is in the list
  if (allowedRoles.length > 0 && currentUser && !allowedRoles.includes(currentUser.role)) {
    // If unauthorized, redirect to standard dashboard corresponding to their role
    if (currentUser.role === "student") {
      return <Navigate to="/dashboard" replace />;
    } else if (currentUser.role === "teacher") {
      return <Navigate to="/teacher" replace />;
    } else if (currentUser.role === "admin") {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/" replace />;
  }

  // Authorized: render nested child routes
  return <Outlet />;
};

export default ProtectedRoute;
