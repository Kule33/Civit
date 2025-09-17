import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader, X, AlertCircle, Info } from 'lucide-react';

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

  useEffect(() => {
    if (isVisible && status !== 'loading' && autoClose) {
      // Reset progress when overlay becomes visible
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
          icon: <Loader className="h-16 w-16 text-blue-600 animate-spin" />,
          bgGradient: 'from-blue-50/90 via-white to-indigo-50/90',
          borderColor: 'border-blue-200/70',
          progressColor: 'bg-blue-500',
          title: 'Processing',
          iconBg: 'bg-blue-100/50',
          backdropBlur: 'bg-blue-500/5'
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-600" />,
          bgGradient: 'from-green-50/90 via-white to-emerald-50/90',
          borderColor: 'border-green-200/70',
          progressColor: 'bg-green-500',
          title: 'Success',
          iconBg: 'bg-green-100/50',
          backdropBlur: 'bg-green-500/5'
        };
      case 'error':
        return {
          icon: <XCircle className="h-16 w-16 text-red-600" />,
          bgGradient: 'from-red-50/90 via-white to-rose-50/90',
          borderColor: 'border-red-200/70',
          progressColor: 'bg-red-500',
          title: 'Error',
          iconBg: 'bg-red-100/50',
          backdropBlur: 'bg-red-500/5'
        };
      case 'info':
        return {
          icon: <Info className="h-16 w-16 text-indigo-600" />,
          bgGradient: 'from-indigo-50/90 via-white to-purple-50/90',
          borderColor: 'border-indigo-200/70',
          progressColor: 'bg-indigo-500',
          title: 'Information',
          iconBg: 'bg-indigo-100/50',
          backdropBlur: 'bg-indigo-500/5'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="h-16 w-16 text-amber-600" />,
          bgGradient: 'from-amber-50/90 via-white to-orange-50/90',
          borderColor: 'border-amber-200/70',
          progressColor: 'bg-amber-500',
          title: 'Warning',
          iconBg: 'bg-amber-100/50',
          backdropBlur: 'bg-amber-500/5'
        };
      default:
        return {
          icon: null,
          bgGradient: 'from-gray-50/90 via-white to-slate-50/90',
          borderColor: 'border-gray-200/70',
          progressColor: 'bg-gray-500',
          title: 'Notification',
          iconBg: 'bg-gray-100/50',
          backdropBlur: 'bg-gray-500/5'
        };
    }
  };

  const getPositionClass = () => {
    switch (position) {
      case 'top':
        return 'items-start pt-12';
      case 'bottom':
        return 'items-end pb-12';
      case 'left':
        return 'items-start justify-start pl-6';
      case 'right':
        return 'items-start justify-end pr-6';
      default:
        return 'items-center justify-center';
    }
  };

  const config = getStatusConfig();
  const positionClass = getPositionClass();

  return (
    <div className={`fixed inset-0 flex ${positionClass} z-50 transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>
      {/* Backdrop with dynamic color based on status */}
      <div 
        className={`fixed inset-0 ${config.backdropBlur} backdrop-blur-sm transition-all duration-300`}
        onClick={handleClose}
      />
      
      {/* Main overlay card */}
      <div className={`relative bg-gradient-to-br ${config.bgGradient} rounded-2xl shadow-2xl border ${config.borderColor} max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        {/* Progress bar for auto-close states */}
        {(status !== 'loading' && autoClose) && (
          <div className="h-1 w-full bg-gray-200">
            <div 
              className={`h-full ${config.progressColor} transition-all duration-200 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        <div className="p-6">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/5 transition-colors duration-200"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          
          {/* Icon with blended background */}
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-2xl ${config.iconBg} backdrop-blur-sm`}>
              {config.icon}
            </div>
          </div>
          
          {/* Title and message */}
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {config.title}
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {message}
            </p>
          </div>
          
          {/* Action button for non-loading states */}
          {status !== 'loading' && (
            <div className="flex justify-center">
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


export default SubmissionOverlay;