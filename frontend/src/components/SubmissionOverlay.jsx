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

// Demo component to showcase the enhanced overlay
const SubmissionOverlayDemo = () => {
  const [overlayState, setOverlayState] = useState({
    isVisible: false,
    status: 'loading',
    message: 'Please wait while we process your request...',
    position: 'center'
  });

  const showOverlay = (status, message, position = 'center') => {
    setOverlayState({
      isVisible: true,
      status,
      message,
      position
    });
  };

  const hideOverlay = () => {
    setOverlayState(prev => ({ ...prev, isVisible: false }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Modern Submission Overlay</h1>
        <p className="text-gray-600 mb-8">A dynamic, blended UI component with smooth animations</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
            <h2 className="text-xl font-semibold mb-4">Try Different States:</h2>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => showOverlay('loading', 'Please wait while we process your request...')}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Show Loading
              </button>
              <button
                onClick={() => showOverlay('success', 'Your submission has been processed successfully!')}
                className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Show Success
              </button>
              <button
                onClick={() => showOverlay('error', 'Something went wrong. Please try again later.')}
                className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Show Error
              </button>
              <button
                onClick={() => showOverlay('info', 'This is an informational message about the process.')}
                className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Show Info
              </button>
              <button
                onClick={() => showOverlay('warning', 'Warning: This action cannot be undone.')}
                className="px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Show Warning
              </button>
            </div>

            <h2 className="text-xl font-semibold mt-6 mb-4">Position Options:</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => showOverlay('success', 'Notification at the top!', 'top')}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Top
              </button>
              <button
                onClick={() => showOverlay('success', 'Notification at the bottom!', 'bottom')}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Bottom
              </button>
              <button
                onClick={() => showOverlay('success', 'Notification on the left!', 'left')}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Left
              </button>
              <button
                onClick={() => showOverlay('success', 'Notification on the right!', 'right')}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                Right
              </button>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
            <h2 className="text-xl font-semibold mb-4">Enhanced Features:</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <div className="bg-blue-100 p-1 rounded-full mr-3 mt-1">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <span>Dynamic progress indicator for auto-closing notifications</span>
              </li>
              <li className="flex items-start">
                <div className="bg-blue-100 p-1 rounded-full mr-3 mt-1">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <span>Multiple positioning options (top, bottom, left, right, center)</span>
              </li>
              <li className="flex items-start">
                <div className="bg-blue-100 p-1 rounded-full mr-3 mt-1">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <span>Smooth entrance and exit animations with scaling</span>
              </li>
              <li className="flex items-start">
                <div className="bg-blue-100 p-1 rounded-full mr-3 mt-1">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <span>Backdrop blur effect with dynamic color tinting</span>
              </li>
              <li className="flex items-start">
                <div className="bg-blue-100 p-1 rounded-full mr-3 mt-1">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <span>Additional status types (info, warning)</span>
              </li>
              <li className="flex items-start">
                <div className="bg-blue-100 p-1 rounded-full mr-3 mt-1">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <span>Glass morphism design with blended backgrounds</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Background content to show overlay effect */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <h2 className="text-xl font-semibold mb-4">Sample Background Content</h2>
          <p className="text-gray-700 mb-4">
            This content demonstrates how the overlay appears with the glass morphism effect. 
            Notice how the backdrop blur creates a sophisticated, modern appearance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100">
              <h3 className="font-medium mb-2">Card 1</h3>
              <p className="text-sm text-gray-600">Some sample content here to show the overlay effect</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-xl border border-green-100">
              <h3 className="font-medium mb-2">Card 2</h3>
              <p className="text-sm text-gray-600">More sample content here to show the overlay effect</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-xl border border-amber-100">
              <h3 className="font-medium mb-2">Card 3</h3>
              <p className="text-sm text-gray-600">Additional content to demonstrate the UI</p>
            </div>
          </div>
        </div>
      </div>

      <SubmissionOverlay
        isVisible={overlayState.isVisible}
        status={overlayState.status}
        message={overlayState.message}
        onClose={hideOverlay}
        position={overlayState.position}
        autoClose={overlayState.status !== 'loading'}
        autoCloseDelay={3000}
      />
    </div>
  );
};

export default SubmissionOverlayDemo;