import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard,
  Upload,
  Database,
  Type,
  Settings
} from 'lucide-react';

const Sidebar = ({ isOpen, userRole }) => {
  const teacherMenu = [
    { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'Paper Builder', path: '/teacher/paper-builder', icon: FileText },
    { name: 'Payment', path: '/teacher/payment', icon: CreditCard },
  ];

  const adminMenu = [
    { name: 'Question Upload', path: '/admin/questions/upload', icon: Upload },
    { name: 'Manage Questions', path: '/admin/questions/manage', icon: Database },
    { name: 'Typeset Upload', path: '/admin/typeset/upload', icon: Type },
  ];

  // For Phase 1: Show all menus to everyone
  const allMenu = [...teacherMenu, ...adminMenu];

  return (
    <aside className={`bg-gradient-to-b from-gray-900 to-gray-800 text-white ${isOpen ? 'w-64' : 'w-20'} transition-all duration-300 h-screen flex flex-col`}>
      <div className="p-5 flex items-center justify-center border-b border-gray-700">
        {isOpen ? (
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Paper Master
          </h1>
        ) : (
          <div className="h-8 w-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded flex items-center justify-center text-white font-bold">PM</div>
        )}
      </div>

      <nav className="flex-1 mt-6">
        {/* Teacher Section Header */}
        {isOpen && (
          <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wider">
            Teacher Portal
          </div>
        )}
        <ul className="space-y-2 px-3">
          {teacherMenu.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-white/10 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <item.icon size={20} />
                {isOpen && <span className="ml-3 font-medium">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Admin Section Header */}
        {isOpen && (
          <div className="px-4 py-2 text-xs text-gray-400 uppercase tracking-wider mt-6">
            Admin Portal
          </div>
        )}
        <ul className="space-y-2 px-3">
          {adminMenu.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-200 border-l-2 border-blue-400'
                      : 'text-gray-300 hover:bg-blue-500/10 hover:text-blue-200'
                  }`
                }
              >
                <item.icon size={20} />
                {isOpen && <span className="ml-3 font-medium">{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center px-4 py-3 rounded-lg transition-all ${
              isActive
                ? 'bg-white/10 text-white'
                : 'text-gray-300 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <Settings size={20} />
          {isOpen && <span className="ml-3 font-medium">Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;