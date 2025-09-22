// frontend/src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider'; // Import useAuth hook

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, isAdmin, isTeacher, loading } = useAuth();

  if (loading) {
    // Optionally render a loading spinner or placeholder while auth state is being determined
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
    // If no user, redirect to a login page (we'll create this next)
    return <Navigate to="/login" replace />;
  }

  // Check roles
  const hasRequiredRole = allowedRoles.some(role =>
    (role === 'admin' && isAdmin) || (role === 'teacher' && isTeacher)
  );

  if (user && hasRequiredRole) {
    return <Outlet />; // Render child routes if authorized
  } else {
    // If user is logged in but not authorized, redirect to home or an unauthorized page
    return <Navigate to="/" replace />; // Or a specific /unauthorized page
  }
};

export default ProtectedRoute;