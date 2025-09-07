// src/routes/Admin/QuestionUpload.jsx
import React, { useRef, useState } from 'react';
import { Upload, Image, FileText, Filter } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/card.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import InputField from '../../components/ui/InputField.jsx';
import SelectField from '../../components/ui/SelectField.jsx';
import FileUploadZone from '../../components/upload/FileUploadZone.jsx';
import UploadQueue from '../../components/upload/UploadQueue.jsx';
import { useFileUpload } from '../../hooks/useFileUpload.js';
import { useMetadata } from '../../hooks/useMetadata.js';
import { uploadQuestion, testBackendConnection } from '../../services/questionService.js';

const QuestionUpload = () => {
  const fileInputRef = useRef(null);
  const [uploadType, setUploadType] = useState('image');
  const [isTesting, setIsTesting] = useState(false);

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
    resetMetadata
  } = useMetadata();

  // Test backend connection
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

  const handleFilesAdded = (files, type) => {
    // For single file upload, clear existing files first
    if (files.length > 0) {
      clearAllFiles();
      addFiles([files[0]], type); // Only take the first file
    }
  };

  const handleMetadataChange = (field, value) => {
    updateMetadata(field, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const filesToUpload = uploadedFiles.filter(f => f.status === 'pending');

    if (filesToUpload.length !== 1) {
      alert('Please select exactly one file to upload');
      return;
    }

    if (!validateMetadata()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      updateFileStatus(filesToUpload[0].id, { status: 'uploading', progress: 0 });

      const response = await uploadQuestion(
        metadata,
        filesToUpload,
        (progress) => {
          updateFileStatus(filesToUpload[0].id, { progress });
        }
      );

      console.log('Upload successful:', response);
      alert('File uploaded successfully!');
      
      updateFileStatus(filesToUpload[0].id, { status: 'completed' });
      clearAllFiles();
      resetMetadata();

    } catch (error) {
      alert('Upload failed. Please check the console for details.');
      console.error('Upload error:', error);
      updateFileStatus(filesToUpload[0].id, { status: 'error' });
    }
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
                  maxFiles={1}
                />
              </div>
            </div>
          </Card>

          {/* METADATA FORM SECTION - RESTORED */}
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
                    required={metadata.examType !== 'grade5'}
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
                  <InputField
                    label="School Name"
                    value={metadata.schoolName}
                    onChange={(e) => handleMetadataChange('schoolName', e.target.value)}
                    placeholder="Enter school name"
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
          maxFiles={1}
        />
      </form>
    </div>
  );
};

export default QuestionUpload;