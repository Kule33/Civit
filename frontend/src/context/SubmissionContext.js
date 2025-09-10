// src/context/SubmissionContext.js
import { createContext, useContext } from 'react';

const SubmissionContext = createContext();

export const useSubmission = () => {
  const context = useContext(SubmissionContext);
  if (!context) {
    throw new Error('useSubmission must be used within a SubmissionProvider');
  }
  return context;
};

export default SubmissionContext;