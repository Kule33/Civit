// components/pages/QuestionUpload.jsx
import React, { useRef, useState } from 'react';
import { Upload, Image, FileText, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import InputField from '../../components/ui/InputField.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import FileUploadZone from '../../components/upload/FileUploadZone.jsx';
import UploadQueue from '../../components/upload/UploadQueue.jsx';
import SearchableSelect from '../../components/ui/SearchableSelect.jsx'; // Import the new component
import { useFileUpload } from '../../hooks/useFileUpload.js';
import { useMetadata } from '../../hooks/useMetadata.js';
import { testBackendConnection, saveQuestionMetadata } from '../../services/questionService.js';
import { useSubmission } from '../../context/SubmissionContext';
import { uploadWithProgress } from '../../services/cloudinaryService';


const QuestionUpload = () => {
  const fileInputRef = useRef(null);
  const [uploadType, setUploadType] = useState('image');
  const [isTesting, setIsTesting] = useState(false);
  const [isQueueMinimized, setIsQueueMinimized] = useState(true);
  
  const { showOverlay } = useSubmission();

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

  const {
    metadata,
    availableOptions,
    updateMetadata,
    validateMetadata,
    resetMetadata,
    refreshSchools
  } = useMetadata();

  // Mapping from frontend values to backend database names
  const subjectValueToName = {
    'pure_maths': 'Pure Mathematics',
    'applied_maths': 'Applied Mathematics',
    'physics': 'Physics',
    'chemistry': 'Chemistry',
    'biology': 'Biology',
    'business_studies': 'Business Studies',
    'accounting': 'Accounting',
    'economics': 'Economics',
    'engineering_tech': 'Engineering Technology',
    'bio_systems_tech': 'Bio-Systems Technology',
    'sinhala': 'Sinhala',
    'history': 'History',
    'geography': 'Geography',
    'buddhism': 'Buddhism',
    'english': 'English',
    'tamil': 'Tamil',
    'music': 'Music',
    'art': 'Art',
    'dancing': 'Dancing',
    'drama': 'Drama',
    'mathematics': 'Mathematics',
    'science': 'Science',
    'civics': 'Civics',
    'ict': 'Information & Communication Technology',
    'health': 'Health & Physical Education',
    'commerce': 'Commerce',
    'environment': 'Environment Related Activities'
  };

  const handleFilesAdded = (files, type) => {
    if (files.length > 0) {
      clearAllFiles();
      addFiles([files[0]], type);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const filesToUpload = uploadedFiles.filter(f => f.status === 'pending');

    if (filesToUpload.length !== 1) {
      showOverlay({
        status: 'error',
        message: 'Please select exactly one file to upload.',
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
      showOverlay({
        status: 'loading',
        message: 'Uploading file directly to Cloudinary...',
        autoClose: false
      });

      updateFileStatus(filesToUpload[0].id, { status: 'uploading', progress: 0 });

      console.log('🔄 Starting Cloudinary upload with metadata:', metadata);
      
      const uploadResult = await uploadWithProgress(
        filesToUpload[0].file,
        {
          country: metadata.country,
          examType: metadata.examType,
          stream: metadata.stream,
          subject: metadata.subject,
          paperType: metadata.paperType,
          paperCategory: metadata.paperCategory
        },
        (progress) => {
          updateFileStatus(filesToUpload[0].id, { progress });
        }
      );

      console.log('✅ Cloudinary upload result:', uploadResult);

      // Clean metadata - Convert empty strings to null and transform subject
      const cleanedMetadata = {
        country: metadata.country,
        examType: metadata.examType,
        stream: metadata.stream || null,
        subject: subjectValueToName[metadata.subject] || null, // Transform subject value to name
        paperType: metadata.paperType || null,
        paperCategory: metadata.paperCategory,
        year: metadata.year ? parseInt(metadata.year, 10) : null,
        term: metadata.term || null,
        schoolName: metadata.schoolName || null,
        uploader: metadata.uploader || null
      };

      console.log('🧹 Cleaned metadata:', cleanedMetadata);
      console.log('📤 Upload result for backend:', uploadResult);

      // Check if Cloudinary returned the required fields
      if (!uploadResult.secureUrl && !uploadResult.fileUrl) {
        throw new Error('Cloudinary upload failed - no URL returned');
      }
      if (!uploadResult.publicId && !uploadResult.filePublicId) {
        throw new Error('Cloudinary upload failed - no publicId returned');
      }

      // Prepare data for backend
      const backendData = {
        ...cleanedMetadata,
        fileUrl: uploadResult.secureUrl || uploadResult.fileUrl,
        filePublicId: uploadResult.publicId || uploadResult.filePublicId,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.bytes,
        fileFormat: uploadResult.format
      };

      console.log('🚀 Final data for backend:', backendData);

      await saveQuestionMetadata(backendData);

      // Refresh schools so newly created school appears in dropdown
      await refreshSchools();

      showOverlay({
        status: 'success',
        message: 'File uploaded to Cloudinary and metadata saved!',
        autoClose: true,
        autoCloseDelay: 2000
      });

      updateFileStatus(filesToUpload[0].id, { status: 'completed' });
      
      setTimeout(() => {
        clearAllFiles();
        resetMetadata();
      }, 1500);

    } catch (error) {
      console.error("❌ Submission error:", error);
      updateFileStatus(filesToUpload[0].id, { status: 'error' });
      
      showOverlay({
        status: 'error',
        message: `Upload failed: ${error.response?.data || error.message || 'Unknown error'}`,
        autoClose: true,
        autoCloseDelay: 5000
      });
    }
  };

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

  const handleMetadataChange = (field, value) => {
    updateMetadata(field, value);
  };

  return (
    <div className="space-y-6 pb-6">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Upload Settings */}
          <div className="lg:col-span-1 space-y-6">
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
          </div>

          {/* Right column - Metadata Form */}
          <div className="lg:col-span-2">
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
                    />
                    
                    {/* School Name - Searchable Select or free text */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        School Name
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        <SearchableSelect
                          value={metadata.schoolName}
                          onChange={(e) => handleMetadataChange('schoolName', e.target.value)}
                          options={[
                            { value: '', label: 'Select School (optional)' },
                            ...(availableOptions.schools?.map(school => ({ value: school.name, label: school.name })) || [])
                          ]}
                          placeholder="Search or Select School (optional)"
                        />
                        <input
                          type="text"
                          value={metadata.schoolName}
                          onChange={(e) => handleMetadataChange('schoolName', e.target.value)}
                          placeholder="Or type school name manually"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
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
          </div>
        </div>

        {/* Upload Button */}
        <Button type="submit" variant="primary" size="large" icon={Upload} className="w-full">
          Upload Questions
        </Button>

        {/* Upload Queue Section */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div 
            className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 cursor-pointer"
            onClick={() => setIsQueueMinimized(!isQueueMinimized)}
          >
            <h3 className="font-semibold text-gray-700 flex items-center">
              Upload Queue
              {uploadedFiles.length > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                  {uploadedFiles.length}
                </span>
              )}
            </h3>
            <Button
              variant="ghost"
              size="small"
              icon={isQueueMinimized ? ChevronDown : ChevronUp}
            >
              {isQueueMinimized ? 'Show' : 'Hide'}
            </Button>
          </div>
          
          <div className={isQueueMinimized ? 'hidden' : 'block'}>
            <UploadQueue
              files={uploadedFiles}
              onRemoveFile={removeFile}
              onClearAll={clearAllFiles}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuestionUpload;