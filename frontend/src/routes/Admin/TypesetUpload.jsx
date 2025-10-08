// frontend/src/routes/Admin/TypesetUpload.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Upload, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import InputField from '../../components/ui/InputField.jsx';
import { upsertTypeset } from '../../services/typesetService';
import { uploadRawWithProgress } from '../../services/cloudinaryService';
import { searchQuestions } from '../../services/questionService.js';
import { supabase } from '../../supabaseClient';
import { useSubmission } from '../../context/SubmissionContext';

const TypesetUpload = () => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'generate'
  const [questionId, setQuestionId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { showOverlay } = useSubmission();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        showOverlay({
          status: 'error',
          message: 'Only .doc, .docx, and .pdf files are allowed',
          autoClose: true,
          autoCloseDelay: 3000
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showOverlay({
          status: 'error',
          message: 'File size must be less than 10MB',
          autoClose: true,
          autoCloseDelay: 3000
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    try {
      if (!questionId) {
        showOverlay({
          status: 'error',
          message: 'Please enter a Question ID',
          autoClose: true,
          autoCloseDelay: 3000
        });
        return;
      }

      if (!selectedFile) {
        showOverlay({
          status: 'error',
          message: 'Please select a file to upload',
          autoClose: true,
          autoCloseDelay: 3000
        });
        return;
      }

      setUploading(true);
      showOverlay({
        status: 'loading',
        message: 'Uploading typeset file to Cloudinary...',
        autoClose: false
      });

      // Get Supabase JWT token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Upload file to Cloudinary as raw (DOCX/PDF)
      const cloudinaryResult = await uploadRawWithProgress(
        selectedFile,
        'typesets',
        (progress) => {
          showOverlay({
            status: 'loading',
            message: `Uploading to Cloudinary... ${progress}%`,
            autoClose: false
          });
        }
      );

      showOverlay({
        status: 'loading',
        message: 'Saving typeset reference to database...',
        autoClose: false
      });

      // Save typeset reference to backend
      const result = await upsertTypeset(
        {
          questionId: questionId,
          fileUrl: cloudinaryResult.secureUrl,
          filePublicId: cloudinaryResult.publicId,
          fileName: cloudinaryResult.fileName
        },
        token
      );

      showOverlay({
        status: 'success',
        message: `Typeset uploaded successfully! Version: ${result.version}`,
        autoClose: true,
        autoCloseDelay: 3000
      });

      // Reset form
      setQuestionId('');
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('typeset-file-input');
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error) {
      console.error('Typeset upload error:', error);
      showOverlay({
        status: 'error',
        message: error.response?.data?.message || error.message || 'Failed to upload typeset',
        autoClose: true,
        autoCloseDelay: 5000
      });
    } finally {
      setUploading(false);
    }
  };

  // Tab button component
  const TabButton = ({ value, label, icon: Icon }) => (
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
    </button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Typeset Management"
        subtitle="Upload typeset documents or find questions to generate typesets (Admin Only)"
      />

      {/* Tab Navigation */}
      <Card>
        <div className="flex border-b">
          <TabButton
            value="upload"
            label="Upload Typeset"
            icon={Upload}
          />
          <TabButton
            value="generate"
            label="Generate Typeset"
            icon={Plus}
          />
        </div>
      </Card>

      {/* Tab Content */}
      {activeTab === 'upload' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Form */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Upload Typeset File</h2>
            <div className="space-y-4">
              <InputField
                label="Question ID *"
                placeholder="Paste the Question ID here (e.g., 3fa85f64-5717-4562-b3fc-2c963f66afa6)"
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
                disabled={uploading}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typeset File (.doc, .docx, .pdf) *
                </label>
                <input
                  id="typeset-file-input"
                  type="file"
                  accept=".doc,.docx,.pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <Button
                variant="primary"
                size="large"
                icon={Upload}
                onClick={handleUpload}
                disabled={uploading || !questionId || !selectedFile}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Upload Typeset'}
              </Button>
            </div>
          </Card>

          {/* Instructions */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Instructions</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <Search className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">1. Find the Question ID</p>
                  <p className="text-gray-600">
                    Go to Manage Question section or generated paper, search for your question, and click the 
                    <strong className="text-gray-900"> "Question ID" </strong> 
                    link. Paste it below.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <FileText className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">2. Select Typeset File</p>
                  <p className="text-gray-600">
                    Choose the typeset document that corresponds to the question screenshot. 
                    Only .doc, .docx, and .pdf files are supported (max 10MB).
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Upload className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">3. Upload</p>
                  <p className="text-gray-600">
                    Click "Upload Typeset" to save the file. If a typeset already exists for 
                    this question, it will be replaced and the version number will increment.
                  </p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  💡 <strong>Tip:</strong> The <strong>"Copy Question ID"</strong> button is located at the bottom of each question card. 
                  The Question ID is a unique code like <code className="bg-blue-100 px-1 rounded">3fa85f64-5717-4562-b3fc-2c963f66afa6</code>
                </p>
              </div>
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Only administrators can upload typeset files. 
                  Teachers can view and download typesets in the Paper Builder.
                </p>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <GenerateTypesetSection />
      )}
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

// Question Row Component for Generate Typeset
const QuestionRowForTypeset = React.memo(({ question, onSelectQuestion }) => {
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

  const handleGenerateTypeset = () => {
    onSelectQuestion(question);
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
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
            <Plus className="h-3 w-3" />
            Needed
          </span>
        )}
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
          <Button
            variant="primary"
            size="small"
            icon={Plus}
            onClick={handleGenerateTypeset}
            className="text-xs"
          >
            Generate
          </Button>
        </div>
      </td>
    </tr>
  );
});

QuestionRowForTypeset.displayName = 'QuestionRowForTypeset';

// Generate Typeset Section Component
const GenerateTypesetSection = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { showOverlay } = useSubmission();
  const pageSize = 10;

  // Load all questions on mount
  useEffect(() => {
    loadAllQuestions();
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

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

  // Filter questions based on search
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

  // Pagination calculations
  const { totalPages, paginatedQuestions } = React.useMemo(() => {
    const total = Math.ceil(filteredQuestions.length / pageSize);
    const paginated = filteredQuestions.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
    return { totalPages: total, paginatedQuestions: paginated };
  }, [filteredQuestions, currentPage, pageSize]);

  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/pdf'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        showOverlay({
          status: 'error',
          message: 'Only .doc, .docx, and .pdf files are allowed',
          autoClose: true,
          autoCloseDelay: 3000
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showOverlay({
          status: 'error',
          message: 'File size must be less than 10MB',
          autoClose: true,
          autoCloseDelay: 3000
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    try {
      if (!selectedQuestion) {
        showOverlay({
          status: 'error',
          message: 'Please select a question first',
          autoClose: true,
          autoCloseDelay: 3000
        });
        return;
      }

      if (!selectedFile) {
        showOverlay({
          status: 'error',
          message: 'Please select a file to upload',
          autoClose: true,
          autoCloseDelay: 3000
        });
        return;
      }

      setUploading(true);
      showOverlay({
        status: 'loading',
        message: 'Uploading typeset file to Cloudinary...',
        autoClose: false
      });

      // Get Supabase JWT token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Upload file to Cloudinary as raw (DOCX/PDF)
      const cloudinaryResult = await uploadRawWithProgress(
        selectedFile,
        'typesets',
        (progress) => {
          showOverlay({
            status: 'loading',
            message: `Uploading to Cloudinary... ${progress}%`,
            autoClose: false
          });
        }
      );

      showOverlay({
        status: 'loading',
        message: 'Saving typeset reference to database...',
        autoClose: false
      });

      // Save typeset reference to backend
      const result = await upsertTypeset(
        {
          questionId: selectedQuestion.id,
          fileUrl: cloudinaryResult.secureUrl,
          filePublicId: cloudinaryResult.publicId,
          fileName: cloudinaryResult.fileName
        },
        token
      );

      showOverlay({
        status: 'success',
        message: `Typeset uploaded successfully! Version: ${result.version}`,
        autoClose: true,
        autoCloseDelay: 3000
      });

      // Reset form and refresh questions
      setSelectedQuestion(null);
      setSelectedFile(null);
      const fileInput = document.getElementById('generate-typeset-file-input');
      if (fileInput) {
        fileInput.value = '';
      }
      await loadAllQuestions();

    } catch (error) {
      console.error('Typeset upload error:', error);
      showOverlay({
        status: 'error',
        message: error.response?.data?.message || error.message || 'Failed to upload typeset',
        autoClose: true,
        autoCloseDelay: 5000
      });
    } finally {
      setUploading(false);
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
    <div className="space-y-6">
      {selectedQuestion && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">Upload Typeset for Selected Question</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Selected Question:</h3>
                <p className="text-sm text-blue-800 mb-1">
                  <strong>Subject:</strong> {selectedQuestion.subject?.name || 'N/A'}
                </p>
                <p className="text-sm text-blue-800 mb-1">
                  <strong>School:</strong> {selectedQuestion.school?.name || 'N/A'}
                </p>
                <p className="text-sm text-blue-800 mb-1">
                  <strong>Year:</strong> {selectedQuestion.year || 'N/A'}
                </p>
                <p className="text-xs font-mono text-blue-600">
                  ID: {selectedQuestion.id}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typeset File (.doc, .docx, .pdf) *
                </label>
                <input
                  id="generate-typeset-file-input"
                  type="file"
                  accept=".doc,.docx,.pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-l-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {selectedFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  size="large"
                  icon={Upload}
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile}
                  className="flex-1"
                >
                  {uploading ? 'Uploading...' : 'Upload Typeset'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedQuestion(null);
                    setSelectedFile(null);
                    const fileInput = document.getElementById('generate-typeset-file-input');
                    if (fileInput) fileInput.value = '';
                  }}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center">
              <img
                src={selectedQuestion.fileUrl}
                alt="Question Preview"
                className="max-w-full max-h-96 object-contain rounded-lg shadow-lg border"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Search Bar */}
      <Card>
        <div className="flex items-center gap-3">
          <Search className="h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions by ID, subject, school, country, exam type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-sm"
          />
          <Button variant="outline" size="small" onClick={loadAllQuestions}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Questions List */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Select a Question to Generate Typeset</h2>
          <p className="text-sm text-gray-600">Click "Generate" next to a question to upload its typeset document.</p>
        </div>
        
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <Plus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Questions Found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search criteria' : 'No questions available for typeset generation'}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Typeset Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedQuestions.map((question) => (
                  <QuestionRowForTypeset 
                    key={question.id} 
                    question={question} 
                    onSelectQuestion={handleSelectQuestion}
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
            <p className="text-2xl font-bold text-orange-600">
              {questions.filter(q => !q.typesetAvailable).length}
            </p>
            <p className="text-sm text-gray-600">Need Typesets</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TypesetUpload;