import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Sidebar from '../Sidebar';
import Footer from '../Footer';

function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const userRole = 'teacher'; // For demo purposes

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={isSidebarOpen} userRole={userRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

export default MainLayout;