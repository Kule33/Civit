import React from 'react';
import { Menu, X, Bell, User } from 'lucide-react';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 mr-4 transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Paper Master</h1>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
          <Bell size={20} />
          <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
            JD
          </div>
          <span className="text-sm font-medium text-gray-700">John Doe</span>
        </div>
      </div>
    </header>
  );
};

export default Header;