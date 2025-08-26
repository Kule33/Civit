import React from 'react';
import { Routes, Route, Link } from 'react-router-dom'; // Import Link here!

// Import your page components
import TeacherDashboard from './routes/Teacher/Dashboard.jsx';
import PaperBuilder from './routes/Teacher/PaperBuilder.jsx';
import TeacherPayment from './routes/Teacher/TeacherPayment.jsx';

import AdminQuestionUpload from './routes/Admin/QuestionUpload.jsx';
import AdminManageQuestions from './routes/Admin/ManageQuestions.jsx';
import AdminTypesetUpload from './routes/Admin/TypesetUpload.jsx';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-3xl font-bold">
          <Link to="/" className="hover:underline">Paper Master</Link> {/* Changed to Link */}
        </h1>
        <ul className="flex space-x-4 mt-2">
          <li><Link to="/teacher/dashboard" className="hover:underline">Teacher Dashboard</Link></li> {/* Changed to Link */}
          <li><Link to="/teacher/paper-builder" className="hover:underline">Paper Builder</Link></li> {/* Changed to Link */}
          <li><Link to="/teacher/teacher-payment" className="hover:underline">Teacher Payment</Link></li> {/* Added Link for Teacher Payment */}
          <li><Link to="/admin/questions/upload" className="hover:underline">Admin Upload Questions</Link></li> {/* Changed to Link */}
          <li><Link to="/admin/questions/manage" className="hover:underline">Admin Manage Questions</Link></li> {/* Added Link for Admin Manage */}
          <li><Link to="/admin/typeset/upload" className="hover:underline">Admin Typeset Upload</Link></li> {/* Added Link for Admin Typeset Upload */}
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
              {/* Optional image to illustrate the landing page */}
              <div className="mt-4">
                <img src="https://via.placeholder.com/600x300?text=Welcome+to+Paper+Master" alt="Welcome Image" className="mx-auto rounded-lg shadow-lg"/>
              </div>
            </div>
          } />
          {/* Optional: 404 Not Found Page */}
          <Route path="*" element={
            <div className="text-center mt-10">
              <h2 className="text-4xl font-semibold text-red-600">404 - Page Not Found</h2>
              <p className="text-lg text-gray-600 mt-2">The page you are looking for does not exist.</p>
               {/* Optional image to illustrate the 404 page */}
              <div className="mt-4">
                <img src="https://via.placeholder.com/400x200?text=404+Error" alt="404 Error Image" className="mx-auto rounded-lg shadow-lg"/>
              </div>
            </div>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;