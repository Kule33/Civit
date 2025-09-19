import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';

const MainLayout = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Scroll tracking
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    // Mouse tracking for dynamic effects
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Loading simulation
    const timer = setTimeout(() => setIsLoading(false), 1500);

    // Time updates
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timer);
      clearInterval(timeInterval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            />
          ))}
        </div>

        {/* Loading content */}
        <div className="text-center space-y-8 relative z-10">
          <div className="relative">
            <div className="w-24 h-24 bg-white/10 backdrop-blur-2xl rounded-3xl flex items-center justify-center border border-white/20 shadow-2xl animate-spin">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">PM</span>
              </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-br from-cyan-400/40 to-purple-400/40 rounded-3xl opacity-50 blur-2xl animate-pulse"></div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-transparent bg-gradient-to-r from-white via-cyan-100 to-purple-100 bg-clip-text">
              Paper Master
            </h1>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-white/80 text-sm">Loading your educational experience...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic background layers */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50/40"></div>
      
      {/* Mouse-following gradient */}
      <div 
        className="fixed inset-0 opacity-30 transition-all duration-1000 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(59, 130, 246, 0.1) 0%, 
            rgba(147, 51, 234, 0.05) 25%, 
            transparent 50%)`
        }}
      />
      
      {/* Animated mesh background */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
            `,
            backgroundSize: '100% 100%',
            animation: 'meshMove 15s ease-in-out infinite'
          }}
        />
      </div>
      
      {/* Subtle grid pattern */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px'
        }}
      />
      
      {/* Floating geometric shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`absolute opacity-10 ${
              i % 3 === 0 ? 'bg-blue-400' : 
              i % 3 === 1 ? 'bg-purple-400' : 'bg-emerald-400'
            } rounded-full blur-xl`}
            style={{
              width: `${50 + Math.random() * 100}px`,
              height: `${50 + Math.random() * 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${10 + Math.random() * 20}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <Header />

      {/* Main content area */}
      <main className="relative min-h-screen">
        {/* Content wrapper with enhanced styling */}
        <div className="relative">
          {/* Scroll-based parallax effect */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              transform: `translateY(${scrollY * 0.1}px)`,
              background: `
                radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 70% 80%, rgba(147, 51, 234, 0.05) 0%, transparent 50%)
              `
            }}
          />

          {/* Content container */}
          <div className="relative z-10 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Subtle content background with glassmorphism */}
              <div className="relative rounded-3xl bg-white/60 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden min-h-[calc(100vh-12rem)]">
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-blue-50/40 pointer-events-none"></div>
                
                {/* Content area */}
                <div className="relative z-10 p-6 lg:p-8">
                  <Outlet />
                </div>

                {/* Decorative elements */}
                <div className="absolute top-4 right-4 opacity-20 pointer-events-none">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-2xl"></div>
                </div>
                <div className="absolute bottom-4 left-4 opacity-20 pointer-events-none">
                  <div className="w-24 h-24 bg-gradient-to-br from-emerald-400/30 to-blue-400/30 rounded-full blur-2xl"></div>
                </div>
              </div>

              {/* Floating action elements */}
              <div className="fixed bottom-8 right-8 z-50 space-y-4">
                {/* Time display */}
                <div className="px-4 py-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-lg">
                  <div className="text-xs text-gray-600 font-medium">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Scroll to top button */}
                {scrollY > 300 && (
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-110 backdrop-blur-xl border border-white/20 group"
                  >
                    <svg 
                      className="w-6 h-6 group-hover:-translate-y-1 transition-transform duration-300" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Progress bar for scroll */}
              <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200/50">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-300"
                  style={{ 
                    width: `${(scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes meshMove {
          0%, 100% { 
            transform: scale(1) rotate(0deg); 
            opacity: 0.2; 
          }
          25% { 
            transform: scale(1.1) rotate(90deg); 
            opacity: 0.3; 
          }
          50% { 
            transform: scale(0.9) rotate(180deg); 
            opacity: 0.25; 
          }
          75% { 
            transform: scale(1.05) rotate(270deg); 
            opacity: 0.35; 
          }
        }
        
        @keyframes float {
          0% { 
            transform: translateY(0px) rotate(0deg) scale(1); 
            opacity: 0.1; 
          }
          33% { 
            transform: translateY(-30px) rotate(120deg) scale(1.1); 
            opacity: 0.2; 
          }
          66% { 
            transform: translateY(-60px) rotate(240deg) scale(0.9); 
            opacity: 0.15; 
          }
          100% { 
            transform: translateY(0px) rotate(360deg) scale(1); 
            opacity: 0.1; 
          }
        }
        
        /* Smooth scrolling for the entire page */
        html {
          scroll-behavior: smooth;
        }
        
        /* Custom scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.5);
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 4px;
          transition: all 0.3s ease;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }

        /* Prevent horizontal scrolling */
        body {
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
};

export default MainLayout;