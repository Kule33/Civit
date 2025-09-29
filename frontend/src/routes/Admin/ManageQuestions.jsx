import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Edit, Trash2, Eye, X } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import SearchableSelect from '../../components/ui/SearchableSelect.jsx';
import InputField from '../../components/ui/InputField.jsx';
import { useMetadata } from '../../hooks/useMetadata.js';
import { searchQuestions } from '../../services/questionService.js';
import { useSubmission } from '../../context/SubmissionContext';
import axios from 'axios';

const AdminManageQuestions = () => {
  // Core state management for questions and UI
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isFiltersMinimized, setIsFiltersMinimized] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [imagePreviewModal, setImagePreviewModal] = useState({ isOpen: false, imageUrl: '', title: '' });
  const [subjectStats, setSubjectStats] = useState([]);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  
  const { showOverlay } = useSubmission();

  // Use the same metadata hook as PaperBuilder
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

  // Function to calculate subject statistics
  const calculateSubjectStats = (questions) => {
    const stats = {};
    questions.forEach(question => {
      const subjectName = question.subject?.name || question.subject || 'Unknown';
      stats[subjectName] = (stats[subjectName] || 0) + 1;
    });
    
    // Convert to array and sort by count, take top 4
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  };

  // Initial load effect to fetch all questions and calculate stats
  useEffect(() => {
    const fetchInitialQuestions = async () => {
      if (!searchPerformed) {
        setLoading(true);
        try {
          // Fetch all questions on initial load
          const params = new URLSearchParams();
          const response = await searchQuestions(params);
          const questionsArray = Array.isArray(response) ? response : [];
          setQuestions(questionsArray);
          
          // Calculate and set subject statistics
          const stats = calculateSubjectStats(questionsArray);
          setSubjectStats(stats);
        } catch (error) {
          console.error('Failed to fetch initial questions:', error);
          // Don't show error overlay on initial load, just keep empty state
          setQuestions([]);
          setSubjectStats([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchInitialQuestions();
  }, []);

  // Search function using the same API as PaperBuilder
  const handleSearch = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query parameters from current metadata
      const params = new URLSearchParams();
      Object.entries(metadata).forEach(([key, value]) => {
        // Only append if the value is not empty, null, or undefined
        if (value !== '' && value !== null && value !== undefined) {
          params.append(key, value);
        }
      });

      console.log('Searching questions with URL:', `/api/questions?${params.toString()}`);

      const response = await searchQuestions(params);
      const questionsArray = Array.isArray(response) ? response : [];
      setQuestions(questionsArray);
      setSearchPerformed(true);
      
      // Update subject statistics when searching
      const stats = calculateSubjectStats(questionsArray);
      setSubjectStats(stats);
    } catch (error) {
      const errorMessage = error.response?.data?.title || error.message || 'Failed to fetch questions. Please try again.';
      setError(errorMessage);
      setQuestions([]);
      showOverlay({
        status: 'error',
        message: errorMessage,
        autoClose: true,
        autoCloseDelay: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    resetMetadata();
    setQuestions([]);
    setSelectedQuestions([]);
    setSearchPerformed(false);
    setError('');
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

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    // Pre-populate form with question data
    setEditFormData({
      country: question.country || '',
      examType: question.examType || '',
      stream: question.stream || '',
      subject: question.subject?.name || question.subject || '',
      paperType: question.paperType || '',
      paperCategory: question.paperCategory || '',
      year: question.year || '',
      term: question.term || '',
      schoolName: question.schoolName || question.school?.name || '',
      uploader: question.uploader || '',
      status: question.status || 'pending',
      title: question.title || '',
      fileUrl: question.fileUrl || ''
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingQuestion(null);
    setEditFormData({});
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDeleteQuestion = (questionId) => {
    setQuestionToDelete(questionId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      // Call backend API to delete question
      await axios.delete(`http://localhost:5201/api/questions/${questionToDelete}`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      showOverlay({
        status: 'success',
        message: 'Question deleted successfully!',
        autoClose: true,
        autoCloseDelay: 3000
      });
      
      // Remove question from local state
      const updatedQuestions = questions.filter(q => q.id !== questionToDelete);
      setQuestions(updatedQuestions);
      setSelectedQuestions(prev => prev.filter(id => id !== questionToDelete));
      
      // Recalculate subject statistics
      const stats = calculateSubjectStats(updatedQuestions);
      setSubjectStats(stats);
      
      // Close dialog
      setShowDeleteConfirm(false);
      setQuestionToDelete(null);
      
    } catch (error) {
      console.error('Failed to delete question:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.title || 'Failed to delete question. Please try again.';
      showOverlay({
        status: 'error',
        message: errorMessage,
        autoClose: true,
        autoCloseDelay: 5000
      });
      setShowDeleteConfirm(false);
      setQuestionToDelete(null);
    }
  };

  const handleViewQuestion = (question) => {
    if (question.fileUrl) {
      setImagePreviewModal({
        isOpen: true,
        imageUrl: question.fileUrl,
        title: question.title || `Question #${question.id}` || 'Question Preview'
      });
    } else {
      showOverlay({
        status: 'error',
        message: 'No image available for this question.',
        autoClose: true,
        autoCloseDelay: 3000
      });
    }
  };

  const closeImagePreview = () => {
    setImagePreviewModal({ isOpen: false, imageUrl: '', title: '' });
  };

  // Handle keyboard events for image preview modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && imagePreviewModal.isOpen) {
        closeImagePreview();
      }
    };

    if (imagePreviewModal.isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [imagePreviewModal.isOpen]);

  const handleSaveEdit = () => {
    setShowSaveConfirm(true);
  };

  const confirmSave = async () => {
    setIsSavingEdit(true);
    try {
      // Prepare data for backend API
      const updateData = {
        id: editingQuestion.id,
        title: editFormData.title,
        country: editFormData.country,
        examType: editFormData.examType,
        stream: editFormData.stream,
        subject: editFormData.subject,
        paperType: editFormData.paperType,
        paperCategory: editFormData.paperCategory,
        year: editFormData.year ? parseInt(editFormData.year) : null,
        term: editFormData.term,
        schoolName: editFormData.schoolName,
        uploader: editFormData.uploader,
        status: editFormData.status
      };

      // Call backend API to update question
      const response = await axios.put(`http://localhost:5201/api/questions/${editingQuestion.id}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      showOverlay({
        status: 'success',
        message: 'Question updated successfully!',
        autoClose: true,
        autoCloseDelay: 3000
      });
      
      // Update local data with the response
      const updatedQuestions = questions.map(q => 
        q.id === editingQuestion.id 
          ? { ...q, ...response.data }
          : q
      );
      setQuestions(updatedQuestions);
      
      // Recalculate subject statistics
      const stats = calculateSubjectStats(updatedQuestions);
      setSubjectStats(stats);
      
      setShowSaveConfirm(false);
      handleCloseEditModal();
    } catch (error) {
      console.error('Failed to update question:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.title || 'Failed to update question. Please try again.';
      showOverlay({
        status: 'error',
        message: errorMessage,
        autoClose: true,
        autoCloseDelay: 5000
      });
      setShowSaveConfirm(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const displayQuestions = questions;

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Manage Questions"
        subtitle={`View, edit, and manage question bank (${displayQuestions.length} questions found)`}
        actions={
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              icon={Filter}
              onClick={() => setIsFiltersMinimized(!isFiltersMinimized)}
            >
              {isFiltersMinimized ? 'Show Filters' : 'Hide Filters'}
            </Button>
            {selectedQuestions.length > 0 && (
              <Button
                variant="primary"
                onClick={handleSelectAll}
              >
                {selectedQuestions.length} Selected
              </Button>
            )}
          </div>
        }
      />

      {/* Subject Statistics Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Subjects by Question Count</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : subjectStats.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjectStats.map((stat, index) => (
              <Card key={stat.name} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 truncate" title={stat.name}>
                      {stat.name}
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {stat.count.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stat.count === 1 ? 'Question' : 'Questions'}
                    </p>
                  </div>
                  <div className="ml-3">
                    <div className={`w-4 h-4 rounded-full ${
                      index === 0 ? 'bg-green-500' : 
                      index === 1 ? 'bg-blue-500' : 
                      index === 2 ? 'bg-yellow-500' : 'bg-purple-500'
                    }`} title={`Rank ${index + 1}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 text-center text-gray-500">
              <p>No data available</p>
            </Card>
          </div>
        )}
      </div>

      {/* Search and Filter Section - PaperBuilder Style */}
      {!isFiltersMinimized && (
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

            {/* Paper Type for Science Subjects */}
            {['Physics', 'Chemistry', 'Biology'].includes(metadata.subject) && (
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
      )}

      {/* Results Section */}
      <Card>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold">Questions</h2>
          {displayQuestions.length > 0 && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {displayQuestions.length} questions • {selectedQuestions.length} selected
              </span>
              <Button
                variant="primary"
                onClick={handleSelectAll}
                size="small"
              >
                {selectedQuestions.length === displayQuestions.length ? 'Deselect All' : 'Select All'}
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
        ) : displayQuestions.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start Searching</h3>
            <p className="text-gray-600">
              Use the filters above to search for questions in the database.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedQuestions.length === displayQuestions.length && displayQuestions.length > 0}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paper Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploader</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayQuestions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        checked={selectedQuestions.includes(question.id)}
                        onChange={() => handleQuestionSelect(question.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {question.title || 'Untitled Question'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {question.country && <span className="mr-2 capitalize">{question.country.replace('_', ' ')}</span>}
                          {question.examType && <span className="mr-2 uppercase">{question.examType.replace('_', '-')}</span>}
                          {question.stream && <span className="mr-2 capitalize">{question.stream}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{question.subject?.name || question.subject || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                        {question.paperCategory || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{question.uploader || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {question.date || question.createdAt || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <button 
                          className="text-blue-600 hover:text-blue-800 p-1" 
                          title="View"
                          onClick={() => handleViewQuestion(question)}
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="text-green-600 hover:text-green-800 p-1" 
                          title="Edit"
                          onClick={() => handleEditQuestion(question)}
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800 p-1" 
                          title="Delete"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Image Preview Modal */}
      {imagePreviewModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            {/* Close Button */}
            <button
              onClick={closeImagePreview}
              className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
            >
              <X size={24} />
            </button>
            
            {/* Modal Content */}
            <div className="bg-white rounded-lg shadow-xl max-h-full overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {imagePreviewModal.title}
                </h3>
              </div>
              
              {/* Image Container */}
              <div className="p-4 flex justify-center items-center bg-gray-50">
                <div className="max-w-full max-h-[70vh] overflow-auto">
                  <img
                    src={imagePreviewModal.imageUrl}
                    alt={imagePreviewModal.title}
                    className="max-w-full h-auto shadow-lg rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  {/* Error Fallback */}
                  <div 
                    className="hidden flex-col items-center justify-center p-8 text-gray-500"
                    style={{ minHeight: '200px' }}
                  >
                    <Eye size={48} className="mb-4 text-gray-300" />
                    <p className="text-center">
                      Unable to load image.<br />
                      The image may be corrupted or the URL may be invalid.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <Button
                  variant="secondary"
                  onClick={closeImagePreview}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => window.open(imagePreviewModal.imageUrl, '_blank')}
                >
                  Open in New Tab
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Dialog */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Save Changes
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to save the changes to this question?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSaveConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmSave}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Question</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex h-[70vh]">
              {/* Left Side - Image Preview */}
              <div className="w-1/2 p-6 border-r border-gray-200 flex flex-col">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Question Preview</h3>
                <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden">
                  {editFormData.fileUrl ? (
                    <img 
                      src={editFormData.fileUrl} 
                      alt="Question Preview" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className="w-full h-full flex items-center justify-center text-gray-400"
                    style={{ display: editFormData.fileUrl ? 'none' : 'flex' }}
                  >
                    <div className="text-center">
                      <Eye size={48} className="mx-auto mb-2" />
                      <p>No image preview available</p>
                    </div>
                  </div>
                </div>
                
                {/* Question Title */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question Title</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => handleEditFormChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter question title"
                  />
                </div>
              </div>

              {/* Right Side - Metadata Form */}
              <div className="w-1/2 p-6 overflow-y-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Question Metadata</h3>
                
                <div className="space-y-4">
                  {/* Country */}
                  <SelectField
                    label="Country"
                    value={editFormData.country}
                    onChange={(e) => handleEditFormChange('country', e.target.value)}
                    options={[
                      { value: '', label: 'Select Country' },
                      { value: 'sri_lanka', label: 'Sri Lanka' },
                      { value: 'other', label: 'Other' }
                    ]}
                  />

                  {/* Exam Type */}
                  <SelectField
                    label="Exam Type"
                    value={editFormData.examType}
                    onChange={(e) => handleEditFormChange('examType', e.target.value)}
                    options={[
                      { value: '', label: 'Select Exam Type' },
                      { value: 'a_level', label: 'A Level' },
                      { value: 'o_level', label: 'O Level' },
                      { value: 'grade5', label: 'Grade 5 Scholarship' }
                    ]}
                  />

                  {/* Stream (only for A Level) */}
                  {editFormData.examType === 'a_level' && (
                    <SelectField
                      label="Stream"
                      value={editFormData.stream}
                      onChange={(e) => handleEditFormChange('stream', e.target.value)}
                      options={[
                        { value: '', label: 'Select Stream' },
                        { value: 'physical', label: 'Physical Science' },
                        { value: 'biological', label: 'Biological Science' },
                        { value: 'commerce', label: 'Commerce' },
                        { value: 'arts', label: 'Arts' },
                        { value: 'technology', label: 'Technology' }
                      ]}
                    />
                  )}

                  {/* Subject */}
                  <SelectField
                    label="Subject"
                    value={editFormData.subject}
                    onChange={(e) => handleEditFormChange('subject', e.target.value)}
                    options={[
                      { value: '', label: 'Select Subject' },
                      { value: 'mathematics', label: 'Mathematics' },
                      { value: 'physics', label: 'Physics' },
                      { value: 'chemistry', label: 'Chemistry' },
                      { value: 'biology', label: 'Biology' },
                      { value: 'english', label: 'English' },
                      { value: 'sinhala', label: 'Sinhala' },
                      { value: 'history', label: 'History' },
                      { value: 'geography', label: 'Geography' },
                      { value: 'economics', label: 'Economics' },
                      { value: 'accounting', label: 'Accounting' },
                      { value: 'business_studies', label: 'Business Studies' }
                    ]}
                  />

                  {/* Paper Category */}
                  <SelectField
                    label="Paper Category"
                    value={editFormData.paperCategory}
                    onChange={(e) => handleEditFormChange('paperCategory', e.target.value)}
                    options={[
                      { value: '', label: 'Select Category' },
                      { value: 'Model', label: 'Model Paper' },
                      { value: 'PastPaper', label: 'Past Paper' },
                      { value: 'TermTest', label: 'Term Test' }
                    ]}
                  />

                  {/* Paper Type (for science subjects) */}
                  {['physics', 'chemistry', 'biology'].includes(editFormData.subject) && (
                    <SelectField
                      label="Paper Type"
                      value={editFormData.paperType}
                      onChange={(e) => handleEditFormChange('paperType', e.target.value)}
                      options={[
                        { value: '', label: 'Select Paper Type' },
                        { value: 'mcq', label: 'MCQ' },
                        { value: 'theory', label: 'Theory' },
                        { value: 'practical', label: 'Practical' }
                      ]}
                    />
                  )}

                  {/* Year (for Past Papers) */}
                  {editFormData.paperCategory === 'PastPaper' && (
                    <InputField
                      label="Year"
                      type="number"
                      min="2000"
                      max="2030"
                      value={editFormData.year}
                      onChange={(e) => handleEditFormChange('year', e.target.value)}
                      placeholder="Enter year"
                    />
                  )}

                  {/* Term and School (for Term Tests) */}
                  {editFormData.paperCategory === 'TermTest' && (
                    <>
                      <SelectField
                        label="Term"
                        value={editFormData.term}
                        onChange={(e) => handleEditFormChange('term', e.target.value)}
                        options={[
                          { value: '', label: 'Select Term' },
                          { value: 'Term1', label: 'Term 1' },
                          { value: 'Term2', label: 'Term 2' },
                          { value: 'Term3', label: 'Term 3' }
                        ]}
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                        <input
                          type="text"
                          value={editFormData.schoolName}
                          onChange={(e) => handleEditFormChange('schoolName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter school name"
                        />
                      </div>
                    </>
                  )}

                  {/* Status */}
                  <SelectField
                    label="Status"
                    value={editFormData.status}
                    onChange={(e) => handleEditFormChange('status', e.target.value)}
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'approved', label: 'Approved' },
                      { value: 'rejected', label: 'Rejected' }
                    ]}
                  />

                  {/* Uploader */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Uploader</label>
                    <input
                      type="text"
                      value={editFormData.uploader}
                      onChange={(e) => handleEditFormChange('uploader', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter uploader name"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 px-6 pt-4 pb-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleCloseEditModal}
                disabled={isSavingEdit}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Confirmation Dialog */}
      {showSaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Save Changes
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to save the changes to this question?
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSaveConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmSave}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Delete Question
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setQuestionToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
              >
                Delete Question
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageQuestions;