// frontend/src/routes/Admin/ManageQuestions.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Upload, Search, Filter, Trash2, Edit, Download, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { searchQuestions, deleteQuestion } from '../../services/questionService.js';
import { getTypesetByQuestionId, deleteTypeset } from '../../services/typesetService.js';
import { supabase } from '../../supabaseClient';
import { useSubmission } from '../../context/SubmissionContext';

const ManageQuestions = () => {
  const [activeTab, setActiveTab] = useState('questions'); // 'questions' or 'typesets'
  const [questions, setQuestions] = useState([]);
  const [typesets, setTypesets] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showOverlay } = useSubmission();

  // Load all questions on mount
  useEffect(() => {
    loadAllQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load typesets when tab switches
  useEffect(() => {
    if (activeTab === 'typesets') {
      loadTypesetsForQuestions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, questions]);

  const loadAllQuestions = async () => {
    try {
      setLoading(true);
      const data = await searchQuestions(new URLSearchParams());
      setQuestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading questions:', error);
      showOverlay({
        status: 'error',
        message: 'Failed to load questions',
        autoClose: true,
        autoCloseDelay: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTypesetsForQuestions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) return;

      // Filter questions that have typesets
      const questionsWithTypesets = questions.filter(q => q.typesetAvailable);
      
      // Fetch full typeset details for each
      const typesetPromises = questionsWithTypesets.map(async (q) => {
        const typeset = await getTypesetByQuestionId(q.id, token);
        return {
          ...typeset,
          question: q
        };
      });

      const typesetsData = await Promise.all(typesetPromises);
      setTypesets(typesetsData.filter(t => t !== null));
    } catch (error) {
      console.error('Error loading typesets:', error);
    }
  };

  // Tab button component
  // eslint-disable-next-line no-unused-vars
  const TabButton = ({ value, label, icon: Icon, count }) => (
    <button
      onClick={() => setActiveTab(value)}
      className={`flex items-center gap-2 px-6 py-3 font-medium transition-all duration-200 border-b-2 ${
        activeTab === value
          ? 'border-blue-600 text-blue-600 bg-blue-50'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          activeTab === value
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manage Questions & Typesets"
        subtitle="View, edit, and delete uploaded questions and typeset documents"
      />

      {/* Tab Navigation */}
      <Card>
        <div className="flex border-b">
          <TabButton
            value="questions"
            label="Question Uploads"
            icon={Upload}
            count={questions.length}
          />
          <TabButton
            value="typesets"
            label="Typeset Uploads"
            icon={FileText}
            count={typesets.length}
          />
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === 'questions' ? (
        <QuestionsManagementSection
          questions={questions}
          loading={loading}
          onRefresh={loadAllQuestions}
        />
      ) : (
        <TypesetsManagementSection
          typesets={typesets}
          loading={loading}
          onRefresh={loadTypesetsForQuestions}
        />
      )}
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, item, type }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Delete {type === 'question' ? 'Question' : 'Typeset'}?
            </h3>
          </div>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this {type === 'question' ? 'question' : 'typeset'}? This action cannot be undone.
          </p>
          {item && (
            <div className="bg-gray-50 rounded p-3 mb-4 space-y-1 text-sm">
              {type === 'question' ? (
                <>
                  <p><span className="font-medium">Subject:</span> {item.subject?.name || 'N/A'}</p>
                  <p><span className="font-medium">School:</span> {item.school?.name || 'N/A'}</p>
                  <p><span className="font-medium">Year:</span> {item.year || 'N/A'}</p>
                  <p className="font-mono text-xs text-gray-500">ID: {item.id?.substring(0, 16)}...</p>
                </>
              ) : (
                <>
                  <p><span className="font-medium">File:</span> {item.fileName || 'Unnamed'}</p>
                  <p><span className="font-medium">Subject:</span> {item.question?.subject?.name || 'N/A'}</p>
                  <p><span className="font-medium">Version:</span> v{item.version}</p>
                  <p className="font-mono text-xs text-gray-500">ID: {item.id?.substring(0, 16)}...</p>
                </>
              )}
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div className="flex gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded ${
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            {page}
          </button>
        ))}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
};

// ⚡ OPTIMIZATION: Memoized table row to prevent unnecessary re-renders
const QuestionTableRow = React.memo(({ question, onDelete }) => {
  const { showOverlay } = useSubmission();
  
  const handleCopyId = () => {
    navigator.clipboard.writeText(question.id);
    showOverlay({
      status: 'success',
      message: 'Question ID copied!',
      autoClose: true,
      autoCloseDelay: 2000
    });
  };

  return (
    <tr key={question.id} className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <button
          onClick={handleCopyId}
          className="text-xs font-mono text-gray-600 hover:text-blue-600 hover:underline cursor-pointer"
          title={`Click to copy: ${question.id}`}
        >
          {question.id.substring(0, 8)}...
        </button>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {question.subject?.name || 'N/A'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {question.school?.name || 'N/A'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {question.year || 'N/A'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {question.examType || 'N/A'}
      </td>
      <td className="px-4 py-3">
        {question.typesetAvailable ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
            <FileText className="h-3 w-3" />
            Available
          </span>
        ) : (
          <span className="text-xs text-gray-400">None</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {new Date(question.uploadDate).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => window.open(question.fileUrl, '_blank')}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="View Question"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(question)}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete Question"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

QuestionTableRow.displayName = 'QuestionTableRow';

// Questions Management Section Component
const QuestionsManagementSection = ({ questions, loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });
  const { showOverlay } = useSubmission();
  const pageSize = 25; // ⚡ OPTIMIZATION: Only 5 rows per page for better performance

  // ⚡ OPTIMIZATION: Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ⚡ OPTIMIZATION: Memoize filtered results to prevent recalculation on every render
  const filteredQuestions = React.useMemo(() => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    if (!searchLower) return questions;
    
    return questions.filter(q => {
      return (
        q.id?.toLowerCase().includes(searchLower) ||
        q.subject?.name?.toLowerCase().includes(searchLower) ||
        q.school?.name?.toLowerCase().includes(searchLower) ||
        q.country?.toLowerCase().includes(searchLower) ||
        q.examType?.toLowerCase().includes(searchLower)
      );
    });
  }, [questions, debouncedSearchTerm]);

  // ⚡ OPTIMIZATION: Memoize pagination calculations
  const { totalPages, paginatedQuestions } = React.useMemo(() => {
    const total = Math.ceil(filteredQuestions.length / pageSize);
    const paginated = filteredQuestions.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
    return { totalPages: total, paginatedQuestions: paginated };
  }, [filteredQuestions, currentPage, pageSize]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleDelete = (question) => {
    setDeleteModal({ isOpen: true, item: question });
  };

  const confirmDelete = async () => {
    const questionId = deleteModal.item?.id;
    if (!questionId) return;

    setDeleteModal({ isOpen: false, item: null });
    showOverlay({
      status: 'loading',
      message: 'Deleting question...',
      autoClose: false
    });

    try {
      await deleteQuestion(questionId);
      showOverlay({
        status: 'success',
        message: 'Question deleted successfully',
        autoClose: true,
        autoCloseDelay: 3000
      });
      await onRefresh();
    } catch (error) {
      console.error('Error deleting question:', error);
      showOverlay({
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete question',
        autoClose: true,
        autoCloseDelay: 3000
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading questions...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Question ID, subject, school, country, exam type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
          <Button variant="outline" size="small" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Questions List */}
      <Card>
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search criteria' : 'Start by uploading questions'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Question ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">School</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Year</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Exam Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Typeset</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Uploaded</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedQuestions.map((question) => (
                  <QuestionTableRow 
                    key={question.id} 
                    question={question} 
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Card>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        item={deleteModal.item}
        type="question"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
            <p className="text-sm text-gray-600">Total Questions</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {questions.filter(q => q.typesetAvailable).length}
            </p>
            <p className="text-sm text-gray-600">With Typesets</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {questions.filter(q => !q.typesetAvailable).length}
            </p>
            <p className="text-sm text-gray-600">Without Typesets</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ⚡ OPTIMIZATION: Memoized typeset row to prevent unnecessary re-renders
const TypesetTableRow = React.memo(({ typeset, onDelete }) => {
  const { showOverlay } = useSubmission();
  
  const handleCopyId = () => {
    const questionId = typeset.questionId || typeset.question?.id;
    if (questionId) {
      navigator.clipboard.writeText(questionId);
      showOverlay({
        status: 'success',
        message: 'Question ID copied!',
        autoClose: true,
        autoCloseDelay: 2000
      });
    }
  };

  return (
    <tr key={typeset.id} className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <button
          onClick={handleCopyId}
          className="text-xs font-mono text-gray-600 hover:text-blue-600 hover:underline cursor-pointer"
          title={`Click to copy: ${typeset.questionId || typeset.question?.id || 'N/A'}`}
        >
          {(typeset.questionId || typeset.question?.id)?.substring(0, 8) || 'N/A'}...
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-gray-900">
            {typeset.fileName || 'Unnamed'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {typeset.question?.subject?.name || 'N/A'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {typeset.question?.school?.name || 'N/A'}
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
          v{typeset.version}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {new Date(typeset.uploadedAt).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => window.open(typeset.fileUrl, '_blank')}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Download Typeset"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => window.open(typeset.question?.fileUrl, '_blank')}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded transition-colors"
            title="View Question"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(typeset)}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete Typeset"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

TypesetTableRow.displayName = 'TypesetTableRow';

// Typesets Management Section Component
const TypesetsManagementSection = ({ typesets, loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });
  const { showOverlay } = useSubmission();
  const pageSize = 25; // ⚡ OPTIMIZATION: Only 5 rows per page for better performance

  // ⚡ OPTIMIZATION: Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ⚡ OPTIMIZATION: Memoize filtered results
  const filteredTypesets = React.useMemo(() => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    if (!searchLower) return typesets;
    
    return typesets.filter(t => {
      return (
        t.questionId?.toLowerCase().includes(searchLower) ||
        t.question?.id?.toLowerCase().includes(searchLower) ||
        t.fileName?.toLowerCase().includes(searchLower) ||
        t.question?.subject?.name?.toLowerCase().includes(searchLower) ||
        t.question?.school?.name?.toLowerCase().includes(searchLower)
      );
    });
  }, [typesets, debouncedSearchTerm]);

  // ⚡ OPTIMIZATION: Memoize pagination calculations
  const { totalPages, paginatedTypesets } = React.useMemo(() => {
    const total = Math.ceil(filteredTypesets.length / pageSize);
    const paginated = filteredTypesets.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
    return { totalPages: total, paginatedTypesets: paginated };
  }, [filteredTypesets, currentPage, pageSize]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleDelete = (typeset) => {
    setDeleteModal({ isOpen: true, item: typeset });
  };

  const confirmDelete = async () => {
    const typesetId = deleteModal.item?.id;
    if (!typesetId) return;

    setDeleteModal({ isOpen: false, item: null });
    showOverlay({
      status: 'loading',
      message: 'Deleting typeset...',
      autoClose: false
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      await deleteTypeset(typesetId, token);
      showOverlay({
        status: 'success',
        message: 'Typeset deleted successfully',
        autoClose: true,
        autoCloseDelay: 3000
      });
      await onRefresh();
    } catch (error) {
      console.error('Error deleting typeset:', error);
      showOverlay({
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete typeset',
        autoClose: true,
        autoCloseDelay: 3000
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading typesets...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Question ID, filename, subject, school..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
          <Button variant="outline" size="small" onClick={onRefresh}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Typesets List */}
      <Card>
        {filteredTypesets.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Typesets Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search criteria' : 'Start by uploading typeset documents'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Question ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">File Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Question Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">School</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Version</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Uploaded</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTypesets.map((typeset) => (
                  <TypesetTableRow 
                    key={typeset.id} 
                    typeset={typeset} 
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </Card>

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, item: null })}
        onConfirm={confirmDelete}
        item={deleteModal.item}
        type="typeset"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{typesets.length}</p>
            <p className="text-sm text-gray-600">Total Typesets</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {typesets.filter(t => t.version > 1).length}
            </p>
            <p className="text-sm text-gray-600">Updated (v2+)</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ManageQuestions;
