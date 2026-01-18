// src/context/SubmissionProvider.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SubmissionContext from './SubmissionContext';
import SubmissionOverlay from '../components/SubmissionOverlay';
import { useAuth } from './AuthProvider';

export const SubmissionProvider = ({ children }) => {
  const { user } = useAuth();
  const previousUserIdRef = useRef(null);

  const [overlayState, setOverlayState] = useState({
    isVisible: false,
    status: 'loading',
    message: 'Processing your request...',
    autoClose: true,
    autoCloseDelay: 3000
  });

  const defaultPaperBuilderState = useMemo(
    () => ({
      questions: [],
      searchPerformed: false,
      metadata: { country: 'sri_lanka' },
      selectedQuestionIds: [],
      selectedQuestionsOrdered: [],
      questionComments: {}
    }),
    []
  );

  const defaultManageQuestionsState = useMemo(
    () => ({
      activeTab: 'questions',
      questions: [],
      typesets: [],
      typesetRequests: []
    }),
    []
  );

  const defaultTypesetBuilderState = useMemo(
    () => ({
      searchQuery: '',
      allQuestions: [],
      filteredQuestions: [],
      selectedFiles: [],
      currentPage: 1
    }),
    []
  );

  const defaultDashboardState = useMemo(
    () => ({
      questions: [],
      typesets: [],
      paperAnalytics: null,
      papers: [],
      markings: [],
      totalUsers: 0,
      loaded: false
    }),
    []
  );

  const defaultUsersAdminState = useMemo(
    () => ({
      profiles: [],
      searchTerm: '',
      districtFilter: '',
      genderFilter: '',
      roleFilter: '',
      currentPage: 1,
      loaded: false
    }),
    []
  );

  // In-memory only: survives route changes, but resets on refresh.
  const [paperBuilder, setPaperBuilder] = useState(defaultPaperBuilderState);
  const [manageQuestions, setManageQuestions] = useState(defaultManageQuestionsState);
  const [typesetBuilder, setTypesetBuilder] = useState(defaultTypesetBuilderState);
  const [dashboard, setDashboard] = useState(defaultDashboardState);
  const [usersAdmin, setUsersAdmin] = useState(defaultUsersAdminState);

  // Clear PaperBuilder state when user logs out OR switches accounts
  useEffect(() => {
    const currentUserId = user?.id || null;
    const previousUserId = previousUserIdRef.current;
    previousUserIdRef.current = currentUserId;

    if (previousUserId !== currentUserId) {
      setPaperBuilder(defaultPaperBuilderState);
      setManageQuestions(defaultManageQuestionsState);
      setTypesetBuilder(defaultTypesetBuilderState);
      setDashboard(defaultDashboardState);
      setUsersAdmin(defaultUsersAdminState);
    }
  }, [user?.id, defaultPaperBuilderState, defaultManageQuestionsState, defaultTypesetBuilderState, defaultDashboardState, defaultUsersAdminState]);

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

  const setPaperBuilderQuestions = useCallback((questions) => {
    setPaperBuilder(prev => ({
      ...prev,
      questions: Array.isArray(questions) ? questions : []
    }));
  }, []);

  const setPaperBuilderSearchPerformed = useCallback((performed) => {
    setPaperBuilder(prev => ({
      ...prev,
      searchPerformed: !!performed
    }));
  }, []);

  const setPaperBuilderMetadata = useCallback((metadata) => {
    setPaperBuilder(prev => ({
      ...prev,
      metadata: metadata && typeof metadata === 'object' ? metadata : { country: 'sri_lanka' }
    }));
  }, []);

  const setSelectedQuestionIds = useCallback((updater) => {
    setPaperBuilder(prev => {
      const nextIds = typeof updater === 'function' ? updater(prev.selectedQuestionIds) : updater;
      return { ...prev, selectedQuestionIds: Array.isArray(nextIds) ? nextIds : [] };
    });
  }, []);

  const setSelectedQuestionsOrdered = useCallback((updater) => {
    setPaperBuilder(prev => {
      const nextOrdered = typeof updater === 'function' ? updater(prev.selectedQuestionsOrdered) : updater;
      return { ...prev, selectedQuestionsOrdered: Array.isArray(nextOrdered) ? nextOrdered : [] };
    });
  }, []);

  const setPaperBuilderQuestionComments = useCallback((updater) => {
    setPaperBuilder(prev => {
      const nextComments = typeof updater === 'function' ? updater(prev.questionComments) : updater;
      return { ...prev, questionComments: nextComments && typeof nextComments === 'object' ? nextComments : {} };
    });
  }, []);

  const clearPaperBuilderState = useCallback(() => {
    setPaperBuilder(defaultPaperBuilderState);
  }, [defaultPaperBuilderState]);

  const setManageQuestionsState = useCallback((updater) => {
    setManageQuestions(prev => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  const clearManageQuestionsState = useCallback(() => {
    setManageQuestions(defaultManageQuestionsState);
  }, [defaultManageQuestionsState]);

  const setTypesetBuilderState = useCallback((updater) => {
    setTypesetBuilder(prev => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  const clearTypesetBuilderState = useCallback(() => {
    setTypesetBuilder(defaultTypesetBuilderState);
  }, [defaultTypesetBuilderState]);

  const setDashboardState = useCallback((updater) => {
    setDashboard(prev => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  const clearDashboardState = useCallback(() => {
    setDashboard(defaultDashboardState);
  }, [defaultDashboardState]);

  const setUsersAdminState = useCallback((updater) => {
    setUsersAdmin(prev => (typeof updater === 'function' ? updater(prev) : updater));
  }, []);

  const clearUsersAdminState = useCallback(() => {
    setUsersAdmin(defaultUsersAdminState);
  }, [defaultUsersAdminState]);

  const value = useMemo(
    () => ({
      overlayState,
      showOverlay,
      hideOverlay,
      updateOverlay,
      paperBuilder,
      setPaperBuilderQuestions,
      setPaperBuilderSearchPerformed,
      setPaperBuilderMetadata,
      setSelectedQuestionIds,
      setSelectedQuestionsOrdered,
      setPaperBuilderQuestionComments,
      clearPaperBuilderState,
      manageQuestions,
      setManageQuestionsState,
      clearManageQuestionsState,
      typesetBuilder,
      setTypesetBuilderState,
      clearTypesetBuilderState,
      dashboard,
      setDashboardState,
      clearDashboardState,
      usersAdmin,
      setUsersAdminState,
      clearUsersAdminState
    }),
    [
      overlayState,
      showOverlay,
      hideOverlay,
      updateOverlay,
      paperBuilder,
      setPaperBuilderQuestions,
      setPaperBuilderSearchPerformed,
      setPaperBuilderMetadata,
      setSelectedQuestionIds,
      setSelectedQuestionsOrdered,
      setPaperBuilderQuestionComments,
      clearPaperBuilderState,
      manageQuestions,
      setManageQuestionsState,
      clearManageQuestionsState,
      typesetBuilder,
      setTypesetBuilderState,
      clearTypesetBuilderState,
      dashboard,
      setDashboardState,
      clearDashboardState,
      usersAdmin,
      setUsersAdminState,
      clearUsersAdminState
    ]
  );

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