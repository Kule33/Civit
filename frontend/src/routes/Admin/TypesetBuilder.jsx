// frontend/src/routes/Admin/TypesetBuilder.jsx
import React, { useState } from 'react';
import { Search, Download, FileText, CheckSquare, Square, AlertCircle, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Card from '../../components/ui/card.jsx';
import Button from '../../components/ui/Button.jsx';
import { searchQuestions } from '../../services/questionService';
import { mergeDocuments, getTypesetByQuestionId } from '../../services/typesetService';
import { supabase } from '../../supabaseClient';

const TypesetBuilder = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [allQuestions, setAllQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25); // Show 25 items per page

  // Load all questions on mount
  React.useEffect(() => {
    loadAllQuestions();
  }, []);

  // Filter questions as user types
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredQuestions(allQuestions);
      setCurrentPage(1); // Reset to page 1 when clearing search
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    const filtered = allQuestions.filter(q => {
      return (
        q.id?.toLowerCase().includes(query) ||
        q.subject?.name?.toLowerCase().includes(query) ||
        q.school?.name?.toLowerCase().includes(query) ||
        q.school?.country?.toLowerCase().includes(query) ||
        q.examType?.toLowerCase().includes(query) ||
        q.year?.toString().includes(query) ||
        q.stream?.toLowerCase().includes(query) ||
        q.paperType?.toLowerCase().includes(query)
      );
    });
    
    setFilteredQuestions(filtered);
    setCurrentPage(1); // Reset to page 1 when search changes
  }, [searchQuery, allQuestions]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  const loadAllQuestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First, get all questions
      const params = new URLSearchParams();
      const results = await searchQuestions(params);
      const allQuestionsData = results.items || results || [];
      
      // Filter only questions that have typesets (Word documents)
      const questionsWithTypesets = allQuestionsData.filter(q => q.typesetAvailable);
      
      if (questionsWithTypesets.length === 0) {
        setError('No typeset documents available. Upload typesets first from the Typeset Upload page.');
        setAllQuestions([]);
        setFilteredQuestions([]);
        return;
      }

      // Fetch actual typeset details for each question with typesets
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Authentication required');
        return;
      }

      const typesetPromises = questionsWithTypesets.map(async (q) => {
        const typeset = await getTypesetByQuestionId(q.id, token);
        if (typeset) {
          return {
            ...q,
            typesetId: typeset.id,
            typesetUrl: typeset.fileUrl,
            typesetFileName: typeset.fileName,
            typesetVersion: typeset.version
          };
        }
        return null;
      });

      const questionsWithTypesetDetails = (await Promise.all(typesetPromises)).filter(q => q !== null);
      
      setAllQuestions(questionsWithTypesetDetails);
      setFilteredQuestions(questionsWithTypesetDetails);
      
      if (questionsWithTypesetDetails.length === 0) {
        setError('No typeset documents found');
      }
    } catch (err) {
      console.error('Failed to load typesets:', err);
      setError('Failed to load typeset documents. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file selection toggle
  const toggleFileSelection = (file) => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  // Select all files
  const selectAll = () => {
    setSelectedFiles(filteredQuestions);
  };

  // Deselect all files
  const deselectAll = () => {
    setSelectedFiles([]);
  };

  // Handle merge and download
  const handleMergeAndDownload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to merge');
      return;
    }

    setIsMerging(true);
    setError(null);

    try {
      // Extract the typeset URLs from selected files (use typesetUrl, not fileUrl)
      const fileUrls = selectedFiles.map(file => file.typesetUrl);
      
      console.log('Merging typesets:', fileUrls);
      
      // Call the merge API
      const blob = await mergeDocuments(fileUrls);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `merged_typeset_${Date.now()}.docx`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Reset selection and show success in UI
      const mergedCount = selectedFiles.length;
      setSelectedFiles([]);
      setError(null);
      setSuccessMessage(`Successfully merged ${mergedCount} typeset document(s)! Download started.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Merge error:', err);
      setError(err.message || 'Failed to merge documents. Please try again.');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Typeset Builder"
        subtitle="Select multiple typeset Word documents and merge them into a single file for easy distribution"
      />

      {/* Search Section */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by question ID, subject, school, year, exam type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-sm"
              disabled={isLoading}
            />
            {isLoading && <Loader className="h-5 w-5 animate-spin text-blue-600" />}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Download className="h-5 w-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Selection Controls */}
      {filteredQuestions.length > 0 && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{selectedFiles.length}</span> of{' '}
                <span className="font-semibold text-gray-900">{filteredQuestions.length}</span> files selected
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="small" 
                  onClick={selectAll}
                  disabled={selectedFiles.length === filteredQuestions.length}
                >
                  Select All
                </Button>
                <Button 
                  variant="outline" 
                  size="small" 
                  onClick={deselectAll}
                  disabled={selectedFiles.length === 0}
                >
                  Deselect All
                </Button>
              </div>
            </div>

            <Button
              onClick={handleMergeAndDownload}
              disabled={selectedFiles.length === 0 || isMerging}
              variant="primary"
              className="bg-green-600 hover:bg-green-700"
            >
              {isMerging ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Merging...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Merge & Download ({selectedFiles.length})
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Search Results */}
      {filteredQuestions.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {searchQuery ? `Search Results (${filteredQuestions.length})` : `All Questions (${filteredQuestions.length})`}
              </h3>
              {totalPages > 1 && (
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              {paginatedQuestions.map((file) => {
                const isSelected = selectedFiles.some(f => f.id === file.id);
                return (
                  <div
                    key={file.id}
                    onClick={() => toggleFileSelection(file)}
                    className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckSquare className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Square className="h-6 w-6 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <FileText className={`h-10 w-10 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 truncate">
                          {file.subject?.name || 'Unknown Subject'}
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          <FileText className="h-3 w-3 mr-1" />
                          Typeset v{file.typesetVersion || 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>{file.school?.name || 'Unknown School'}</span>
                        <span>•</span>
                        <span>{file.year || 'N/A'}</span>
                        <span>•</span>
                        <span>{file.examType || 'N/A'}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        📄 {file.typesetFileName || 'Typeset Document'}
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(file.typesetUrl, '_blank');
                        }}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        Preview
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  size="small"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {filteredQuestions.length === 0 && !isLoading && (
        <Card>
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No Matching Files Found' : 'No Files Available'}
            </h3>
            <p className="text-gray-600">
              {searchQuery 
                ? 'Try adjusting your search criteria' 
                : 'No Word files are available in the system'}
            </p>
          </div>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <div className="text-center py-12">
            <Loader className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Questions...</h3>
            <p className="text-gray-600">Please wait while we fetch the available files</p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default TypesetBuilder;
