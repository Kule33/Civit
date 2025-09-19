import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, User, Home, LayoutDashboard, FileText, CreditCard, Upload, Database, Type, Settings, Sparkles, Zap, Menu, X } from 'lucide-react';

const Header = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHover, setActiveHover] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { name: 'Home', path: '/', icon: Home, color: 'from-emerald-400 to-teal-600', hoverColor: 'hover:from-emerald-500 hover:to-teal-700' },
    { name: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard, color: 'from-blue-400 to-indigo-600', hoverColor: 'hover:from-blue-500 hover:to-indigo-700' },
    { name: 'Paper Builder', path: '/teacher/paper-builder', icon: FileText, color: 'from-purple-400 to-pink-600', hoverColor: 'hover:from-purple-500 hover:to-pink-700' },
    { name: 'Payment', path: '/teacher/payment', icon: CreditCard, color: 'from-amber-400 to-orange-600', hoverColor: 'hover:from-amber-500 hover:to-orange-700' },
    { name: 'Question Upload', path: '/admin/questions/upload', icon: Upload, color: 'from-cyan-400 to-blue-600', hoverColor: 'hover:from-cyan-500 hover:to-blue-700' },
    { name: 'Manage Questions', path: '/admin/questions/manage', icon: Database, color: 'from-violet-400 to-purple-600', hoverColor: 'hover:from-violet-500 hover:to-purple-700' },
    { name: 'Typeset Upload', path: '/admin/typeset/upload', icon: Type, color: 'from-rose-400 to-red-600', hoverColor: 'hover:from-rose-500 hover:to-red-700' },
  ];

  return (
    <header 
      className={`relative transition-all duration-700 ${scrollY > 50 ? 'shadow-2xl backdrop-blur-xl' : 'shadow-lg'} z-50`}
      onMouseEnter={() => setIsHeaderHovered(true)}
      onMouseLeave={() => setIsHeaderHovered(false)}
    >
      {/* Dynamic animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800"></div>
      <div className={`absolute inset-0 bg-gradient-to-r from-blue-600/80 via-purple-600/70 to-pink-600/80 transition-all duration-1000 ${isHeaderHovered ? 'opacity-90' : 'opacity-70'}`}></div>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-cyan-400/10"></div>
      
      {/* Animated mesh background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 animate-pulse"></div>
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)`,
            backgroundSize: '100% 100%',
            animation: 'mesh 8s ease-in-out infinite'
          }}
        ></div>
      </div>
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s linear infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>
      
      {/* Main header content */}
      <div className="relative z-10">
        {/* Top section */}
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo with modern glassmorphism */}
            <div className="flex items-center space-x-4 group">
              <div className="relative transform group-hover:scale-110 transition-all duration-500">
                <div className="h-16 w-16 bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl relative overflow-hidden group-hover:bg-white/15">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/30 to-purple-400/30 group-hover:from-cyan-400/40 group-hover:to-purple-400/40 transition-all duration-500"></div>
                  <Sparkles className="text-white w-7 h-7 relative z-10 group-hover:animate-spin" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-br from-cyan-400/40 to-purple-400/40 rounded-3xl opacity-50 blur-xl group-hover:opacity-75 transition-opacity duration-500"></div>
              </div>
              <div className="transform group-hover:translate-x-2 transition-all duration-500">
                <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-white via-cyan-100 to-purple-100 bg-clip-text drop-shadow-2xl group-hover:from-cyan-100 group-hover:to-purple-200 transition-all duration-500">
                  Paper Master
                </h1>
                <p className="text-cyan-100/90 text-sm font-medium flex items-center gap-2 mt-1">
                  <Zap size={14} className="text-yellow-300 animate-pulse" />
                  Educational Paper Management System
                </p>
              </div>
            </div>

            {/* Desktop User section */}
            <div className="hidden md:flex items-center space-x-6">
              <button className="relative p-3 rounded-2xl text-white/80 hover:text-white hover:bg-white/15 transition-all duration-500 backdrop-blur-xl border border-white/20 group hover:scale-110">
                <Bell size={22} className="group-hover:animate-bounce" />
                <span className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                  <span className="text-xs text-white font-bold">3</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur-md"></div>
              </button>

              <div className="flex items-center space-x-3 px-5 py-3 rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/25 hover:bg-white/20 transition-all duration-500 group hover:scale-105">
                <div className="h-12 w-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold shadow-xl group-hover:scale-110 transition-transform duration-300">
                  JD
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">John Doe</span>
                  <p className="text-xs text-cyan-100/80">Administrator</p>
                </div>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-3 rounded-2xl text-white/80 hover:text-white hover:bg-white/15 transition-all duration-300 backdrop-blur-xl border border-white/20"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:block relative border-t border-white/10">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/90 via-purple-800/80 to-slate-800/90 backdrop-blur-2xl"></div>
          <div className="relative z-10 max-w-7xl mx-auto">
            <nav className="flex items-center relative">
              {navigationItems.map((item, index) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `relative flex items-center px-6 py-5 font-medium transition-all duration-500 group whitespace-nowrap ${
                      isActive
                        ? 'text-white'
                        : 'text-purple-100/85 hover:text-white'
                    }`
                  }
                  onMouseEnter={() => setActiveHover(index)}
                  onMouseLeave={() => setActiveHover(null)}
                >
                  {({ isActive }) => (
                    <>
                      {/* Active indicator with item-specific colors */}
                      {isActive && (
                        <>
                          <div className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-2xl opacity-90 animate-pulse`}></div>
                          <div className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-2xl blur-lg opacity-60`}></div>
                        </>
                      )}
                      
                      {/* Hover effect */}
                      <div className={`absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-xl ${activeHover === index ? 'scale-105' : ''}`}></div>
                      
                      {/* Content */}
                      <div className="relative flex items-center space-x-3 z-10">
                        <item.icon size={20} className="transition-all duration-500 group-hover:scale-125 group-hover:rotate-12" />
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>

                      {/* Floating indicator */}
                      {isActive && (
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      )}

                      {/* Ripple effect on hover */}
                      {activeHover === index && (
                        <div className="absolute inset-0 bg-white/5 rounded-2xl animate-ping"></div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
              
              {/* Settings button */}
              <NavLink
                to="/settings"
                className="relative flex items-center px-6 py-5 font-medium text-purple-100/85 hover:text-white transition-all duration-500 group ml-auto"
              >
                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-xl group-hover:scale-105"></div>
                <div className="relative flex items-center space-x-3 z-10">
                  <Settings size={20} className="transition-all duration-700 group-hover:rotate-180" />
                  <span className="font-medium text-sm">Settings</span>
                </div>
              </NavLink>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`md:hidden absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-2xl border-b border-white/10 transition-all duration-500 ${isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <nav className="px-6 py-4 space-y-2">
          {navigationItems.map((item, index) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-white/20'
                    : 'text-purple-100/85 hover:text-white hover:bg-white/10'
                }`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon size={18} />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          ))}
          <NavLink
            to="/settings"
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-purple-100/85 hover:text-white hover:bg-white/10 transition-all duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Settings size={18} />
            <span className="font-medium">Settings</span>
          </NavLink>
        </nav>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); opacity: 0.8; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
          100% { transform: translateY(0px) rotate(360deg); opacity: 0.8; }
        }
        
        @keyframes mesh {
          0%, 100% { transform: scale(1) rotate(0deg); }
          33% { transform: scale(1.05) rotate(2deg); }
          66% { transform: scale(0.95) rotate(-2deg); }
        }
      `}</style>
    </header>
  );
};

export default Header;