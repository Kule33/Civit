import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import your page components
import TeacherDashboard from './routes/Teacher/Dashboard.jsx';
import PaperBuilder from './routes/Teacher/PaperBuilder.jsx';
import TeacherPayment from './routes/Teacher/TeacherPayment.jsx'; // Renamed to avoid clash if Admin also has Payment

import AdminQuestionUpload from './routes/Admin/QuestionUpload.jsx';
import AdminManageQuestions from './routes/Admin/ManageQuestions.jsx';
import AdminTypesetUpload from './routes/Admin/TypesetUpload.jsx';

function App() {
  return (
    <div className="min-h-screen bg-gray-100"> {/* Changed background for general app */}
      <nav className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-3xl font-bold">Paper Master</h1>
        {/* Basic navigation for now, will enhance later */}
        <ul className="flex space-x-4 mt-2">
          <li><a href="/teacher/dashboard" className="hover:underline">Teacher Dashboard</a></li>
          <li><a href="/teacher/paper-builder" className="hover:underline">Paper Builder</a></li>
          <li><a href="/admin/questions/upload" className="hover:underline">Admin Upload</a></li>
          {/* Add more links as needed */}
        </ul>
      </nav>

      <main className="p-4">
        <Routes>
          {/* Teacher Routes */}
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
          <Route path="/teacher/paper-builder" element={<PaperBuilder />} />
          <Route path="/teacher/teacher-payment" element={<TeacherPayment />} />

          {/* Admin Routes */}
          <Route path="/admin/questions/upload" element={<AdminQuestionUpload />} />
          <Route path="/admin/questions/manage" element={<AdminManageQuestions />} />
          <Route path="/admin/typeset/upload" element={<AdminTypesetUpload />} />

          {/* Optional: A default landing page or redirect */}
          <Route path="/" element={
            <div className="text-center mt-10">
              <h2 className="text-4xl font-semibold text-gray-800">Welcome to Paper Master!</h2>
              <p className="text-lg text-gray-600 mt-2">Please navigate using the links above.</p>
            </div>
          } />
          {/* Optional: 404 Not Found Page */}
          <Route path="*" element={
            <div className="text-center mt-10">
              <h2 className="text-4xl font-semibold text-red-600">404 - Page Not Found</h2>
              <p className="text-lg text-gray-600 mt-2">The page you are looking for does not exist.</p>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;