import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, ChevronUp, ChevronDown } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import InputField from '../../components/ui/InputField.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import SearchableSelect from '../../components/ui/SearchableSelect.jsx';
import { useSubmission } from '../../context/SubmissionContext';
import { useMetadata } from '../../hooks/useMetadata.js'; // Import the hook
import axios from 'axios';

const PaperBuilder = () => {
  // `filters` state is no longer strictly needed as `useMetadata` manages it,
  // but if you want to explicitly see the filter state, you can keep it in sync.
  // For now, let's rely directly on `metadata` from the hook.

  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isFiltersMinimized, setIsFiltersMinimized] = useState(false);

  const { showOverlay } = useSubmission();

  // Use the same metadata hook as QuestionUpload
  const {
    metadata,
    availableOptions,
    updateMetadata,
    loading: metadataLoading,
    resetMetadata // Assuming useMetadata provides a reset function
  } = useMetadata(); // Initialize without filters, the hook should manage internal state

  const handleFilterChange = (field, value) => {
    updateMetadata(field, value);
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query parameters from current metadata (which is `filters` internally in the hook)
      const params = new URLSearchParams();
      Object.entries(metadata).forEach(([key, value]) => {
        // Only append if the value is not empty, null, or undefined
        if (value !== '' && value !== null && value !== undefined) {
            params.append(key, value);
        }
      });

      // Log the URL being hit for debugging
      console.log('Searching with URL:', `/api/questions?${params.toString()}`);

      const response = await axios.get(`/api/questions?${params.toString()}`);
      setQuestions(Array.isArray(response.data) ? response.data : []);
      setSearchPerformed(true);
    } catch (error) {
      const errorMessage = error.response?.data?.title || error.message || 'Failed to fetch questions. Please try again.';
      setError(errorMessage);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSelect = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      } else {
        return [...prev, questionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map(q => q.id));
    }
  };

  const handleClearFilters = () => {
    resetMetadata(); // Use the reset function from the hook
    setQuestions([]);
    setSelectedQuestions([]);
    setSearchPerformed(false);
    setError('');
  };

  const handleDownloadPaper = () => {
    if (selectedQuestions.length === 0) {
      showOverlay({
        status: 'error',
        message: 'Please select at least one question to download',
        autoClose: true,
        autoCloseDelay: 3000
      });
      return;
    }

    const selectedQuestionsData = questions.filter(q => selectedQuestions.includes(q.id));

    // Create paper content
    const paperContent = selectedQuestionsData.map((q, index) =>
      `Question ${index + 1}:\n` +
      `Subject: ${q.subject?.name || 'N/A'}\n` +
      `Year: ${q.year || 'N/A'}\n` +
      `Term: ${q.term || 'N/A'}\n` +
      `School: ${q.school?.name || 'N/A'}\n` +
      `File: ${q.fileUrl}\n` +
      `---\n\n`
    ).join('');

    const blob = new Blob([paperContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `custom-paper-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    showOverlay({
      status: 'success',
      message: `Downloaded paper with ${selectedQuestions.length} questions`,
      autoClose: true,
      autoCloseDelay: 3000
    });
  };

  const getFilteredQuestionsCount = () => {
    return questions.length;
  };

  const getSelectedQuestionsCount = () => {
    return selectedQuestions.length;
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
              value={metadata.year || ''} // Ensure it's a string for InputField
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Results Panel */}
        <div className="lg:col-span-4">
          <Card>
            <div className="flex justify-between items-center mb-6">
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
                  <Button
                    variant="success"
                    onClick={handleDownloadPaper}
                    disabled={selectedQuestions.length === 0}
                    icon={Download}
                    size="small"
                  >
                    Download Paper
                  </Button>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

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
                {questions.map((question) => {
                  const isImage = typeof question.fileUrl === 'string' && /(\.png|\.jpg|\.jpeg|\.gif|\.webp)$/i.test(question.fileUrl);
                  return (
                    <div
                      key={question.id}
                      className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                        selectedQuestions.includes(question.id)
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:shadow-md'
                      }`}
                    >
                      {isImage ? (
                        <div className="h-40 bg-gray-50 overflow-hidden">
                          <img src={question.fileUrl} alt={question.subject?.name || 'Question'} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-40 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
                          No Image Preview
                        </div>
                      )}
                      <div className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-2">
                            <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                              {question.subject?.name || 'Unknown Subject'}
                            </h3>
                            <div className="flex flex-wrap gap-1 text-[11px] text-gray-600 mb-2">
                              {question.country && (<span className="bg-gray-100 px-2 py-0.5 rounded">{question.country}</span>)}
                              {question.examType && (<span className="bg-gray-100 px-2 py-0.5 rounded">{question.examType}</span>)}
                              {question.paperCategory && (<span className="bg-gray-100 px-2 py-0.5 rounded">{question.paperCategory}</span>)}
                              {question.paperType && (<span className="bg-gray-100 px-2 py-0.5 rounded">{question.paperType}</span>)}
                              {question.year && (<span className="bg-gray-100 px-2 py-0.5 rounded">{question.year}</span>)}
                              {question.term && (<span className="bg-gray-100 px-2 py-0.5 rounded">{question.term}</span>)}
                            </div>
                            <div className="text-xs text-gray-700 space-y-1">
                              {question.school?.name && (<p>School: {question.school.name}</p>)}
                              {question.uploader && (<p>By: {question.uploader}</p>)}
                            </div>
                            {question.fileUrl && (
                              <a href={question.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-blue-600 hover:text-blue-800 text-xs">
                                View File ↗
                              </a>
                            )}
                          </div>
                          <div>
                            <Button
                              variant={selectedQuestions.includes(question.id) ? "secondary" : "outline"}
                              size="small"
                              onClick={() => handleQuestionSelect(question.id)}
                            >
                              {selectedQuestions.includes(question.id) ? 'Selected' : 'Select'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaperBuilder;