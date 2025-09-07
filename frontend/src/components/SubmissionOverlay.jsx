// src/components/SubmissionOverlay.jsx
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
          icon: <Loader className="animate-spin h-12 w-12 text-blue-500" />,
          bgColor: 'bg-white',
          textColor: 'text-gray-800'
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          bgColor: 'bg-white',
          textColor: 'text-gray-800'
        };
      case 'error':
        return {
          icon: <XCircle className="h-12 w-12 text-red-500" />,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div className={`${config.bgColor} rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 scale-95 hover:scale-100`}>
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-4">
            {config.icon}
          </div>
          
          <h3 className={`text-xl font-semibold mb-2 ${config.textColor}`}>
            {status === 'loading' ? 'Processing...' : status === 'success' ? 'Success!' : 'Error!'}
          </h3>
          
          <p className="text-gray-600 mb-6">{message}</p>
          
          {status !== 'loading' && (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionOverlay;