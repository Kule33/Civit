// src/App.jsx
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SubmissionProvider } from './context/SubmissionProvider';
import { useAuth } from './context/AuthProvider'; // Import useAuth to access loading state

// Import your Layout component
import MainLayout from './components/layouts/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx'; // Import ProtectedRoute

// ⚡ OPTIMIZATION: Eager load only essential components
import Home from './routes/Home.jsx';
import LoginPage from './routes/Auth/LoginPage.jsx';
import ResetPasswordPage from './routes/Auth/ResetPasswordPage.jsx';
import CompleteProfile from './routes/CompleteProfile.jsx';
import UserProfile from './routes/UserProfile.jsx';

// ⚡ OPTIMIZATION: Lazy load heavy components (code splitting)
const TeacherDashboard = lazy(() => import('./routes/Teacher/Dashboard.jsx'));
const PaperBuilder = lazy(() => import('./routes/Teacher/PaperBuilder.jsx'));
const TeacherPayment = lazy(() => import('./routes/Teacher/TeacherPayment.jsx'));

const AdminQuestionUpload = lazy(() => import('./routes/Admin/QuestionUpload.jsx'));
const AdminManageQuestions = lazy(() => import('./routes/Admin/ManageQuestions.jsx'));
const AdminTypesetUpload = lazy(() => import('./routes/Admin/TypesetUpload.jsx'));
const Users = lazy(() => import('./routes/Admin/Users.jsx'));

// ⚡ Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto animate-pulse">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div>
        <p className="text-gray-600 font-medium">Loading page...</p>
      </div>
    </div>
  </div>
);

function App() {
  const { loading: authLoading, user } = useAuth(); // Get auth loading state

  console.log('App.jsx rendering, authLoading:', authLoading, 'user:', user?.email || 'No user');

  // If AuthProvider is still loading, show a global loading indicator
  if (authLoading) {
    console.log('App showing loading screen because authLoading is true');
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

  console.log('App.jsx rendering routes now');

  return (
    <SubmissionProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Reset Password - Standalone page without navigation (no MainLayout) */}
          <Route path="reset-password" element={<ResetPasswordPage />} />
          
          {/* Public routes that everyone can access */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<LoginPage />} />
            
            {/* Complete Profile - Requires authentication but not role-protected */}
            <Route path="complete-profile" element={<CompleteProfile />} />
            
            {/* User Profile - Requires authentication but not role-protected */}
            <Route path="profile" element={<UserProfile />} />

            {/* Teacher Routes - Protected + Lazy Loaded */}
            <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
              <Route path="teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="teacher/paper-builder" element={<PaperBuilder />} />
              <Route path="teacher/payment" element={<TeacherPayment />} />
            </Route>

            {/* Admin Routes - Protected + Lazy Loaded */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="admin/questions/upload" element={<AdminQuestionUpload />} />
              <Route path="admin/questions/manage" element={<AdminManageQuestions />} />
              <Route path="admin/typeset/upload" element={<AdminTypesetUpload />} />
              <Route path="admin/users" element={<Users />} />
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
      </Suspense>
    </SubmissionProvider>
  );
}

export default App;