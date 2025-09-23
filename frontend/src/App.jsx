// src/App.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SubmissionProvider } from './context/SubmissionProvider';
import { useAuth } from './context/AuthProvider'; // Import useAuth to access loading state

// Import your Layout component
import MainLayout from './components/layouts/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx'; // Import ProtectedRoute

// Import your page components
import Home from './routes/Home.jsx';
import TeacherDashboard from './routes/Teacher/Dashboard.jsx';
import PaperBuilder from './routes/Teacher/PaperBuilder.jsx';
import TeacherPayment from './routes/Teacher/TeacherPayment.jsx';

import AdminQuestionUpload from './routes/Admin/QuestionUpload.jsx';
import AdminManageQuestions from './routes/Admin/ManageQuestions.jsx';
import AdminTypesetUpload from './routes/Admin/TypesetUpload.jsx';

// NEW: Import a Login and/or Signup component (we'll create these soon)
import LoginPage from './routes/Auth/LoginPage.jsx'; // Assuming you'll put auth pages here

function App() {
  const { loading: authLoading } = useAuth(); // Get auth loading state

  // If AuthProvider is still loading, show a global loading indicator
  if (authLoading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Paper Master</h1>
                <p className="text-gray-600">Initializing application...</p>
            </div>
            </div>
        </div>
    );
  }

  return (
    <SubmissionProvider>
      <Routes>
        {/* Public routes that everyone can access */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<LoginPage />} /> {/* NEW: Login Page */}
          {/* Add a signup page here too if you're implementing it immediately */}

          {/* Teacher Routes - Protected */}
          <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
            <Route path="teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="teacher/paper-builder" element={<PaperBuilder />} />
            <Route path="teacher/payment" element={<TeacherPayment />} />
          </Route>

          {/* Admin Routes - Protected */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="admin/questions/upload" element={<AdminQuestionUpload />} />
            <Route path="admin/questions/manage" element={<AdminManageQuestions />} />
            <Route path="admin/typeset/upload" element={<AdminTypesetUpload />} />
          </Route>

          {/* 404 Not Found Page */}
          <Route path="*" element={
            <div className="text-center mt-10">
              <h2 className="text-4xl font-semibold text-red-600">404 - Page Not Found</h2>
              <p className="text-lg text-gray-600 mt-2">The page you are looking for does not exist.</p>
              <div className="mt-4">
                <img src="https://via.placeholder.com/400x200?text=404+Error" alt="404 Error Image" className="mx-auto rounded-lg shadow-lg"/>
              </div>
            </div>
          } />
        </Route>
      </Routes>
    </SubmissionProvider>
  );
}

export default App;