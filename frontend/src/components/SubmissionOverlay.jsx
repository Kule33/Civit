import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader, X, AlertCircle, Info, Sparkles } from 'lucide-react';

const SubmissionOverlay = ({ 
  isVisible, 
  status, 
  message, 
  onClose, 
  autoClose = true, 
  autoCloseDelay = 3000,
  position = 'center'
}) => {
  const [progress, setProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate particles for success status
    if (status === 'success' && isVisible) {
      const newParticles = [...Array(15)].map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 3
      }));
      setParticles(newParticles);
    }
  }, [status, isVisible]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isVisible) {
        const rect = e.target.getBoundingClientRect();
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.offsetWidth) * 100,
          y: ((e.clientY - rect.top) / rect.offsetHeight) * 100
        });
      }
    };

    if (isVisible) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && status !== 'loading' && autoClose) {
      setProgress(0);
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + (100 / (autoCloseDelay / 20));
        });
      }, 20);

      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [isVisible, status, autoClose, autoCloseDelay]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
      setProgress(0);
    }, 300);
  };

  if (!isVisible && !isClosing) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader className="h-20 w-20 text-blue-600 animate-spin" />,
          bgGradient: 'from-blue-50/95 via-white/90 to-indigo-50/95',
          borderGradient: 'from-blue-400/30 to-indigo-400/30',
          progressGradient: 'from-blue-500 to-indigo-600',
          title: 'Processing',
          iconBg: 'from-blue-100/80 to-indigo-100/80',
          backdropColor: 'bg-blue-500/10',
          glowColor: 'shadow-blue-500/20',
          particleColor: 'bg-blue-400'
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-20 w-20 text-emerald-600" />,
          bgGradient: 'from-emerald-50/95 via-white/90 to-green-50/95',
          borderGradient: 'from-emerald-400/30 to-green-400/30',
          progressGradient: 'from-emerald-500 to-green-600',
          title: 'Success',
          iconBg: 'from-emerald-100/80 to-green-100/80',
          backdropColor: 'bg-emerald-500/10',
          glowColor: 'shadow-emerald-500/20',
          particleColor: 'bg-emerald-400'
        };
      case 'error':
        return {
          icon: <XCircle className="h-20 w-20 text-red-600" />,
          bgGradient: 'from-red-50/95 via-white/90 to-rose-50/95',
          borderGradient: 'from-red-400/30 to-rose-400/30',
          progressGradient: 'from-red-500 to-rose-600',
          title: 'Error',
          iconBg: 'from-red-100/80 to-rose-100/80',
          backdropColor: 'bg-red-500/10',
          glowColor: 'shadow-red-500/20',
          particleColor: 'bg-red-400'
        };
      case 'info':
        return {
          icon: <Info className="h-20 w-20 text-cyan-600" />,
          bgGradient: 'from-cyan-50/95 via-white/90 to-blue-50/95',
          borderGradient: 'from-cyan-400/30 to-blue-400/30',
          progressGradient: 'from-cyan-500 to-blue-600',
          title: 'Information',
          iconBg: 'from-cyan-100/80 to-blue-100/80',
          backdropColor: 'bg-cyan-500/10',
          glowColor: 'shadow-cyan-500/20',
          particleColor: 'bg-cyan-400'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="h-20 w-20 text-amber-600" />,
          bgGradient: 'from-amber-50/95 via-white/90 to-orange-50/95',
          borderGradient: 'from-amber-400/30 to-orange-400/30',
          progressGradient: 'from-amber-500 to-orange-600',
          title: 'Warning',
          iconBg: 'from-amber-100/80 to-orange-100/80',
          backdropColor: 'bg-amber-500/10',
          glowColor: 'shadow-amber-500/20',
          particleColor: 'bg-amber-400'
        };
      default:
        return {
          icon: <Info className="h-20 w-20 text-gray-600" />,
          bgGradient: 'from-gray-50/95 via-white/90 to-slate-50/95',
          borderGradient: 'from-gray-400/30 to-slate-400/30',
          progressGradient: 'from-gray-500 to-slate-600',
          title: 'Notification',
          iconBg: 'from-gray-100/80 to-slate-100/80',
          backdropColor: 'bg-gray-500/10',
          glowColor: 'shadow-gray-500/20',
          particleColor: 'bg-gray-400'
        };
    }
  };

  const getPositionClass = () => {
    switch (position) {
      case 'top':
        return 'items-start pt-16';
      case 'bottom':
        return 'items-end pb-16';
      case 'left':
        return 'items-center justify-start pl-8';
      case 'right':
        return 'items-center justify-end pr-8';
      default:
        return 'items-center justify-center';
    }
  };

  const config = getStatusConfig();
  const positionClass = getPositionClass();

  return (
    <>
      <div className={`fixed inset-0 flex ${positionClass} z-50 transition-all duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
        {/* Enhanced backdrop with blur and color */}
        <div 
          className={`fixed inset-0 ${config.backdropColor} backdrop-blur-md transition-all duration-500`}
          onClick={handleClose}
        />
        
        {/* Mouse tracking background effect */}
        <div 
          className="fixed inset-0 transition-all duration-700 pointer-events-none opacity-20"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
              ${config.particleColor.replace('bg-', 'rgba(').replace('-400', ', 0.1)')} 0%, 
              transparent 50%)`
          }}
        />
        
        {/* Floating particles for success state */}
        {status === 'success' && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className={`absolute w-2 h-2 ${config.particleColor} rounded-full opacity-60`}
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  animation: `sparkle ${particle.duration}s ease-out infinite`,
                  animationDelay: `${particle.delay}s`
                }}
              />
            ))}
          </div>
        )}
        
        {/* Main overlay card with enhanced styling */}
        <div className={`relative max-w-lg w-full mx-6 transform transition-all duration-500 ${isClosing ? 'scale-90 opacity-0 translate-y-8' : 'scale-100 opacity-100 translate-y-0'}`}>
          {/* Outer glow effect */}
          <div className={`absolute inset-0 bg-gradient-to-br ${config.borderGradient} rounded-3xl blur-xl opacity-50 ${config.glowColor} shadow-2xl`}></div>
          
          {/* Main card */}
          <div className={`relative bg-gradient-to-br ${config.bgGradient} backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden`}>
            {/* Animated border gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${config.borderGradient} opacity-30 animate-pulse rounded-3xl`}></div>
            
            {/* Progress bar for auto-close states */}
            {(status !== 'loading' && autoClose) && (
              <div className="relative h-2 bg-white/20 backdrop-blur-sm">
                <div 
                  className={`h-full bg-gradient-to-r ${config.progressGradient} transition-all duration-200 ease-out relative overflow-hidden`}
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
            )}
            
            <div className="relative p-8">
              {/* Close button with modern styling */}
              <button
                onClick={handleClose}
                className="absolute top-6 right-6 p-2 rounded-xl bg-white/20 backdrop-blur-xl hover:bg-white/30 transition-all duration-300 group hover:scale-110"
              >
                <X className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors duration-300" />
              </button>
              
              {/* Icon with enhanced background */}
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <div className={`p-5 rounded-3xl bg-gradient-to-br ${config.iconBg} backdrop-blur-xl border border-white/30 shadow-xl group-hover:scale-105 transition-transform duration-300`}>
                    {config.icon}
                  </div>
                  {/* Icon glow effect */}
                  <div className={`absolute -inset-2 bg-gradient-to-br ${config.borderGradient} rounded-3xl opacity-40 blur-lg group-hover:opacity-60 transition-opacity duration-300`}></div>
                  
                  {/* Sparkles for success */}
                  {status === 'success' && (
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="h-6 w-6 text-emerald-400 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Title and message with enhanced typography */}
              <div className="text-center space-y-4">
                <h3 className={`text-3xl font-bold bg-gradient-to-r ${config.progressGradient} bg-clip-text text-transparent`}>
                  {config.title}
                </h3>
                <p className="text-gray-700 text-lg leading-relaxed max-w-md mx-auto">
                  {message}
                </p>
              </div>
              
              {/* Loading spinner enhancement */}
              {status === 'loading' && (
                <div className="flex justify-center mt-6">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              )}
              
              {/* Enhanced action button for non-loading states */}
              {status !== 'loading' && (
                <div className="flex justify-center mt-8">
                  <button
                    onClick={handleClose}
                    className={`group px-8 py-4 bg-gradient-to-r ${config.progressGradient} text-white rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 backdrop-blur-xl`}
                    style={{ focusRingColor: config.progressGradient.split(' ')[1] + '/50' }}
                  >
                    <span className="flex items-center space-x-2">
                      <span>Continue</span>
                      <div className="w-0 group-hover:w-5 transition-all duration-300 overflow-hidden">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced CSS Animations */}
      <style jsx="true">{`
        @keyframes sparkle {
          0% { 
            opacity: 0; 
            transform: translateY(0px) scale(0); 
          }
          50% { 
            opacity: 1; 
            transform: translateY(-20px) scale(1); 
          }
          100% { 
            opacity: 0; 
            transform: translateY(-40px) scale(0); 
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          50% { 
            transform: translateY(-10px) rotate(180deg); 
          }
        }
        
        /* Prevent body scroll when overlay is active */
        ${isVisible ? 'body { overflow: hidden; }' : ''}
      `}</style>
    </>
  );
};

export default SubmissionOverlay;