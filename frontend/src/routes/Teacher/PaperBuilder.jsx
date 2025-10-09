import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, ChevronUp, ChevronDown, Menu, FileText, GripVertical, MessageSquare } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import InputField from '../../components/ui/InputField.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import SearchableSelect from '../../components/ui/SearchableSelect.jsx';
import QuestionCard from '../../components/QuestionCard.jsx';
import SelectedQuestionsSidebar from '../../components/SelectedQuestionsSidebar.jsx';
import { useSubmission } from '../../context/SubmissionContext';
import { useMetadata } from '../../hooks/useMetadata.js';
import { useAdvancedPaperGeneration } from '../../hooks/useAdvancedPaperGeneration.jsx';
import { getSubjectName } from '../../utils/subjectMapping.js';
// Updated import to use the service function
import { searchQuestions, logPaperGeneration } from '../../services/questionService.js';

const PaperBuilder = () => {
  // Core state management for questions and UI
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [selectedQuestionsOrdered, setSelectedQuestionsOrdered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isFiltersMinimized, setIsFiltersMinimized] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isViewingSelectedQuestions, setIsViewingSelectedQuestions] = useState(false);
  const [questionComments, setQuestionComments] = useState({});

  const { showOverlay } = useSubmission();
  
  // Advanced PDF generation hook
  const { generatePDF } = useAdvancedPaperGeneration();

  // Sync selectedQuestionsOrdered when questions change (e.g., after new search)
  useEffect(() => {
    // Filter out any selected questions that are no longer in the current questions list
    setSelectedQuestionsOrdered(prevOrdered => 
      prevOrdered.filter(selectedQ => 
        questions.some(currentQ => currentQ.id === selectedQ.id)
      )
    );
    
    // Also update selectedQuestions to remove any IDs that no longer exist
    setSelectedQuestions(prevSelected => 
      prevSelected.filter(id => 
        questions.some(q => q.id === id)
      )
    );
  }, [questions]);

  // Use the same metadata hook as QuestionUpload - with Sri Lanka as default
  const {
    metadata,
    availableOptions,
    updateMetadata,
    loading: metadataLoading,
    resetMetadata
  } = useMetadata({
    country: 'sri_lanka'  // Default to Sri Lanka
  });

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
      setQuestions(Array.isArray(data) ? data : []);
      setSearchPerformed(true);
    } catch (error) {
      const errorMessage = error.response?.data?.title || error.message || 'Failed to fetch questions. Please try again.';
      setError(errorMessage);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles selecting/deselecting a question
   * Updates both the simple selected array and the ordered questions array
   * @param {string|number} questionId - ID of the question to select/deselect
   */
  const handleQuestionSelect = (questionId) => {
    setSelectedQuestions(prev => {
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
  };

  /**
   * Handles selecting/deselecting all questions
   * Updates both the simple selected array and the ordered questions array
   */
  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      // Deselect all
      setSelectedQuestions([]);
      setSelectedQuestionsOrdered([]);
    } else {
      // Select all
      setSelectedQuestions(questions.map(q => q.id));
      setSelectedQuestionsOrdered([...questions]);
    }
  };

  /**
   * Clears all filters and resets the component state
   */
  const handleClearFilters = () => {
    resetMetadata();
    setQuestions([]);
    setSelectedQuestions([]);
    setSelectedQuestionsOrdered([]);
    setSearchPerformed(false);
    setError('');
  };

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

      await generatePDF(
        questionsWithComments,
        // Success callback
        async (filename, questionCount) => {
          showOverlay({
            status: 'success',
            message: `Successfully downloaded ${filename} with ${questionCount} questions`,
            autoClose: true,
            autoCloseDelay: 3000
          });

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
    return questions.map((question) => {
      const isImage = typeof question.fileUrl === 'string' && 
        /(\.png|\.jpg|\.jpeg|\.gif|\.webp)$/i.test(question.fileUrl);
      
      return (
        <QuestionCard
          key={question.id}
          question={question}
          isSelected={selectedQuestions.includes(question.id)}
          onSelect={handleQuestionSelect}
          variant="grid"
        />
      );
    });
  }, [questions, selectedQuestions]);

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
    setQuestionComments(prev => ({
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
            {/* Mobile sidebar toggle */}
            <Button
              variant="secondary"
              icon={Menu}
              onClick={handleToggleSidebar}
              className="lg:hidden"
            >
              {isSidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}
            </Button>
            
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

        <div className="flex flex-wrap items-end gap-3">
          {/* Exam Type */}
          {metadata.country && (
            <SelectField
              label="Exam Type"
              value={metadata.examType}
              onChange={(e) => handleFilterChange('examType', e.target.value)}
              options={[
                { value: '', label: 'All Exam Types' },
                ...(availableOptions.examTypes || [])
              ]}
            />
          )}

          {/* Stream Selection (only for A/L) */}
          {metadata.examType === 'a_level' && (
            <SelectField
              label="Stream"
              value={metadata.stream}
              onChange={(e) => handleFilterChange('stream', e.target.value)}
              options={[
                { value: '', label: 'All Streams' },
                ...(availableOptions.streams || [])
              ]}
            />
          )}

          {/* Subject Selection (show for A/L and O/L, but NOT for Grade 5) */}
          {(metadata.examType && metadata.examType !== 'grade5' && (metadata.stream || metadata.examType === 'o_level')) && (
            <SelectField
              label="Subject"
              value={metadata.subject}
              onChange={(e) => handleFilterChange('subject', e.target.value)}
              options={[
                { value: '', label: 'All Subjects' },
                ...(availableOptions.subjects || [])
              ]}
            />
          )}

          {/* Paper Category */}
          <SelectField
            label="Paper Category"
            value={metadata.paperCategory}
            onChange={(e) => handleFilterChange('paperCategory', e.target.value)}
            options={[
              { value: '', label: 'All Categories' },
              { value: 'Model', label: 'Model Paper' },
              { value: 'PastPaper', label: 'Past Paper' },
              { value: 'TermTest', label: 'Term Test' }
            ]}
          />

          {/* Paper Type for Science Subjects (Physics, Chemistry, Biology) */}
          {['physics', 'chemistry', 'biology'].includes(metadata.subject) && (
            <SelectField
              label="Paper Type"
              value={metadata.paperType}
              onChange={(e) => handleFilterChange('paperType', e.target.value)}
              options={[
                { value: '', label: 'All Paper Types' },
                ...(availableOptions.paperTypes || [])
              ]}
            />
          )}

          {/* Paper Type for Grade 5 Scholarship */}
          {metadata.examType === 'grade5' && (
            <SelectField
              label="Paper Type"
              value={metadata.paperType}
              onChange={(e) => handleFilterChange('paperType', e.target.value)}
              options={[
                { value: '', label: 'All Paper Types' },
                ...(availableOptions.paperTypes || [])
              ]}
            />
          )}

          {/* Year (only for Past Papers) */}
          {metadata.paperCategory === 'PastPaper' && (
            <InputField
              label="Year"
              type="number"
              min="2000"
              max="2030"
              value={metadata.year || ''}
              onChange={(e) => handleFilterChange('year', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="All Years"
            />
          )}

          {/* Term and School (only for Term Tests) */}
          {metadata.paperCategory === 'TermTest' && (
            <>
              <SelectField
                label="Term"
                value={metadata.term}
                onChange={(e) => handleFilterChange('term', e.target.value)}
                options={[
                  { value: '', label: 'All Terms' },
                  { value: 'Term1', label: 'Term 1' },
                  { value: 'Term2', label: 'Term 2' },
                  { value: 'Term3', label: 'Term 3' }
                ]}
              />

              <SearchableSelect
                value={metadata.schoolName}
                onChange={(e) => handleFilterChange('schoolName', e.target.value)}
                options={[
                  { value: '', label: 'All Schools' },
                  ...(availableOptions.schools?.map(school => ({ value: school.name, label: school.name })) || [])
                ]}
                placeholder="All Schools"
              />
            </>
          )}

          <div className="ml-auto flex gap-2">
            <Button
              variant="primary"
              onClick={handleSearch}
              disabled={loading || metadataLoading}
              icon={Search}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
            <Button variant="outline" onClick={handleClearFilters} disabled={loading}>
              Clear
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
                <div className="flex justify-between items-center mb-6 p-6 pb-0">
                  <h2 className="text-lg font-semibold">Selected Questions ({selectedQuestionsOrdered.length})</h2>
                  <Button
                    variant="outline"
                    onClick={handleBackToSearch}
                    icon={Search}
                  >
                    Back to Search
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 pt-0">
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
                          className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', index.toString());
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
                            handleDragReorder(draggedIndex, index);
                          }}
                        >
                          <div className="flex items-start gap-4">
                            {/* Drag handle and question number */}
                            <div className="flex flex-col items-center gap-2">
                              <div className="bg-gray-100 p-1 rounded cursor-move">
                                <GripVertical className="h-4 w-4 text-gray-500" />
                              </div>
                              <div className="bg-blue-500 text-white text-sm font-bold rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                                {index + 1}
                              </div>
                            </div>
                            
                            {/* Question image */}
                            <div className="flex-shrink-0">
                              <img
                                src={question.fileUrl || "/placeholder.svg"}
                                alt={question.subject?.name || 'Question'}
                                className="w-20 h-20 object-cover rounded-md"
                              />
                            </div>
                            
                            {/* Question content */}
                            <div className="flex-1 min-w-0">
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
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleMoveQuestionUp(index)}
                                disabled={index === 0}
                                className="p-1 h-6 w-6 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                title="Move up"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleMoveQuestionDown(index)}
                                disabled={index === selectedQuestionsOrdered.length - 1}
                                className="p-1 h-6 w-6 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                title="Move down"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Search Results View */
              <>
                <div className="flex justify-between items-center mb-6 p-6 pb-0">
                  <h2 className="text-lg font-semibold">Search Results</h2>

                  {searchPerformed && questions.length > 0 && (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {getFilteredQuestionsCount()} questions found • {getSelectedQuestionsCount()} selected
                      </span>
                      <Button
                        variant="primary"
                        onClick={handleSelectAll}
                        size="small"
                      >
                        {selectedQuestions.length === questions.length ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Error display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4 mx-6">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto p-6 pt-0">
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

        {/* Mobile sidebar overlay */}
        {!isSidebarCollapsed && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black bg-opacity-50" onClick={handleToggleSidebar}></div>
            <div className="w-96 bg-white">
              <SelectedQuestionsSidebar
                selectedQuestionsOrdered={selectedQuestionsOrdered}
                setSelectedQuestionsOrdered={setSelectedQuestionsOrdered}
                onDownloadPaper={handleDownloadPaper}
                isCollapsed={false}
                onToggleCollapse={handleToggleSidebar}
                onViewSelectedQuestions={handleViewSelectedQuestions}
                questionComments={questionComments}
                onCommentChange={handleCommentChange}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperBuilder;