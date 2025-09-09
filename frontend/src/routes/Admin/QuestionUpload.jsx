// src/pages/QuestionUpload.jsx
import React, { useRef, useState } from 'react';
import { Upload, Image, FileText, Filter } from 'lucide-react'; // Renamed Image to avoid conflict with HTML <img>
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import InputField from '../../components/ui/InputField.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import FileUploadZone from '../../components/upload/FileUploadZone.jsx';
import UploadQueue from '../../components/upload/UploadQueue.jsx';
import { useFileUpload } from '../../hooks/useFileUpload.js';
import { useMetadata } from '../../hooks/useMetadata.js';
import { testBackendConnection, saveQuestionMetadata } from '../../services/questionService.js';
import { useSubmission } from '../../context/SubmissionContext';
import { uploadWithProgress } from '../../services/cloudinaryService';

const QuestionUpload = () => {
  const fileInputRef = useRef(null);
  const [uploadType, setUploadType] = useState('image');
  const [isTesting, setIsTesting] = useState(false);
  
  // Context for showing global overlays (loading, success, error messages)
  const { showOverlay } = useSubmission();

  // Custom hook for file management (add, remove, track status, etc.)
  const {
    uploadedFiles,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
    addFiles,
    removeFile,
    clearAllFiles,
    updateFileStatus
  } = useFileUpload();

  // Custom hook for managing question metadata and dynamic options
  const {
    metadata,
    availableOptions,
    updateMetadata,
    validateMetadata,
    resetMetadata
  } = useMetadata();

  // Handler for when files are added (either by drag/drop or file input)
  const handleFilesAdded = (files, type) => {
    if (files.length > 0) {
      clearAllFiles(); // Clear previous files if only one is allowed
      addFiles([files[0]], type); // Add the newly selected file
    }
  };

  // Main function to handle the submission of the form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Filter for files that are pending upload
    const filesToUpload = uploadedFiles.filter(f => f.status === 'pending');

    // Basic validation: Ensure exactly one file is selected
    if (filesToUpload.length !== 1) {
      showOverlay({
        status: 'error',
        message: 'Please select exactly one file to upload.',
        autoClose: true,
        autoCloseDelay: 3000
      });
      return;
    }

    // Validate metadata using the custom hook's validation logic
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
      // Show loading overlay for the entire upload process
      showOverlay({
        status: 'loading',
        message: 'Uploading file directly to Cloudinary...',
        autoClose: false // Keep open until success/error
      });

      // Update the status of the file in the queue to 'uploading'
      updateFileStatus(filesToUpload[0].id, { status: 'uploading', progress: 0 });

      // Step 1: Upload the file directly to Cloudinary
      const uploadResult = await uploadWithProgress(
        filesToUpload[0].file, // The actual File object
        {
          // Metadata sent to Cloudinary for folder structuring (optional, but good for organization)
          country: metadata.country,
          examType: metadata.examType,
          stream: metadata.stream,
          subject: metadata.subject,
          paperType: metadata.paperType,
          paperCategory: metadata.paperCategory
        },
        (progress) => {
          // Callback to update file upload progress in the UI
          updateFileStatus(filesToUpload[0].id, { progress });
        }
      );

      // Step 2: Prepare metadata for the backend, handling nullable fields
      const cleanedMetadata = { ...metadata };

      // Convert empty strings to null for C# nullable types (int?, string?)
      if (cleanedMetadata.year === '') {
        cleanedMetadata.year = null; // C# int? expects null or an int, not an empty string
      } else {
        // Ensure year is an actual number if it's not empty, for proper serialization
        // The InputField with type="number" already handles this in most browsers,
        // but this adds robustness.
        const parsedYear = parseInt(cleanedMetadata.year, 10);
        cleanedMetadata.year = isNaN(parsedYear) ? null : parsedYear;
      }
      
      if (cleanedMetadata.term === '') cleanedMetadata.term = null;
      if (cleanedMetadata.schoolName === '') cleanedMetadata.schoolName = null;
      if (cleanedMetadata.uploader === '') cleanedMetadata.uploader = null;
      if (cleanedMetadata.stream === '') cleanedMetadata.stream = null;
      if (cleanedMetadata.subject === '') cleanedMetadata.subject = null;
      if (cleanedMetadata.paperType === '') cleanedMetadata.paperType = null;
      
      // Step 3: Send metadata along with Cloudinary results to your backend
      await saveQuestionMetadata({
        ...cleanedMetadata, // Use the cleaned metadata object
        fileUrl: uploadResult.secureUrl,       // Cloudinary file URL
        filePublicId: uploadResult.publicId,   // Cloudinary public ID for managing the file
        fileName: uploadResult.fileName,       // Original file name
        fileSize: uploadResult.bytes,          // File size in bytes
        fileFormat: uploadResult.format        // File format (e.g., "jpg", "pdf")
      });

      // Show success overlay
      showOverlay({
        status: 'success',
        message: 'File uploaded to Cloudinary and metadata saved!',
        autoClose: true,
        autoCloseDelay: 2000
      });

      // Update file status to 'completed' in the UI
      updateFileStatus(filesToUpload[0].id, { status: 'completed' });
      
      // After a short delay, clear uploaded files and reset form fields
      setTimeout(() => {
        clearAllFiles();
        resetMetadata();
      }, 1500);

    } catch (error) {
      // If any error occurs during upload or metadata save
      console.error("Submission error:", error); // Log full error for debugging
      // Update file status to 'error' in the UI
      updateFileStatus(filesToUpload[0].id, { status: 'error' });
      
      // Show error overlay with details from the backend response if available
      showOverlay({
        status: 'error',
        message: `Upload failed: ${error.response?.data?.title || error.message || 'Unknown error'}`,
        autoClose: true,
        autoCloseDelay: 5000 // Give more time to read error
      });
    }
  };

  // Function to test backend connection (for debugging/development)
  const testConnection = async () => {
    setIsTesting(true);
    try {
      await testBackendConnection();
      alert('✅ Backend connection successful!');
    } catch (error) {
      alert('❌ Backend connection failed. Check console for details.');
      console.error('Backend connection error:', error);
    }
    setIsTesting(false);
  };

  // Handler for metadata field changes
  const handleMetadataChange = (field, value) => {
    updateMetadata(field, value);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question Upload"
        subtitle="Upload questions and add metadata for better organization"
        actions={
          <div className="flex space-x-2">
            <Button 
              variant="secondary" 
              icon={Filter}
              onClick={() => alert('Manage questions feature coming soon')}
            >
              Manage Questions
            </Button>
            <Button 
              variant="outline" 
              onClick={testConnection}
              disabled={isTesting}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold mb-4">Upload Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Type</label>
                <div className="flex space-x-4">
                  {['image', 'document'].map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={uploadType === type ? 'primary' : 'outline'}
                      size="small"
                      icon={type === 'image' ? Image : FileText}
                      onClick={() => setUploadType(type)}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File (Single File Only)
                </label>
                <FileUploadZone
                  uploadType={uploadType}
                  isDragging={isDragging}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, uploadType, handleFilesAdded)}
                  onFileInput={(e) => handleFileInput(e, uploadType, handleFilesAdded)}
                  inputRef={fileInputRef}
                  files={uploadedFiles}
                />
              </div>
            </div>
          </Card>

          {/* METADATA FORM SECTION */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Question Metadata</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Country Selection */}
              <div className="col-span-2">
                <SelectField
                  label="Country *"
                  value={metadata.country}
                  onChange={(e) => handleMetadataChange('country', e.target.value)}
                  options={[
                    { value: '', label: 'Select Country' },
                    { value: 'sri_lanka', label: 'Sri Lanka' },
                    { value: 'other', label: 'Other' }
                  ]}
                  required
                />
              </div>

              {/* Exam Type (only show if country is selected) */}
              {metadata.country && (
                <div className="col-span-2">
                  <SelectField
                    label="Exam Type *"
                    value={metadata.examType}
                    onChange={(e) => handleMetadataChange('examType', e.target.value)}
                    options={[
                      { value: '', label: 'Select Exam Type' },
                      ...(availableOptions.examTypes || [])
                    ]}
                    required
                  />
                </div>
              )}

              {/* Stream Selection (only for A/L, not for Grade 5) */}
              {metadata.examType === 'a_level' && (
                <div className="col-span-2">
                  <SelectField
                    label="Stream *"
                    value={metadata.stream}
                    onChange={(e) => handleMetadataChange('stream', e.target.value)}
                    options={[
                      { value: '', label: 'Select Stream' },
                      ...(availableOptions.streams || [])
                    ]}
                    required
                  />
                </div>
              )}

              {/* Subject Selection (show for A/L and O/L, but NOT for Grade 5) */}
              {(metadata.examType && metadata.examType !== 'grade5' && (metadata.stream || metadata.examType === 'o_level')) && (
                <div className="col-span-2">
                  <SelectField
                    label="Subject *"
                    value={metadata.subject}
                    onChange={(e) => handleMetadataChange('subject', e.target.value)}
                    options={[
                      { value: '', label: 'Select Subject' },
                      ...(availableOptions.subjects || [])
                    ]}
                    // Subject is not required for Grade 5
                    required={metadata.examType !== 'grade5' && !!(metadata.stream || metadata.examType === 'o_level')}
                  />
                </div>
              )}

              {/* Paper Type for Science Subjects (Physics, Chemistry, Biology) */}
              {['physics', 'chemistry', 'biology'].includes(metadata.subject) && (
                <div className="col-span-2">
                  <SelectField
                    label="Paper Type *"
                    value={metadata.paperType}
                    onChange={(e) => handleMetadataChange('paperType', e.target.value)}
                    options={[
                      { value: '', label: 'Select Paper Type' },
                      ...(availableOptions.paperTypes || [])
                    ]}
                    required
                  />
                </div>
              )}

              {/* Paper Type for Grade 5 Scholarship (always show when Grade 5 is selected) */}
              {metadata.examType === 'grade5' && (
                <div className="col-span-2">
                  <SelectField
                    label="Paper Type *"
                    value={metadata.paperType}
                    onChange={(e) => handleMetadataChange('paperType', e.target.value)}
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
                  onChange={(e) => handleMetadataChange('paperCategory', e.target.value)}
                  options={[
                    { value: '', label: 'Select Category' },
                    { value: 'Model', label: 'Model Paper' },
                    { value: 'PastPaper', label: 'Past Paper' },
                    { value: 'TermTest', label: 'Term Test' }
                  ]}
                  required
                />
              </div>

              {/* Conditional fields based on paper category */}
              {metadata.paperCategory === 'PastPaper' && (
                <div className="col-span-2">
                  <InputField
                    label="Year"
                    type="number"
                    min="2000"
                    max="2030"
                    value={metadata.year}
                    onChange={(e) => handleMetadataChange('year', e.target.value)}
                    placeholder="e.g., 2024"
                    // Year is optional, so no 'required' attribute here
                  />
                </div>
              )}

              {metadata.paperCategory === 'TermTest' && (
                <>
                  <SelectField
                    label="Term"
                    value={metadata.term}
                    onChange={(e) => handleMetadataChange('term', e.target.value)}
                    options={[
                      { value: '', label: 'Select Term' },
                      { value: 'Term1', label: 'Term 1' },
                      { value: 'Term2', label: 'Term 2' },
                      { value: 'Term3', label: 'Term 3' }
                    ]}
                    // Term is optional
                  />
                  <InputField
                    label="School Name"
                    value={metadata.schoolName}
                    onChange={(e) => handleMetadataChange('schoolName', e.target.value)}
                    placeholder="Enter school name"
                    // School Name is optional
                  />
                </>
              )}

              <div className="col-span-2">
                <InputField
                  label="Uploader Name"
                  value={metadata.uploader}
                  onChange={(e) => handleMetadataChange('uploader', e.target.value)}
                  placeholder="Your name (optional)"
                />
              </div>
            </div>
          </Card>

          <Button type="submit" variant="primary" size="large" icon={Upload} className="w-full">
            Upload Questions
          </Button>
        </div>

        <UploadQueue
          files={uploadedFiles}
          onRemoveFile={removeFile}
          onClearAll={clearAllFiles}
        />
      </form>
    </div>
  );
};

export default QuestionUpload;