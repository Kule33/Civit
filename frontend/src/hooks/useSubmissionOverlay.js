// src/hooks/useSubmissionOverlay.js
import { useState, useCallback } from 'react';

export const useSubmissionOverlay = () => {
  const [overlayState, setOverlayState] = useState({
    isVisible: false,
    status: 'loading', // 'loading', 'success', 'error'
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

  return {
    overlayState,
    showOverlay,
    hideOverlay,
    updateOverlay
  };
};