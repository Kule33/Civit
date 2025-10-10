// frontend/src/components/Papers/PapersList.jsx
import React, { useState } from 'react';
import { Search, Download, Eye, FileText, Filter, X } from 'lucide-react';
import { useMetadata } from '../../hooks/useMetadata';
import { useSubmission } from '../../context/SubmissionContext';
import Card from '../ui/card';
import Button from '../ui/Button';
import SelectField from '../ui/SelectField';
import InputField from '../ui/InputField';
import SearchableSelect from '../ui/SearchableSelect';
import { searchPapers, downloadPaper } from '../../services/paperService';
import { getSubjectName } from '../../utils/subjectMapping';

const PapersList = () => {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isFiltersMinimized, setIsFiltersMinimized] = useState(false);
  const [previewPaper, setPreviewPaper] = useState(null);

  const { showOverlay } = useSubmission();
  
  const {
    metadata,
    availableOptions,
    updateMetadata,
    resetMetadata,
    loading: metadataLoading
  } = useMetadata({
    country: 'sri_lanka'
  });

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Transform subject value to name before searching
      const searchData = {
        ...metadata,
        subject: metadata.subject ? getSubjectName(metadata.subject) : null
      };

      // Search for papers
      const results = await searchPapers(searchData);
      setPapers(results);
      setSearchPerformed(true);
    } catch (error) {
      console.error('Search error:', error);
      showOverlay({
        status: 'error',
        message: 'Failed to search papers',
        autoClose: true,
        autoCloseDelay: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (paper) => {
    try {
      // Track download
      await downloadPaper(paper.id);
      
      // Fetch the file and download it
      const response = await fetch(paper.fileUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = paper.fileName || 'paper.pdf';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download error:', error);
      showOverlay({
        status: 'error',
        message: 'Failed to download paper',
        autoClose: true,
        autoCloseDelay: 3000
      });
    }
  };

  const handlePreview = (paper) => {
    console.log('Previewing paper:', paper);
    console.log('File URL:', paper.fileUrl);
    setPreviewPaper(paper);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Search Papers</h2>
          <Button
            variant="outline"
            size="small"
            icon={Filter}
            onClick={() => setIsFiltersMinimized(!isFiltersMinimized)}
          >
            {isFiltersMinimized ? 'Show Filters' : 'Hide Filters'}
          </Button>
        </div>

        {!isFiltersMinimized && (
          <>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">📍 Searching in:</span> Sri Lanka (Default)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Exam Type */}
              {metadata.country && (
                <SelectField
                  label="Exam Type"
                  value={metadata.examType}
                  onChange={(e) => updateMetadata('examType', e.target.value)}
                  options={[
                    { value: '', label: 'All Exam Types' },
                    ...(availableOptions.examTypes || [])
                  ]}
                />
              )}

              {/* Stream */}
              {metadata.examType === 'a_level' && (
                <SelectField
                  label="Stream"
                  value={metadata.stream}
                  onChange={(e) => updateMetadata('stream', e.target.value)}
                  options={[
                    { value: '', label: 'All Streams' },
                    ...(availableOptions.streams || [])
                  ]}
                />
              )}

              {/* Subject */}
              {(metadata.examType && metadata.examType !== 'grade5' && (metadata.stream || metadata.examType === 'o_level')) && (
                <SelectField
                  label="Subject"
                  value={metadata.subject}
                  onChange={(e) => updateMetadata('subject', e.target.value)}
                  options={[
                    { value: '', label: 'All Subjects' },
                    ...(availableOptions.subjects || [])
                  ]}
                />
              )}

              {/* Paper Type - Only for Science subjects or Grade 5 */}
              {((['physics', 'chemistry', 'biology'].includes(metadata.subject)) || metadata.examType === 'grade5') && (
                <SelectField
                  label="Paper Type"
                  value={metadata.paperType}
                  onChange={(e) => updateMetadata('paperType', e.target.value)}
                  options={[
                    { value: '', label: 'All Paper Types' },
                    ...(availableOptions.paperTypes || [])
                  ]}
                />
              )}

              {/* Paper Category */}
              <SelectField
                label="Paper Category"
                value={metadata.paperCategory}
                onChange={(e) => updateMetadata('paperCategory', e.target.value)}
                options={[
                  { value: '', label: 'All Categories' },
                  { value: 'Model', label: 'Model Paper' },
                  { value: 'PastPaper', label: 'Past Paper' },
                  { value: 'TermTest', label: 'Term Test' }
                ]}
              />

              {/* Year */}
              {metadata.paperCategory === 'PastPaper' && (
                <InputField
                  label="Year"
                  type="number"
                  min="2000"
                  max="2030"
                  value={metadata.year || ''}
                  onChange={(e) => updateMetadata('year', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="All Years"
                />
              )}

              {/* Term and School */}
              {metadata.paperCategory === 'TermTest' && (
                <>
                  <SelectField
                    label="Term"
                    value={metadata.term}
                    onChange={(e) => updateMetadata('term', e.target.value)}
                    options={[
                      { value: '', label: 'All Terms' },
                      { value: 'Term1', label: 'Term 1' },
                      { value: 'Term2', label: 'Term 2' },
                      { value: 'Term3', label: 'Term 3' }
                    ]}
                  />

                  <SearchableSelect
                    value={metadata.schoolName}
                    onChange={(e) => updateMetadata('schoolName', e.target.value)}
                    options={[
                      { value: '', label: 'All Schools' },
                      ...(availableOptions.schools?.map(school => ({ value: school.name, label: school.name })) || [])
                    ]}
                    placeholder="All Schools"
                  />
                </>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                variant="primary"
                onClick={handleSearch}
                disabled={loading || metadataLoading}
                icon={Search}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
              <Button variant="outline" onClick={resetMetadata} disabled={loading}>
                Clear
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Results */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">
          Papers {searchPerformed && `(${papers.length} found)`}
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Searching for papers...</p>
          </div>
        ) : searchPerformed && papers.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No papers found matching your criteria.</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters.</p>
          </div>
        ) : papers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {papers.map((paper) => (
              <div
                key={paper.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-white"
              >
                {/* PDF Preview */}
                <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center mb-4 relative group">
                  <FileText className="h-20 w-20 text-gray-400" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg flex items-center justify-center">
                    <Button
                      variant="primary"
                      size="small"
                      icon={Eye}
                      onClick={() => handlePreview(paper)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Preview
                    </Button>
                  </div>
                </div>

                {/* Paper Info */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {paper.subject?.name || 'Unknown Subject'}
                  </h3>
                  <div className="flex flex-wrap gap-1 text-xs">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {paper.examType}
                    </span>
                    {paper.stream && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {paper.stream}
                      </span>
                    )}
                    {paper.paperType && (
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        {paper.paperType}
                      </span>
                    )}
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {paper.paperCategory}
                    </span>
                    {paper.year && (
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                        {paper.year}
                      </span>
                    )}
                    {paper.term && (
                      <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded">
                        {paper.term}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    {paper.school?.name && <p>🏫 {paper.school.name}</p>}
                    <p>📄 {paper.fileName}</p>
                    <p>💾 {formatFileSize(paper.fileSize)}</p>
                    <p>📅 {formatDate(paper.uploadDate)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="primary"
                    size="small"
                    icon={Download}
                    onClick={() => handleDownload(paper)}
                    className="flex-1"
                  >
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="small"
                    icon={Eye}
                    onClick={() => handlePreview(paper)}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start Searching</h3>
            <p className="text-gray-600">Use the filters above to search for papers.</p>
          </div>
        )}
      </Card>

      {/* PDF Preview Modal */}
      {previewPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{previewPaper.fileName}</h3>
              <button
                onClick={() => setPreviewPaper(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`${previewPaper.fileUrl}#toolbar=0`}
                className="w-full h-full"
                title="PDF Preview"
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewPaper(null)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                icon={Download}
                onClick={() => handleDownload(previewPaper)}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PapersList;
