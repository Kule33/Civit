// frontend/src/components/layouts/Header.jsx
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom'; // Import useNavigate
import { Bell, User, Home, LayoutDashboard, FileText, CreditCard, Upload, Database, Type, BookOpen, Menu, X, LogOut, LogIn, Users } from 'lucide-react';
import { useAuth } from '../context/AuthProvider'; // Import useAuth
import NotificationDropdown from './NotificationDropdown';
import { getUnreadCount, getUserNotifications } from '../services/notificationService';

const Header = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const { user, userProfile, isAdmin, isTeacher, logout } = useAuth(); // Use the auth hook
  const navigate = useNavigate(); // For redirection after logout

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch unread count every 30 seconds
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const data = await getUnreadCount();
        setUnreadCount(data.unreadCount);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (!showNotifications || !user) return;

    const fetchNotifications = async () => {
      try {
        const data = await getUserNotifications(1, 10); // Get last 10 notifications
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [showNotifications, user]);

  // Handle notification read
  const handleNotificationRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error('Error during logout:', error.message);
      // Optionally display a toast or alert
    }
  };

  // Define navigation items with their required roles
  const allNavigationItems = [
    { name: 'Home', path: '/', icon: Home, roles: ['admin', 'teacher', 'guest'] }, // Everyone can see home
    { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher'] },
    { name: 'Users', path: '/admin/users', icon: Users, roles: ['admin'] },
    { name: 'Paper Builder', path: '/teacher/paper-builder', icon: FileText, roles: ['admin', 'teacher'] },
    { name: 'Payment', path: '/teacher/payment', icon: CreditCard, roles: ['admin', 'teacher'] },
    { name: 'Question Upload', path: '/admin/questions/upload', icon: Upload, roles: ['admin'] },
    { name: 'Manage Questions', path: '/admin/questions/manage', icon: Database, roles: ['admin'] },
    { name: 'Typeset Upload', path: '/admin/typeset/upload', icon: Type, roles: ['admin'] },
  ];

  // Filter navigation items based on user's role
  const navigationItems = allNavigationItems.filter(item => {
    if (!user) {
      return item.roles.includes('guest'); // Show only guest routes if not logged in
    }
    if (isAdmin && item.roles.includes('admin')) return true;
    if (isTeacher && item.roles.includes('teacher')) return true;
    return false;
  });

  return (
    <header className={`bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 transition-all duration-500 ${scrollY > 0 ? 'shadow-xl bg-white/90' : 'shadow-lg'} relative overflow-hidden`}>
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-purple-50/20 to-indigo-50/30"></div>
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400/60 via-purple-400/60 to-indigo-400/60"></div>

      {/* Subtle floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-300/30 rounded-full animate-float"
            style={{
              left: `${15 + i * 15}%`,
              top: `${30 + (i % 2) * 40}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      {/* Top section */}
      <div className="px-6 py-4 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 group">
            <div className="relative transform group-hover:scale-110 transition-all duration-500">
              <div className="h-12 w-12 bg-blue-600/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg border border-blue-200/50 relative overflow-hidden group-hover:bg-blue-600">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 group-hover:from-blue-400/30 group-hover:to-purple-400/30 transition-all duration-500"></div>
                <BookOpen className="text-white w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-500" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-xl opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500"></div>
            </div>
            <div className="transform group-hover:translate-x-1 transition-all duration-500">
              <h1 className="text-3xl font-bold text-gray-900">Paper Master</h1>
              <p className="text-base text-gray-600 font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Educational Paper Management
              </p>
            </div>
          </div>

          {/* Desktop User section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all duration-500 backdrop-blur-sm border border-gray-200/50 group hover:scale-110"
                  >
                    <Bell size={20} className="group-hover:animate-bounce" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <span className="text-xs text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100/20 to-purple-100/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
                  </button>
                  
                  {showNotifications && (
                    <NotificationDropdown
                      notifications={notifications}
                      onClose={() => setShowNotifications(false)}
                      onNotificationRead={handleNotificationRead}
                      onMarkAllRead={handleMarkAllAsRead}
                    />
                  )}
                </div>

                <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-gray-50/80 backdrop-blur-sm hover:bg-gray-100/80 transition-all duration-500 shadow-sm border border-gray-200/50 group hover:scale-105">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg group-hover:scale-110 transition-transform duration-300">
                    {userProfile?.fullName ? userProfile.fullName.substring(0, 2).toUpperCase() : (user.email ? user.email.substring(0, 2).toUpperCase() : 'US')}
                  </div>
                  <div>
                    <span className="text-base font-semibold text-gray-900">
                      {userProfile?.fullName || user.email || 'Guest'}
                    </span>
                    <p className="text-sm text-gray-600 font-medium">
                      {isAdmin ? 'Administrator' : isTeacher ? 'Teacher' : 'User'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="relative p-3 text-gray-600 hover:text-red-600 hover:bg-gray-100/80 rounded-xl transition-all duration-500 backdrop-blur-sm border border-gray-200/50 group hover:scale-110"
                  title="Logout"
                >
                  <LogOut size={20} className="group-hover:animate-wiggle" />
                  <div className="absolute inset-0 bg-red-100/20 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className="group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-all duration-500 shadow-md hover:shadow-lg"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Sign In
              </NavLink>
            )}
          </div>

          {/* Mobile menu button - only show when authenticated */}
          {user && (
            <button
              className="md:hidden p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all duration-300 backdrop-blur-sm border border-gray-200/50"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {/* Desktop Navigation - only when authenticated */}
      {user && (
        <div className="hidden md:block relative border-t border-gray-200/50">
          <div className="absolute inset-0 bg-gray-50/60 backdrop-blur-sm"></div>
          <div className="relative z-10 max-w-7xl mx-auto">
            <nav className="flex items-center">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative flex items-center px-5 py-4 text-base font-semibold transition-all duration-500 group ${
                      isActive
                        ? 'text-blue-600'
                        : 'text-gray-700 hover:text-blue-600'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <>
                          <div className="absolute inset-0 bg-blue-50/80 rounded-2xl"></div>
                          <div className="absolute inset-0 bg-blue-100/40 rounded-2xl blur-sm opacity-60"></div>
                        </>
                      )}

                      <div className="absolute inset-0 bg-gray-100/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm group-hover:scale-105"></div>

                      <div className="flex items-center space-x-3 relative z-10">
                        <item.icon size={20} className="transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" />
                        <span>{item.name}</span>
                      </div>

                      <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 shadow-sm ${
                        isActive ? 'w-full opacity-100' : 'w-0 group-hover:w-full opacity-80'
                      }`}></div>

                      {isActive && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full animate-bounce shadow-sm"></div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Navigation Menu - only when authenticated */}
      {user && (
        <div className={`md:hidden bg-white/90 backdrop-blur-lg border-t border-gray-200/50 transition-all duration-500 ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <nav className="px-6 py-4 space-y-2">
            {navigationItems.map((item, index) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-50/80 text-blue-600 font-semibold border border-blue-200/50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50/80 font-medium'
                  }`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon size={20} />
                <span className="font-medium text-base">{item.name}</span>
              </NavLink>
            ))}
            <button
              onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 text-white bg-red-600 hover:bg-red-700 font-semibold w-full"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </nav>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx="true">{`
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes float {
          0% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-10px) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: translateY(0px) rotate(360deg);
            opacity: 0.6;
          }
        }
        @keyframes wiggle {
            0%, 100% { transform: rotate(-3deg); }
            50% { transform: rotate(3deg); }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .group-hover\\:animate-wiggle:hover {
            animation: wiggle 0.5s ease-in-out infinite;
        }
      `}</style>
    </header>
  );
};

export default Header;