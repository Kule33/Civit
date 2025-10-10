// frontend/src/components/Papers/PaperUpload.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { useMetadata } from '../../hooks/useMetadata';
import { useSubmission } from '../../context/SubmissionContext';
import Card from '../ui/card';
import Button from '../ui/Button';
import SelectField from '../ui/SelectField';
import InputField from '../ui/InputField';
import SearchableSelect from '../ui/SearchableSelect';
import { uploadPaperToCloudinary, savePaperMetadata } from '../../services/paperService';
import { getSubjectName } from '../../utils/subjectMapping';

const PaperUpload = () => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { showOverlay } = useSubmission();
  const { user, userProfile } = useAuth();

  const {
    metadata,
    availableOptions,
    updateMetadata,
    validateMetadata,
    resetMetadata,
    refreshSchools
  } = useMetadata({
    country: 'sri_lanka',
    uploader: userProfile?.email || user?.email || ''
  });

  // Update uploader field when user data loads
  useEffect(() => {
    const uploaderEmail = userProfile?.email || user?.email;
    if (uploaderEmail && !metadata.uploader) {
      updateMetadata('uploader', uploaderEmail);
    }
  }, [user, userProfile, metadata.uploader, updateMetadata]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate PDF
      if (file.type !== 'application/pdf') {
        showOverlay({
          status: 'error',
          message: 'Please select a PDF file only.',
          autoClose: true,
          autoCloseDelay: 3000
        });
        return;
      }
      
      // Validate size (max 10MB for Cloudinary free plan)
      if (file.size > 10 * 1024 * 1024) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        showOverlay({
          status: 'error',
          message: `File size (${fileSizeMB}MB) exceeds the 10MB limit. Please compress your PDF or upgrade the Cloudinary plan.`,
          autoClose: true,
          autoCloseDelay: 5000
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      showOverlay({
        status: 'error',
        message: 'Please select a PDF file to upload.',
        autoClose: true,
        autoCloseDelay: 3000
      });
      return;
    }

    if (!validateMetadata()) {
      showOverlay({
        status: 'error',
        message: 'Please fill in all required metadata fields.',
        autoClose: true,
        autoCloseDelay: 3000
      });
      return;
    }

    try {
      setUploading(true);
      showOverlay({
        status: 'loading',
        message: 'Uploading paper to Cloudinary...',
        autoClose: false
      });

      // Upload to Cloudinary
      const uploadResult = await uploadPaperToCloudinary(selectedFile, metadata, setUploadProgress);
      
      // Prepare metadata for backend (convert subject value to name)
      const paperData = {
        ...metadata,
        subject: metadata.subject ? getSubjectName(metadata.subject) : null,
        fileUrl: uploadResult.secureUrl,
        filePublicId: uploadResult.publicId,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        fileFormat: uploadResult.fileFormat
      };
      
      // Save to backend
      await savePaperMetadata(paperData);

      showOverlay({
        status: 'success',
        message: 'Paper uploaded successfully!',
        autoClose: true,
        autoCloseDelay: 3000
      });

      // Reset form
      setSelectedFile(null);
      resetMetadata();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await refreshSchools();

    } catch (error) {
      console.error('Upload error:', error);
      showOverlay({
        status: 'error',
        message: `Upload failed: ${error.message}`,
        autoClose: true,
        autoCloseDelay: 5000
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - File Upload */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="text-lg font-semibold mb-4">Upload Paper (PDF)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select PDF File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  icon={Upload}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  Choose PDF File
                </Button>
              </div>

              {/* Selected File Display */}
              {selectedFile && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <FileText className="w-10 h-10 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatFileSize(selectedFile.size)}
                        </p>
                        {uploadProgress > 0 && uploadProgress < 100 && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{uploadProgress}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="ml-2 p-1 hover:bg-red-100 rounded-full transition-colors"
                      disabled={uploading}
                    >
                      <X className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right column - Metadata Form */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-lg font-semibold mb-4">Paper Metadata</h2>
            
            {/* Country Info Banner */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">📍 Country:</span> Sri Lanka (Automatically set)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Exam Type */}
              {metadata.country && (
                <div className="col-span-2">
                  <SelectField
                    label="Exam Type *"
                    value={metadata.examType}
                    onChange={(e) => updateMetadata('examType', e.target.value)}
                    options={[
                      { value: '', label: 'Select Exam Type' },
                      ...(availableOptions.examTypes || [])
                    ]}
                    required
                  />
                </div>
              )}

              {/* Stream (only for A/L) */}
              {metadata.examType === 'a_level' && (
                <div className="col-span-2">
                  <SelectField
                    label="Stream *"
                    value={metadata.stream}
                    onChange={(e) => updateMetadata('stream', e.target.value)}
                    options={[
                      { value: '', label: 'Select Stream' },
                      ...(availableOptions.streams || [])
                    ]}
                    required
                  />
                </div>
              )}

              {/* Subject */}
              {(metadata.examType && metadata.examType !== 'grade5' && (metadata.stream || metadata.examType === 'o_level')) && (
                <div className="col-span-2">
                  <SelectField
                    label="Subject *"
                    value={metadata.subject}
                    onChange={(e) => updateMetadata('subject', e.target.value)}
                    options={[
                      { value: '', label: 'Select Subject' },
                      ...(availableOptions.subjects || [])
                    ]}
                    required
                  />
                </div>
              )}

              {/* Paper Type for Science Subjects */}
              {['physics', 'chemistry', 'biology'].includes(metadata.subject) && (
                <div className="col-span-2">
                  <SelectField
                    label="Paper Type *"
                    value={metadata.paperType}
                    onChange={(e) => updateMetadata('paperType', e.target.value)}
                    options={[
                      { value: '', label: 'Select Paper Type' },
                      ...(availableOptions.paperTypes || [])
                    ]}
                    required
                  />
                </div>
              )}

              {/* Paper Type for Grade 5 */}
              {metadata.examType === 'grade5' && (
                <div className="col-span-2">
                  <SelectField
                    label="Paper Type *"
                    value={metadata.paperType}
                    onChange={(e) => updateMetadata('paperType', e.target.value)}
                    options={[
                      { value: '', label: 'Select Paper Type' },
                      ...(availableOptions.paperTypes || [])
                    ]}
                    required
                  />
                </div>
              )}

              {/* Paper Category */}
              <div className="col-span-2">
                <SelectField
                  label="Paper Category *"
                  value={metadata.paperCategory}
                  onChange={(e) => updateMetadata('paperCategory', e.target.value)}
                  options={[
                    { value: '', label: 'Select Category' },
                    { value: 'Model', label: 'Model Paper' },
                    { value: 'PastPaper', label: 'Past Paper' },
                    { value: 'TermTest', label: 'Term Test' }
                  ]}
                  required
                />
              </div>

              {/* Year for Past Papers */}
              {metadata.paperCategory === 'PastPaper' && (
                <div className="col-span-2">
                  <InputField
                    label="Year"
                    type="number"
                    min="2000"
                    max="2030"
                    value={metadata.year}
                    onChange={(e) => updateMetadata('year', e.target.value)}
                    placeholder="e.g., 2024"
                  />
                </div>
              )}

              {/* Term and School for Term Tests */}
              {metadata.paperCategory === 'TermTest' && (
                <>
                  <SelectField
                    label="Term"
                    value={metadata.term}
                    onChange={(e) => updateMetadata('term', e.target.value)}
                    options={[
                      { value: '', label: 'Select Term' },
                      { value: 'Term1', label: 'Term 1' },
                      { value: 'Term2', label: 'Term 2' },
                      { value: 'Term3', label: 'Term 3' }
                    ]}
                  />
                  
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      School Name
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <SearchableSelect
                        value={metadata.schoolName}
                        onChange={(e) => updateMetadata('schoolName', e.target.value)}
                        options={[
                          { value: '', label: 'Select School (optional)' },
                          ...(availableOptions.schools?.map(school => ({ value: school.name, label: school.name })) || [])
                        ]}
                        placeholder="Search or Select School (optional)"
                      />
                      <input
                        type="text"
                        value={metadata.schoolName}
                        onChange={(e) => updateMetadata('schoolName', e.target.value)}
                        placeholder="Or type school name manually"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="col-span-2">
                <InputField
                  label="Uploader Email (Auto-filled)"
                  value={metadata.uploader}
                  onChange={(e) => updateMetadata('uploader', e.target.value)}
                  placeholder="Your email will be automatically filled"
                  disabled={true}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Your email is automatically recorded as the uploader
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Upload Button */}
      <Button 
        type="submit" 
        variant="primary" 
        size="large" 
        icon={Upload} 
        className="w-full"
        disabled={uploading || !selectedFile}
      >
        {uploading ? 'Uploading...' : 'Upload Paper'}
      </Button>
    </form>
  );
};

export default PaperUpload;
