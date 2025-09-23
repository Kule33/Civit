// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAdmin, isTeacher, loading } = useAuth();

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Paper Master</h1>
                <p className="text-gray-600">Loading authentication...</p>
            </div>
            </div>
        </div>
    );
  }

  if (!user) {
    // If not authenticated, redirect to login page
    return <Navigate to="/login" replace />;
  }

  // Check roles
  const hasRequiredRole = allowedRoles.some(role =>
    (role === 'admin' && isAdmin) || (role === 'teacher' && isTeacher)
  );

  if (hasRequiredRole) {
    return <Outlet />; // Render child routes if authorized
  } else {
    // If user is logged in but not authorized, redirect to a specific unauthorized page
    return <Navigate to="/unauthorized" replace />; // <-- CHANGED THIS LINE
  }
};

export default ProtectedRoute;