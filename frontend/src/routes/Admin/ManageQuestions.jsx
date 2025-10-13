// frontend/src/routes/Admin/ManageQuestions.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Upload, Search, Filter, Trash2, Edit, Download, ChevronLeft, ChevronRight, AlertTriangle, Inbox, Eye, Save } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { searchQuestions, deleteQuestion } from '../../services/questionService.js';
import { getTypesetByQuestionId, deleteTypeset } from '../../services/typesetService.js';
import { getAllTypesetRequests, updateTypesetRequestStatus } from '../../services/typesetRequestService.js';
import TypesetStatusBadge from '../../components/ui/TypesetStatusBadge.jsx';
import { supabase } from '../../supabaseClient';
import { useSubmission } from '../../context/SubmissionContext';

const ManageQuestions = () => {
  const [activeTab, setActiveTab] = useState('questions'); // 'questions', 'typesets', or 'typeset-requests'
  const [questions, setQuestions] = useState([]);
  const [typesets, setTypesets] = useState([]);
  const [typesetRequests, setTypesetRequests] = useState([]);
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
    } else if (activeTab === 'typeset-requests') {
      loadTypesetRequests();
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

  const loadTypesetRequests = async () => {
    try {
      setLoading(true);
      const data = await getAllTypesetRequests();
      setTypesetRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading typeset requests:', error);
      showOverlay({
        status: 'error',
        message: 'Failed to load typeset requests',
        autoClose: true,
        autoCloseDelay: 3000
      });
    } finally {
      setLoading(false);
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
          <TabButton
            value="typeset-requests"
            label="Typeset Requests"
            icon={Inbox}
            count={typesetRequests.length}
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
      ) : activeTab === 'typesets' ? (
        <TypesetsManagementSection
          typesets={typesets}
          loading={loading}
          onRefresh={loadTypesetsForQuestions}
        />
      ) : (
        <TypesetRequestsManagementSection
          typesetRequests={typesetRequests}
          loading={loading}
          onRefresh={loadTypesetRequests}
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
              Delete {type === 'question' ? 'Question' : type === 'typeset' ? 'Typeset' : 'Typeset Request'}?
            </h3>
          </div>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this {type === 'question' ? 'question' : type === 'typeset' ? 'typeset' : 'typeset request'}? This action cannot be undone.
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
              ) : type === 'typeset' ? (
                <>
                  <p><span className="font-medium">File:</span> {item.fileName || 'Unnamed'}</p>
                  <p><span className="font-medium">Subject:</span> {item.question?.subject?.name || 'N/A'}</p>
                  <p><span className="font-medium">Version:</span> v{item.version}</p>
                  <p className="font-mono text-xs text-gray-500">ID: {item.id?.substring(0, 16)}...</p>
                </>
              ) : (
                <>
                  <p><span className="font-medium">Request ID:</span> #{String(item.id || 'N/A')}</p>
                  <p><span className="font-medium">User:</span> {String(item.userName || 'Unknown')}</p>
                  <p><span className="font-medium">Status:</span> {String(item.status || 'N/A')}</p>
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

// ========================
// Typeset Requests Management Section
// ========================
const TypesetRequestsManagementSection = ({ typesetRequests, loading, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });
  const [viewDetailsModal, setViewDetailsModal] = useState({ isOpen: false, request: null });
  const { showOverlay } = useSubmission();
  const pageSize = 25;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter and search
  const filteredRequests = React.useMemo(() => {
    const searchLower = debouncedSearchTerm.toLowerCase();
    let filtered = typesetRequests;

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Search filter
    if (searchLower) {
      filtered = filtered.filter(r => {
        const metadata = typeof r.paperMetadata === 'string' 
          ? JSON.parse(r.paperMetadata || '{}') 
          : r.paperMetadata || {};
        
        const subjectStr = typeof metadata.subject === 'object' ? metadata.subject?.name : metadata.subject;
        const examTypeStr = typeof metadata.examType === 'object' ? metadata.examType?.name : metadata.examType;
        
        return (
          r.id?.toString().includes(searchLower) ||
          r.userName?.toLowerCase().includes(searchLower) ||
          r.userEmail?.toLowerCase().includes(searchLower) ||
          subjectStr?.toLowerCase().includes(searchLower) ||
          examTypeStr?.toLowerCase().includes(searchLower) ||
          r.status?.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [typesetRequests, debouncedSearchTerm, statusFilter]);

  // Pagination
  const { totalPages, paginatedRequests } = React.useMemo(() => {
    const total = Math.ceil(filteredRequests.length / pageSize);
    const paginated = filteredRequests.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
    return { totalPages: total, paginatedRequests: paginated };
  }, [filteredRequests, currentPage]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, statusFilter]);

  const handleViewDetails = (request) => {
    setViewDetailsModal({ isOpen: true, request });
  };

  const handleDelete = (request) => {
    setDeleteModal({ isOpen: true, item: request });
  };

  const confirmDelete = async () => {
    const requestId = deleteModal.item?.id;
    if (!requestId) return;

    setDeleteModal({ isOpen: false, item: null });
    showOverlay({
      status: 'loading',
      message: 'Deleting typeset request...',
      autoClose: false
    });

    try {
      await deleteQuestion(requestId); // Will use deleteTypesetRequest in actual implementation
      showOverlay({
        status: 'success',
        message: 'Typeset request deleted successfully',
        autoClose: true,
        autoCloseDelay: 3000
      });
      await onRefresh();
    } catch (error) {
      console.error('Error deleting typeset request:', error);
      showOverlay({
        status: 'error',
        message: error.response?.data?.message || 'Failed to delete typeset request',
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
            <p className="text-gray-600">Loading typeset requests...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <Card>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
          <div className="flex-1 flex items-center gap-3">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Request ID, user name, subject, exam type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="InProgress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Rejected">Rejected</option>
            </select>
            <Button variant="outline" size="small" onClick={onRefresh}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Requests List */}
      <Card>
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Typeset Requests Found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'All' 
                ? 'Try adjusting your search or filter criteria' 
                : 'No typeset requests have been submitted yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Request ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Paper Details</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Requested</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedRequests.map((request) => (
                  <TypesetRequestTableRow 
                    key={request.id} 
                    request={request} 
                    onViewDetails={handleViewDetails}
                    onDelete={handleDelete}
                    onRefresh={onRefresh}
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
        type="typeset request"
      />

      <ViewDetailsModal
        isOpen={viewDetailsModal.isOpen}
        onClose={() => setViewDetailsModal({ isOpen: false, request: null })}
        request={viewDetailsModal.request}
        onRefresh={onRefresh}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {typesetRequests.filter(r => r.status === 'Pending').length}
            </p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {typesetRequests.filter(r => r.status === 'InProgress').length}
            </p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {typesetRequests.filter(r => r.status === 'Completed').length}
            </p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {typesetRequests.filter(r => r.status === 'Rejected').length}
            </p>
            <p className="text-sm text-gray-600">Rejected</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

// Table Row Component for Typeset Requests
const TypesetRequestTableRow = React.memo(({ request, onViewDetails, onDelete, onRefresh }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { showOverlay } = useSubmission();

  const metadata = React.useMemo(() => {
    try {
      return typeof request.paperMetadata === 'string' 
        ? JSON.parse(request.paperMetadata || '{}') 
        : request.paperMetadata || {};
    } catch {
      return {};
    }
  }, [request.paperMetadata]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === request.status) return;

    setIsUpdating(true);
    showOverlay({
      status: 'loading',
      message: `Updating status to ${newStatus}...`,
      autoClose: false
    });

    try {
      await updateTypesetRequestStatus(request.id, {
        status: newStatus,
        adminNotes: '', // Can add admin notes in ViewDetailsModal
        adminProcessedBy: null // Will use logged-in admin email from backend
      });

      showOverlay({
        status: 'success',
        message: 'Status updated successfully. User will receive a notification.',
        autoClose: true,
        autoCloseDelay: 3000
      });

      await onRefresh();
    } catch (error) {
      console.error('Error updating status:', error);
      showOverlay({
        status: 'error',
        message: error.response?.data?.message || 'Failed to update status',
        autoClose: true,
        autoCloseDelay: 3000
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <span className="font-mono text-sm text-gray-900">#{request.id}</span>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm">
          <div className="font-medium text-gray-900">{request.userName || 'Unknown'}</div>
          <div className="text-gray-500 text-xs">{request.userEmail || 'N/A'}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {(typeof metadata.subject === 'object' ? metadata.subject?.name : metadata.subject) || 'Unknown'} - {(typeof metadata.examType === 'object' ? metadata.examType?.name : metadata.examType) || 'Unknown'}
          </div>
          <div className="text-gray-500 text-xs">
            {(typeof metadata.school === 'object' ? metadata.school?.name : metadata.school) || 'N/A'} • {metadata.year || 'N/A'}
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <select
          value={request.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={isUpdating}
          className={`text-sm px-2 py-1 border rounded ${
            request.status === 'Pending' ? 'border-yellow-300 bg-yellow-50' :
            request.status === 'InProgress' ? 'border-blue-300 bg-blue-50' :
            request.status === 'Completed' ? 'border-green-300 bg-green-50' :
            'border-red-300 bg-red-50'
          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <option value="Pending">⏳ Pending</option>
          <option value="InProgress">🔄 In Progress</option>
          <option value="Completed">✅ Completed</option>
          <option value="Rejected">❌ Rejected</option>
        </select>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-gray-600">{formatDate(request.requestedAt)}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="small"
            onClick={() => onViewDetails(request)}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="small"
            onClick={() => onDelete(request)}
            className="text-red-600 hover:text-red-800"
            title="Delete Request"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
});

TypesetRequestTableRow.displayName = 'TypesetRequestTableRow';

// View Details Modal
const ViewDetailsModal = ({ isOpen, onClose, request, onRefresh }) => {
  const [adminNotes, setAdminNotes] = useState('');
  const [status, setStatus] = useState('Pending');
  const [isSaving, setIsSaving] = useState(false);
  const { showOverlay } = useSubmission();

  useEffect(() => {
    if (request) {
      setStatus(request.status || 'Pending');
      setAdminNotes(request.adminNotes || '');
    }
  }, [request]);

  if (!isOpen || !request) return null;

  const metadata = (() => {
    try {
      return typeof request.paperMetadata === 'string' 
        ? JSON.parse(request.paperMetadata || '{}') 
        : request.paperMetadata || {};
    } catch {
      return {};
    }
  })();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    showOverlay({
      status: 'loading',
      message: 'Saving changes...',
      autoClose: false
    });

    try {
      await updateTypesetRequestStatus(request.id, {
        status,
        adminNotes,
        adminProcessedBy: null // Will use logged-in admin email from backend
      });

      showOverlay({
        status: 'success',
        message: 'Changes saved successfully. User will receive a notification.',
        autoClose: true,
        autoCloseDelay: 3000
      });

      await onRefresh();
      onClose();
    } catch (error) {
      console.error('Error saving changes:', error);
      showOverlay({
        status: 'error',
        message: error.response?.data?.message || 'Failed to save changes',
        autoClose: true,
        autoCloseDelay: 3000
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Typeset Request Details</h2>
              <p className="text-sm text-gray-600 mt-1">Request ID: #{request.id}</p>
            </div>
            <TypesetStatusBadge status={request.status} />
          </div>

          {/* User Info */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">User Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-sm font-medium text-gray-900">{request.userName || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-sm font-medium text-gray-900">{request.userEmail || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Paper Metadata */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Paper Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Subject</p>
                <p className="text-sm font-medium text-gray-900">{(typeof metadata.subject === 'object' ? metadata.subject?.name : metadata.subject) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Exam Type</p>
                <p className="text-sm font-medium text-gray-900">{(typeof metadata.examType === 'object' ? metadata.examType?.name : metadata.examType) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">School</p>
                <p className="text-sm font-medium text-gray-900">{(typeof metadata.school === 'object' ? metadata.school?.name : metadata.school) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Year</p>
                <p className="text-sm font-medium text-gray-900">{metadata.year || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Country</p>
                <p className="text-sm font-medium text-gray-900">{(typeof metadata.country === 'object' ? metadata.country?.name : metadata.country) || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="text-sm font-medium text-gray-900">{metadata.totalQuestions || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* User Message */}
          {request.userMessage && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Message</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{request.userMessage}</p>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Requested At</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(request.requestedAt)}</p>
              </div>
              {request.completedAt && (
                <div>
                  <p className="text-sm text-gray-600">Completed At</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(request.completedAt)}</p>
                </div>
              )}
            </div>
            {request.adminProcessedBy && (
              <div className="mt-3">
                <p className="text-sm text-gray-600">Processed By</p>
                <p className="text-sm font-medium text-gray-900">{request.adminProcessedBy}</p>
              </div>
            )}
          </div>

          {/* Admin Controls */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Controls</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  disabled={isSaving}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pending">⏳ Pending</option>
                  <option value="InProgress">🔄 In Progress</option>
                  <option value="Completed">✅ Completed</option>
                  <option value="Rejected">❌ Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={isSaving}
                  rows={4}
                  placeholder="Add notes about this request (visible to user if rejected)..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ManageQuestions;
