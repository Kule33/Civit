import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, Download, ChevronUp, ChevronDown, Menu, FileText, GripVertical, MessageSquare } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import InputField from '../../components/ui/InputField.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import SearchableSelect from '../../components/ui/SearchableSelect.jsx';
import QuestionCard from '../../components/QuestionCard.jsx';
import SelectedQuestionsSidebar from '../../components/SelectedQuestionsSidebar.jsx';
import { TypesetRequestModal } from '../../components/Paper-builder/TypesetRequestModal.jsx';
import { useSubmission } from '../../context/SubmissionContext';
import { useMetadata } from '../../hooks/useMetadata.js';
import { useAdvancedPaperGeneration } from '../../hooks/useAdvancedPaperGeneration.jsx';
import { useTypesetRequests } from '../../hooks/useTypesetRequests.js';
import { getSubjectName } from '../../utils/subjectMapping.js';
// Updated import to use the service function
import { searchQuestions, logPaperGeneration } from '../../services/questionService.js';
import { savePdfToTemp } from '../../services/typesetRequestService.js';

const PaperBuilder = () => {
  // Core state management for questions and UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFiltersMinimized, setIsFiltersMinimized] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isViewingSelectedQuestions, setIsViewingSelectedQuestions] = useState(false);
  const [draggedQuestionIndex, setDraggedQuestionIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  
  // Floating button state for mobile
  const [floatingButtonPosition, setFloatingButtonPosition] = useState({ x: window.innerWidth - 80, y: window.innerHeight - 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  
  // Typeset request state
  const [showTypesetModal, setShowTypesetModal] = useState(false);
  const [lastGeneratedPaper, setLastGeneratedPaper] = useState(null);

  const {
    showOverlay,
    paperBuilder,
    setPaperBuilderQuestions,
    setPaperBuilderSearchPerformed,
    setPaperBuilderMetadata,
    setSelectedQuestionIds,
    setSelectedQuestionsOrdered,
    setPaperBuilderQuestionComments,
    clearPaperBuilderState
  } = useSubmission();

  const questions = useMemo(
    () => paperBuilder?.questions ?? [],
    [paperBuilder?.questions]
  );

  const selectedQuestions = useMemo(
    () => paperBuilder?.selectedQuestionIds ?? [],
    [paperBuilder?.selectedQuestionIds]
  );

  const selectedQuestionsOrdered = useMemo(
    () => paperBuilder?.selectedQuestionsOrdered ?? [],
    [paperBuilder?.selectedQuestionsOrdered]
  );
  const searchPerformed = !!paperBuilder?.searchPerformed;
  const questionComments = paperBuilder?.questionComments || {};
  
  // Advanced PDF generation hook
  const { generatePDF } = useAdvancedPaperGeneration();
  
  // Typeset requests hook
  const { createRequest, creating } = useTypesetRequests();

  // Sync selectedQuestionsOrdered when questions change (e.g., after new search)
  useEffect(() => {
    // Filter out any selected questions that are no longer in the current questions list
    setSelectedQuestionsOrdered(prevOrdered =>
      prevOrdered.filter(selectedQ =>
        questions.some(currentQ => currentQ.id === selectedQ.id)
      )
    );

    // Also update selectedQuestions to remove any IDs that no longer exist
    setSelectedQuestionIds(prevSelected =>
      prevSelected.filter(id =>
        questions.some(q => q.id === id)
      )
    );
  }, [questions, setSelectedQuestionIds, setSelectedQuestionsOrdered]);

  const {
    metadata,
    availableOptions,
    updateMetadata,
    loading: metadataLoading,
    resetMetadata
  } = useMetadata(paperBuilder?.metadata || {
    country: 'sri_lanka'  // Default to Sri Lanka
  });

  // Persist current filters in-memory so they restore when returning to the page
  useEffect(() => {
    setPaperBuilderMetadata(metadata);
  }, [metadata, setPaperBuilderMetadata]);

  // Set country to Sri Lanka by default on component mount
  useEffect(() => {
    if (!metadata.country) {
      updateMetadata('country', 'sri_lanka');
    }
  }, [metadata.country, updateMetadata]);

  const handleFilterChange = (field, value) => {
    updateMetadata(field, value);
  };

  // Updated handleSearch function to use searchQuestions service
  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query parameters from current metadata
      const params = new URLSearchParams();
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (key === 'subject') {
            const subjectName = getSubjectName(value);
            params.append(key, subjectName);
          } else if (key === 'country') {
            // Convert country value to database format
            const countryName = value === 'sri_lanka' ? 'Sri Lanka' : value;
            params.append(key, countryName);
          } else {
            params.append(key, value);
          }
        }
      });

      console.log('🔍 Search Parameters:', Object.fromEntries(params));
      console.log('🔍 Searching with URL:', `/api/questions?${params.toString()}`);

      // Use searchQuestions instead of direct axios
      const data = await searchQuestions(params);
      console.log('✅ Search results received:', data?.length || 0, 'questions');
      setPaperBuilderQuestions(Array.isArray(data) ? data : []);
      setPaperBuilderSearchPerformed(true);
    } catch (error) {
      const errorMessage = error.response?.data?.title || error.message || 'Failed to fetch questions. Please try again.';
      setError(errorMessage);
      setPaperBuilderQuestions([]);
      setPaperBuilderSearchPerformed(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles selecting/deselecting a question
   * Updates both the simple selected array and the ordered questions array
   * @param {string|number} questionId - ID of the question to select/deselect
   */
  const handleQuestionSelect = useCallback((questionId) => {
    setSelectedQuestionIds(prev => {
      if (prev.includes(questionId)) {
        // Remove from selected questions
        const newSelected = prev.filter(id => id !== questionId);
        return newSelected;
      } else {
        // Add to selected questions
        const newSelected = [...prev, questionId];
        return newSelected;
      }
    });

    // Update ordered questions separately to avoid race conditions
    setSelectedQuestionsOrdered(prevOrdered => {
      if (prevOrdered.some(q => q.id === questionId)) {
        // Remove from ordered questions
        return prevOrdered.filter(q => q.id !== questionId);
      } else {
        // Add to ordered questions
        const question = questions.find(q => q.id === questionId);
        if (question) {
          return [...prevOrdered, question];
        }
        return prevOrdered;
      }
    });
  }, [questions, setSelectedQuestionIds, setSelectedQuestionsOrdered]);


  /**
   * Handles selecting/deselecting all questions
   * Updates both the simple selected array and the ordered questions array
   */
  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      // Deselect all
      setSelectedQuestionIds([]);
      setSelectedQuestionsOrdered([]);
    } else {
      // Select all
      setSelectedQuestionIds(questions.map(q => q.id));
      setSelectedQuestionsOrdered([...questions]);
    }
  };

  /**
   * Clears all filters and resets the component state
   */
  const handleClearFilters = () => {
    resetMetadata();
    clearPaperBuilderState();
    setError('');
  };

  /**
   * Handles floating button drag start
   */
  const handleDragStart = useCallback((e) => {
    const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setDragStartPosition({ x: clientX, y: clientY });
    setDragOffset({
      x: clientX - floatingButtonPosition.x,
      y: clientY - floatingButtonPosition.y
    });
  }, [floatingButtonPosition]);

  /**
   * Handles floating button drag
   */
  const handleDrag = useCallback((e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    
    const buttonSize = 64; // Size of the button (w-16 h-16)
    const newX = Math.max(0, Math.min(clientX - dragOffset.x, window.innerWidth - buttonSize));
    const newY = Math.max(0, Math.min(clientY - dragOffset.y, window.innerHeight - buttonSize));
    
    setFloatingButtonPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset]);

  /**
   * Handles floating button drag end
   */
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add drag event listeners for floating button
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('touchend', handleDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDrag);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  /**
   * Handles PDF generation and download
   * Uses the ordered questions from the sidebar for proper sequencing
   * @param {Array} orderedQuestions - Array of questions in the order they should appear in the PDF
   */
  const handleDownloadPaper = async (orderedQuestions = selectedQuestionsOrdered) => {
    if (orderedQuestions.length === 0) {
      showOverlay({
        status: 'error',
        message: 'Please select at least one question to download',
        autoClose: true,
        autoCloseDelay: 3000
      });
      return;
    }

    try {
      // Add comments to questions before generating PDF
      const questionsWithComments = orderedQuestions.map(q => ({
        ...q,
        comment: questionComments[q.id] || ''
      }));

      const pdfData = await generatePDF(
        questionsWithComments,
        // Success callback
        async (filename, questionCount) => {
          showOverlay({
            status: 'success',
            message: `Successfully downloaded ${filename} with ${questionCount} questions`,
            autoClose: true,
            autoCloseDelay: 3000
          });

          // Reset builder state after a successful download
          clearPaperBuilderState();
          setIsViewingSelectedQuestions(false);

          // Log paper generation for analytics (non-blocking)
          try {
            const questionIds = questionsWithComments.map(q => q.id);
            await logPaperGeneration(questionIds, filename);
          } catch (logError) {
            console.error('Failed to log paper generation:', logError);
            // Don't show error to user - logging is not critical
          }
        },
        // Error callback
        (errorMessage) => {
          showOverlay({
            status: 'error',
            message: `Failed to generate PDF: ${errorMessage}`,
            autoClose: true,
            autoCloseDelay: 5000
          });
        }
      );

      // After successful PDF generation, save to temp storage and prepare for typeset request
      if (pdfData && pdfData.pdfBlob) {
        try {
          // Convert blob to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64data = reader.result.split(',')[1];
            
            try {
              // Save PDF to temp storage on backend
              const tempResult = await savePdfToTemp({
                pdfBase64: base64data,
                fileName: pdfData.fileName,
                paperMetadata: JSON.stringify(pdfData.paperMetadata)
              });

              // Store the generated paper data for typeset modal
              setLastGeneratedPaper({
                tempFilePath: tempResult.tempFilePath,
                fileName: tempResult.fileName,
                metadata: pdfData.paperMetadata
              });

              // Show success message and automatically open typeset modal
              setTimeout(() => {
                showOverlay({
                  status: 'success',
                  message: 'PDF downloaded successfully! Opening typeset request form...',
                  autoClose: true,
                  autoCloseDelay: 2000
                });
                
                // Automatically open the typeset modal after a short delay
                setTimeout(() => {
                  setShowTypesetModal(true);
                }, 2000);
              }, 500);
            } catch (tempError) {
              console.error('Failed to save temp file:', tempError);
              // Still allow user to manually open typeset modal if needed
            }
          };
          reader.readAsDataURL(pdfData.pdfBlob);
        } catch (conversionError) {
          console.error('Failed to convert PDF to base64:', conversionError);
        }
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      showOverlay({
        status: 'error',
        message: 'An unexpected error occurred while generating the PDF',
        autoClose: true,
        autoCloseDelay: 5000
      });
    }
  };

  /**
   * Handles typeset request submission
   * @param {Object} requestData - The typeset request data
   */
  const handleTypesetSubmit = async (requestData) => {
    try {
      await createRequest(requestData);
      setShowTypesetModal(false);
      showOverlay({
        status: 'success',
        message: 'Typeset request submitted successfully! Check your profile to track the status.',
        autoClose: true,
        autoCloseDelay: 5000
      });
    } catch (error) {
      showOverlay({
        status: 'error',
        message: error.message || 'Failed to submit typeset request',
        autoClose: true,
        autoCloseDelay: 5000
      });
    }
  };

  const getFilteredQuestionsCount = () => {
    return questions.length;
  };

  const getSelectedQuestionsCount = () => {
    return selectedQuestions.length;
  };

  /**
   * Memoized question cards to prevent unnecessary re-renders
   * Only re-renders when questions or selectedQuestions change
   */
  const memoizedQuestionCards = useMemo(() => {
    return questions.map((question) => (
      <QuestionCard
        key={question.id}
        question={question}
        isSelected={selectedQuestions.includes(question.id)}
        onSelect={handleQuestionSelect}
        variant="grid"
      />
    ));
  }, [questions, selectedQuestions, handleQuestionSelect]);

  /**
   * Handles toggling sidebar collapse state (for mobile)
   */
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  /**
   * Handles viewing selected questions (collapses search results)
   */
  const handleViewSelectedQuestions = () => {
    setIsViewingSelectedQuestions(true);
  };

  /**
   * Handles going back to search results
   */
  const handleBackToSearch = () => {
    setIsViewingSelectedQuestions(false);
  };

  /**
   * Handles updating comment for a specific question
   * @param {string|number} questionId - ID of the question
   * @param {string} comment - Comment text
   */
  const handleCommentChange = (questionId, comment) => {
    setPaperBuilderQuestionComments(prev => ({
      ...prev,
      [questionId]: comment
    }));
  };

  /**
   * Handles moving a question up in the order
   * @param {number} index - Current index of the question
   */
  const handleMoveQuestionUp = (index) => {
    if (index > 0) {
      const newOrderedQuestions = [...selectedQuestionsOrdered];
      [newOrderedQuestions[index - 1], newOrderedQuestions[index]] = [newOrderedQuestions[index], newOrderedQuestions[index - 1]];
      setSelectedQuestionsOrdered(newOrderedQuestions);
    }
  };

  /**
   * Handles moving a question down in the order
   * @param {number} index - Current index of the question
   */
  const handleMoveQuestionDown = (index) => {
    if (index < selectedQuestionsOrdered.length - 1) {
      const newOrderedQuestions = [...selectedQuestionsOrdered];
      [newOrderedQuestions[index], newOrderedQuestions[index + 1]] = [newOrderedQuestions[index + 1], newOrderedQuestions[index]];
      setSelectedQuestionsOrdered(newOrderedQuestions);
    }
  };

  /**
   * Handles drag and drop reordering
   * @param {number} draggedIndex - Index of the dragged item
   * @param {number} dropIndex - Index where the item is dropped
   */
  const handleDragReorder = (draggedIndex, dropIndex) => {
    if (draggedIndex !== dropIndex) {
      const newOrderedQuestions = [...selectedQuestionsOrdered];
      const [draggedQuestion] = newOrderedQuestions.splice(draggedIndex, 1);
      newOrderedQuestions.splice(dropIndex, 0, draggedQuestion);
      setSelectedQuestionsOrdered(newOrderedQuestions);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Paper Builder"
        subtitle="Search for questions and build custom papers"
        actions={
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              icon={Filter}
              onClick={() => setIsFiltersMinimized(!isFiltersMinimized)}
            >
              {isFiltersMinimized ? 'Show Filters' : 'Hide Filters'}
            </Button>
          </div>
        }
      />

      {/* Top navbar-style filters using metadata hook */}
      <Card>
        {/* Country Info Banner */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">📍 Searching in:</span> Sri Lanka (Default)
          </p>
        </div>

        {/* Filters in compact grid layout */}
        <div className="space-y-4">
          {/* Row 1: Primary Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Exam Type */}
            <SelectField
              label="Exam Type *"
              value={metadata.examType}
              onChange={(e) => handleFilterChange('examType', e.target.value)}
              options={[
                { value: '', label: 'Select Exam Type' },
                ...(availableOptions.examTypes || [])
              ]}
              required
            />

            {/* Stream Selection (visible for all, enabled only for A/L) */}
            <SelectField
              label="Stream"
              value={metadata.stream}
              onChange={(e) => handleFilterChange('stream', e.target.value)}
              options={[
                { value: '', label: metadata.examType === 'a_level' ? 'Select Stream' : 'N/A for this exam' },
                ...(availableOptions.streams || [])
              ]}
              disabled={metadata.examType !== 'a_level'}
            />

            {/* Subject Selection */}
            <SelectField
              label="Subject"
              value={metadata.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              options={[
                { value: '', label: metadata.examType === 'grade5' ? 'N/A for Grade 5' : 'All Subjects' },
                ...(availableOptions.subjects || [])
              ]}
              disabled={!metadata.examType || metadata.examType === 'grade5' || (metadata.examType === 'a_level' && !metadata.stream)}
            />

            {/* Paper Category */}
            <SelectField
              label="Paper Category *"
              value={metadata.paperCategory}
              onChange={(e) => handleFilterChange('paperCategory', e.target.value)}
              options={[
                { value: '', label: 'All Categories' },
                { value: 'Model', label: 'Model Paper' },
                { value: 'PastPaper', label: 'Past Paper' },
                { value: 'TermTest', label: 'Term Test' }
              ]}
            />
          </div>

          {/* Row 2: Secondary Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Paper Type */}
            <SelectField
              label="Paper Type"
              value={metadata.paperType}
              onChange={(e) => handleFilterChange('paperType', e.target.value)}
              options={[
                { value: '', label: 'All Paper Types' },
                ...(availableOptions.paperTypes || [])
              ]}
              disabled={!(['physics', 'chemistry', 'biology'].includes(metadata.subject) || metadata.examType === 'grade5')}
            />

            {/* Year */}
            <InputField
              label="Year"
              type="number"
              min="2000"
              max="2030"
              value={metadata.year || ''}
              onChange={(e) => handleFilterChange('year', e.target.value ? parseInt(e.target.value) : null)}
              placeholder={metadata.paperCategory === 'PastPaper' ? 'Enter Year' : 'Only for Past Papers'}
              disabled={metadata.paperCategory !== 'PastPaper'}
            />

            {/* Term */}
            <SelectField
              label="Term"
              value={metadata.term}
              onChange={(e) => handleFilterChange('term', e.target.value)}
              options={[
                { value: '', label: metadata.paperCategory === 'TermTest' ? 'All Terms' : 'Only for Term Tests' },
                { value: 'Term1', label: 'Term 1' },
                { value: 'Term2', label: 'Term 2' },
                { value: 'Term3', label: 'Term 3' }
              ]}
              disabled={metadata.paperCategory !== 'TermTest'}
            />

            {/* School */}
            <SearchableSelect
              label="School"
              value={metadata.schoolName}
              onChange={(e) => handleFilterChange('schoolName', e.target.value)}
              options={[
                { value: '', label: metadata.paperCategory === 'TermTest' ? 'All Schools' : 'Only for Term Tests' },
                ...(availableOptions.schools?.map(school => ({ value: school.name, label: school.name })) || [])
              ]}
              placeholder={metadata.paperCategory === 'TermTest' ? 'Search schools...' : 'N/A'}
              disabled={metadata.paperCategory !== 'TermTest'}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Clear Filters
            </Button>
            <Button
              variant="primary"
              onClick={handleSearch}
              disabled={loading || metadataLoading || !metadata.examType}
              icon={Search}
            >
              {loading ? 'Searching...' : 'Search Questions'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Main content area with sidebar */}
      <div className="flex h-[calc(100vh-200px)] gap-6">
        {/* Results Panel */}
        <div className="flex-1 overflow-hidden">
          <Card className="h-full flex flex-col">
            {isViewingSelectedQuestions ? (
              /* Selected Questions View */
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 p-4 sm:p-6 pb-0">
                  <h2 className="text-lg font-semibold">Selected Questions ({selectedQuestionsOrdered.length})</h2>
                  <Button
                    variant="outline"
                    onClick={handleBackToSearch}
                    icon={Search}
                    className="w-full sm:w-auto"
                  >
                    Back to Search
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-0">
                  {selectedQuestionsOrdered.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Selected</h3>
                      <p className="text-gray-600">
                        Go back to search and select some questions to build your paper.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedQuestionsOrdered.map((question, index) => (
                        <div 
                          key={question.id} 
                          className={`border rounded-lg p-3 sm:p-4 bg-white transition-all ${
                            draggedQuestionIndex === index 
                              ? 'opacity-50 border-blue-400' 
                              : dragOverIndex === index 
                              ? 'border-blue-500 border-2 shadow-lg' 
                              : 'border-gray-200 hover:shadow-md'
                          }`}
                          draggable
                          onDragStart={(e) => {
                            setDraggedQuestionIndex(index);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', index.toString());
                          }}
                          onDragEnd={() => {
                            setDraggedQuestionIndex(null);
                            setDragOverIndex(null);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverIndex !== index) {
                              setDragOverIndex(index);
                            }
                          }}
                          onDragLeave={() => {
                            setDragOverIndex(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                            handleDragReorder(draggedIndex, index);
                            setDraggedQuestionIndex(null);
                            setDragOverIndex(null);
                          }}
                        >
                          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                            {/* Drag handle and question number */}
                            <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto">
                              <div className="bg-gray-100 p-1 rounded cursor-move">
                                <GripVertical className="h-4 w-4 text-gray-500" />
                              </div>
                              <div className="bg-blue-500 text-white text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                                {index + 1}
                              </div>
                            </div>
                            
                            {/* Question image */}
                            <div className="flex-shrink-0 w-full sm:w-auto">
                              <img
                                src={question.fileUrl || "/placeholder.svg"}
                                alt={question.subject?.name || 'Question'}
                                className="w-full sm:w-20 h-32 sm:h-20 object-cover rounded-md"
                              />
                            </div>
                            
                            {/* Question content */}
                            <div className="flex-1 min-w-0 w-full">
                              <h3 className="font-medium text-sm text-gray-900 mb-2">
                                {question.subject?.name || 'Unknown Subject'}
                              </h3>
                              <div className="flex flex-wrap gap-1 text-xs text-gray-600 mb-3">
                                {question.country && (
                                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                                    {question.country}
                                  </span>
                                )}
                                {question.examType && (
                                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                                    {question.examType}
                                  </span>
                                )}
                                {question.paperCategory && (
                                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                                    {question.paperCategory}
                                  </span>
                                )}
                                {question.year && (
                                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                                    {question.year}
                                  </span>
                                )}
                                {question.term && (
                                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                                    {question.term}
                                  </span>
                                )}
                              </div>

                              {/* Comment section */}
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4 text-gray-500" />
                                  <label className="text-xs font-medium text-gray-700">Add Comment:</label>
                                </div>
                                <textarea
                                  value={questionComments[question.id] || ''}
                                  onChange={(e) => handleCommentChange(question.id, e.target.value)}
                                  placeholder="Add your comment for this question..."
                                  className="w-full text-xs p-2 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  rows={2}
                                />
                              </div>
                            </div>

                            {/* Reorder buttons */}
                            <div className="flex sm:flex-col flex-row gap-2 sm:gap-1 w-full sm:w-auto justify-end sm:justify-start">
                              <button
                                onClick={() => handleMoveQuestionUp(index)}
                                disabled={index === 0}
                                className="p-1 sm:h-6 sm:w-6 h-8 w-8 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                title="Move up"
                              >
                                <ChevronUp className="h-4 w-4 sm:h-3 sm:w-3" />
                              </button>
                              <button
                                onClick={() => handleMoveQuestionDown(index)}
                                disabled={index === selectedQuestionsOrdered.length - 1}
                                className="p-1 sm:h-6 sm:w-6 h-8 w-8 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                title="Move down"
                              >
                                <ChevronDown className="h-4 w-4 sm:h-3 sm:w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Download button for mobile at the bottom */}
                {selectedQuestionsOrdered.length > 0 && (
                  <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 lg:hidden">
                    <Button
                      variant="primary"
                      onClick={() => handleDownloadPaper(selectedQuestionsOrdered)}
                      icon={Download}
                      className="w-full"
                    >
                      Download Paper ({selectedQuestionsOrdered.length} questions)
                    </Button>
                  </div>
                )}
              </>
            ) : (
              /* Search Results View */
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 p-4 sm:p-6 pb-0">
                  <h2 className="text-lg font-semibold">Search Results</h2>

                  {searchPerformed && questions.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                      <span className="text-sm text-gray-600">
                        {getFilteredQuestionsCount()} questions found • {getSelectedQuestionsCount()} selected
                      </span>
                      <Button
                        variant="primary"
                        onClick={handleSelectAll}
                        size="small"
                        className="w-full sm:w-auto"
                      >
                        {selectedQuestions.length === questions.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Error display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4 mb-3 sm:mb-4 mx-4 sm:mx-6">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto px-3 py-4 sm:p-6 sm:pt-0">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Searching for questions...</p>
                    </div>
                  ) : searchPerformed && questions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No questions found matching your criteria.</p>
                      <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or search terms.</p>
                    </div>
                  ) : questions.length > 0 ? (
                    <div className="space-y-3">
                      {memoizedQuestionCards}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Start Searching</h3>
                      <p className="text-gray-600">
                        Use the filters above to search for questions and build your custom paper.
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>

        {/* Selected Questions Sidebar */}
        <div className={`hidden lg:block ${isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-96'}`}>
          <SelectedQuestionsSidebar
            selectedQuestionsOrdered={selectedQuestionsOrdered}
            setSelectedQuestionsOrdered={setSelectedQuestionsOrdered}
            onDownloadPaper={handleDownloadPaper}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
            onViewSelectedQuestions={handleViewSelectedQuestions}
            questionComments={questionComments}
            onCommentChange={handleCommentChange}
          />
        </div>
      </div>

      {/* Floating Download Button - iPhone Assistive Touch Style */}
      {selectedQuestions.length > 0 && (
        <button
          className="fixed z-50 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center cursor-move transition-all duration-200 active:scale-95"
          style={{
            left: `${floatingButtonPosition.x}px`,
            top: `${floatingButtonPosition.y}px`,
            touchAction: 'none',
            boxShadow: '0 8px 16px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onClick={(e) => {
            // Calculate distance moved to determine if it's a click or drag
            const distanceMoved = Math.sqrt(
              Math.pow(e.clientX - dragStartPosition.x, 2) +
              Math.pow(e.clientY - dragStartPosition.y, 2)
            );
            
            // Only trigger view if moved less than 5 pixels (threshold for click vs drag)
            if (distanceMoved < 5) {
              setIsViewingSelectedQuestions(true);
            }
          }}
        >
          <div className="relative">
            <FileText className="h-7 w-7" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold border-2 border-white">
              {selectedQuestions.length}
            </span>
          </div>
        </button>
      )}

      {/* Typeset Request Modal */}
      <TypesetRequestModal
        isOpen={showTypesetModal}
        onClose={() => setShowTypesetModal(false)}
        onSubmit={handleTypesetSubmit}
        paperMetadata={lastGeneratedPaper?.metadata}
        tempFilePath={lastGeneratedPaper?.tempFilePath}
        isSubmitting={creating}
      />
    </div>
  );
};

export default PaperBuilder;