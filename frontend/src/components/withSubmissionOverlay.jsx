// src/components/withSubmissionOverlay.jsx
import React from 'react';
import SubmissionOverlay from './SubmissionOverlay';
import { useSubmission } from '../context/SubmissionContext';

export const withSubmissionOverlay = (WrappedComponent) => {
  return (props) => {
    const { overlayState, hideOverlay } = useSubmission();
    
    return (
      <>
        <WrappedComponent {...props} />
        <SubmissionOverlay
          isVisible={overlayState.isVisible}
          status={overlayState.status}
          message={overlayState.message}
          onClose={hideOverlay}
          autoClose={overlayState.autoClose}
          autoCloseDelay={overlayState.autoCloseDelay}
        />
      </>
    );
  };
};