import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Download, ChevronUp, ChevronDown, Menu } from 'lucide-react';
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
import { searchQuestions } from '../../services/questionService.js';

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

  // Use the same metadata hook as QuestionUpload
  const {
    metadata,
    availableOptions,
    updateMetadata,
    loading: metadataLoading,
    resetMetadata
  } = useMetadata();

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
          } else {
            params.append(key, value);
          }
        }
      });

      console.log('Searching with URL:', `/api/questions?${params.toString()}`);

      // Use searchQuestions instead of direct axios
      const data = await searchQuestions(params);
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
      await generatePDF(
        orderedQuestions,
        // Success callback
        (filename, questionCount) => {
          showOverlay({
            status: 'success',
            message: `Successfully downloaded ${filename} with ${questionCount} questions`,
            autoClose: true,
            autoCloseDelay: 3000
          });
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
        <div className="flex flex-wrap items-end gap-3">
          <SelectField
            label="Country"
            value={metadata.country}
            onChange={(e) => handleFilterChange('country', e.target.value)}
            options={[
              { value: '', label: 'All Countries' },
              { value: 'sri_lanka', label: 'Sri Lanka' },
              { value: 'other', label: 'Other' }
            ]}
          />

          {/* Exam Type (only show if country is selected) */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
          </Card>
        </div>

        {/* Selected Questions Sidebar */}
        <div className={`hidden lg:block ${isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'}`}>
          <SelectedQuestionsSidebar
            selectedQuestionsOrdered={selectedQuestionsOrdered}
            setSelectedQuestionsOrdered={setSelectedQuestionsOrdered}
            onDownloadPaper={handleDownloadPaper}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
        </div>

        {/* Mobile sidebar overlay */}
        {!isSidebarCollapsed && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black bg-opacity-50" onClick={handleToggleSidebar}></div>
            <div className="w-80 bg-white">
              <SelectedQuestionsSidebar
                selectedQuestionsOrdered={selectedQuestionsOrdered}
                setSelectedQuestionsOrdered={setSelectedQuestionsOrdered}
                onDownloadPaper={handleDownloadPaper}
                isCollapsed={false}
                onToggleCollapse={handleToggleSidebar}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaperBuilder;