// src/context/SubmissionProvider.jsx
import React, { useState, useCallback } from 'react';
import SubmissionContext from './SubmissionContext';
import SubmissionOverlay from '../components/SubmissionOverlay';

export const SubmissionProvider = ({ children }) => {
  const [overlayState, setOverlayState] = useState({
    isVisible: false,
    status: 'loading',
    message: 'Processing your request...',
    autoClose: true,
    autoCloseDelay: 3000
  });

  const showOverlay = useCallback((options = {}) => {
    setOverlayState(prev => ({
      ...prev,
      isVisible: true,
      status: options.status || 'loading',
      message: options.message || 'Processing your request...',
      autoClose: options.autoClose !== undefined ? options.autoClose : true,
      autoCloseDelay: options.autoCloseDelay || 3000
    }));
  }, []);

  const hideOverlay = useCallback(() => {
    setOverlayState(prev => ({ ...prev, isVisible: false }));
  }, []);

  const updateOverlay = useCallback((options) => {
    setOverlayState(prev => ({ ...prev, ...options }));
  }, []);

  const value = {
    overlayState,
    showOverlay,
    hideOverlay,
    updateOverlay
  };

  return (
    <SubmissionContext.Provider value={value}>
      {children}
      <SubmissionOverlay
        isVisible={overlayState.isVisible}
        status={overlayState.status}
        message={overlayState.message}
        onClose={hideOverlay}
        autoClose={overlayState.autoClose}
        autoCloseDelay={overlayState.autoCloseDelay}
      />
    </SubmissionContext.Provider>
  );
};

export default SubmissionProvider;