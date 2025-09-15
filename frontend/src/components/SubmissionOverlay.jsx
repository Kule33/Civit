import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const SubmissionOverlay = ({ isVisible, status, message, onClose, autoClose = true, autoCloseDelay = 3000 }) => {
  useEffect(() => {
    if (isVisible && status !== 'loading' && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, status, autoClose, autoCloseDelay, onClose]);

  if (!isVisible) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader className="animate-spin h-16 w-16 text-blue-500" />,
          bgColor: 'bg-white',
          textColor: 'text-gray-800'
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-16 w-16 text-green-500" />,
          bgColor: 'bg-white',
          textColor: 'text-gray-800'
        };
      case 'error':
        return {
          icon: <XCircle className="h-16 w-16 text-red-500" />,
          bgColor: 'bg-white',
          textColor: 'text-gray-800'
        };
      default:
        return {
          icon: null,
          bgColor: 'bg-white',
          textColor: 'text-gray-800'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex items-center justify-center z-50 p-6 transition-all duration-500">
      {/* Animated pulse rings for loading state */}
      {status === 'loading' && (
        <>
          <div className="absolute rounded-full bg-blue-500 opacity-20 animate-ping" 
               style={{ width: '400px', height: '400px' }} />
          <div className="absolute rounded-full bg-blue-500 opacity-10 animate-ping" 
               style={{ width: '500px', height: '500px', animationDelay: '0.5s' }} />
        </>
      )}

      <div className={`${config.bgColor} rounded-2xl shadow-2xl max-w-lg w-full mx-4 transform transition-all duration-500 scale-100 relative overflow-hidden`}
           style={{
             minHeight: '320px',
             boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)'
           }}>
        
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400 to-transparent transform -skew-x-12 animate-pulse" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center text-center p-10 h-full">
          <div className="mb-8 relative">
            <div className={`rounded-full p-6 bg-gray-50 shadow-xl ${status === 'loading' ? 'animate-pulse' : 'animate-bounce'}`}>
              {config.icon}
            </div>
            
            {/* Success checkmark animation */}
            {status === 'success' && (
              <div className="absolute inset-0 rounded-full border-4 border-green-500 animate-ping opacity-75" />
            )}
          </div>
          
          <h3 className={`text-2xl font-bold mb-4 ${config.textColor} tracking-wide`}>
            {status === 'loading' ? 'Processing...' : status === 'success' ? 'Success!' : 'Error!'}
          </h3>
          
          <p className="text-gray-600 mb-8 text-lg leading-relaxed max-w-sm font-medium">{message}</p>
          
          {/* Progress bar for loading */}
          {status === 'loading' && (
            <div className="w-full max-w-sm mb-8">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full animate-pulse transition-all duration-1000" 
                     style={{ width: '70%' }} />
              </div>
            </div>
          )}
          
          {status !== 'loading' && (
            <button
              onClick={onClose}
              className="px-10 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 font-semibold text-lg shadow-lg transform hover:scale-105 active:scale-95"
            >
              Continue
            </button>
          )}
        </div>

        {/* Animated border for loading state */}
        {status === 'loading' && (
          <div className="absolute inset-0 rounded-2xl">
            <div className="absolute inset-0 rounded-2xl border-2 border-blue-300 animate-ping opacity-30" />
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionOverlay;