import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';

const MainLayout = () => {
  const [scrollY, setScrollY] = useState(0);
  // Removed isLoading state as global authLoading in App.jsx now handles initial loading

  useEffect(() => {
    // Scroll tracking for scroll-to-top button
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    // Removed the setTimeout for isLoading as it's no longer needed here.

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // No initial loading screen here, as App.jsx handles auth loading
  // and ProtectedRoute handles loading for specific routes.

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header />

      {/* Main content area */}
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Content container with clean styling */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[calc(100vh-12rem)]">
            <div className="p-6 lg:p-8">
              <Outlet />
            </div>
          </div>

          {/* Scroll to top button */}
          {scrollY > 400 && (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:shadow-xl z-50"
              aria-label="Scroll to top"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          )}

          {/* Progress bar for scroll */}
          <div className="fixed top-0 left-0 right-0 z-40 h-1 bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${Math.min((scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100, 100)}%`
              }}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Clean scrollbar styling */}
      <style jsx="true">{`
        /* Custom scrollbar styling */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
};

export default MainLayout;