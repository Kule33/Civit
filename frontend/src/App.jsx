import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Import your Layout component
import MainLayout from './components/layouts/MainLayout.jsx';

// Import your page components
import TeacherDashboard from './routes/Teacher/Dashboard.jsx';
import PaperBuilder from './routes/Teacher/PaperBuilder.jsx';
import TeacherPayment from './routes/Teacher/TeacherPayment.jsx';

import AdminQuestionUpload from './routes/Admin/QuestionUpload.jsx';
import AdminManageQuestions from './routes/Admin/ManageQuestions.jsx';
import AdminTypesetUpload from './routes/Admin/TypesetUpload.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}> {/* Use MainLayout for all routes */}
        {/* Teacher Routes */}
        <Route path="teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="teacher/paper-builder" element={<PaperBuilder />} />
        <Route path="teacher/teacher-payment" element={<TeacherPayment />} />

        {/* Admin Routes */}
        <Route path="admin/questions/upload" element={<AdminQuestionUpload />} />
        <Route path="admin/questions/manage" element={<AdminManageQuestions />} />
        <Route path="admin/typeset/upload" element={<AdminTypesetUpload />} />

        {/* Default landing page */}
        <Route index element={ // 'index' makes this the default child route for '/'
          <div className="text-center mt-10">
            <h2 className="text-4xl font-semibold text-gray-800">Welcome to Paper Master!</h2>
            <p className="text-lg text-gray-600 mt-2">Please navigate using the links above.</p>
            <div className="mt-4">
              <img src="https://via.placeholder.com/600x300?text=Welcome+to+Paper+Master" alt="Welcome Image" className="mx-auto rounded-lg shadow-lg"/>
            </div>
          </div>
        } />
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
  );
}

export default App;