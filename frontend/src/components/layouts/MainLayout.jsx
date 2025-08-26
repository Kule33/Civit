import React from 'react';
import { Link, Outlet } from 'react-router-dom'; // Import Outlet here!

function MainLayout() { // No longer needs 'children' prop
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-3xl font-bold">
          <Link to="/" className="hover:underline">Paper Master</Link>
        </h1>
        <ul className="flex space-x-4 mt-2">
          <li><Link to="/teacher/dashboard" className="hover:underline">Teacher Dashboard</Link></li>
          <li><Link to="/teacher/paper-builder" className="hover:underline">Paper Builder</Link></li>
          <li><Link to="/teacher/teacher-payment" className="hover:underline">Teacher Payment</Link></li>
          <li><Link to="/admin/questions/upload" className="hover:underline">Admin Upload Questions</Link></li>
          <li><Link to="/admin/questions/manage" className="hover:underline">Admin Manage Questions</Link></li>
          <li><Link to="/admin/typeset/upload" className="hover:underline">Admin Typeset Upload</Link></li>
        </ul>
      </nav>

      <main className="flex-grow p-4">
        <Outlet /> {/* This is the crucial change! */}
      </main>

      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; {new Date().getFullYear()} Paper Master. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default MainLayout;