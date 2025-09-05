import React, { useRef } from 'react';
import { Upload, Image, FileText, Filter } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import InputField from '../../components/ui/InputField';
import SelectField from '../../components/ui/SelectField';
import FileUploadZone from '../../components/upload/FileUploadZone';
import UploadQueue from '../../components/upload/UploadQueue';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useMetadata } from '../../hooks/useMetadata';

const QuestionUpload = () => {
  const fileInputRef = useRef(null);
  const [uploadType, setUploadType] = React.useState('image');
  
  // Use custom hooks
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
    validateMetadata
  } = useMetadata();

  // Event handlers
  const handleFilesAdded = (files, type) => {
    addFiles(files, type);
  };

  const handleMetadataChange = (field, value) => {
    updateMetadata(field, value);
  };

  const simulateUpload = async () => {
    for (const file of uploadedFiles) {
      updateFileStatus(file.id, { status: 'uploading', progress: 0 });
      
      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        updateFileStatus(file.id, { progress });
      }
      
      updateFileStatus(file.id, { status: 'completed' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadedFiles.length === 0) {
      alert('Please select at least one file to upload');
      return;
    }

    if (!validateMetadata()) {
      if (metadata.examType === 'grade5') {
        alert('Please fill in all required fields (Country, Exam Type, and Paper Type)');
      } else {
        alert('Please fill in all required fields (Country, Exam Type, and Subject)');
      }
      return;
    }

    await simulateUpload();
    alert('Files uploaded successfully! (This is a simulation)');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question Upload"
        subtitle="Upload questions and add metadata for better organization"
        actions={
          <Button variant="secondary" icon={Filter}>
            Manage Questions
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Upload and Metadata */}
        <div className="space-y-6">
          {/* Upload Type Selection */}
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

              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Files</label>
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

          {/* Metadata Form */}
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
                      ...(availableOptions.examTypes || []) // Add nullish coalescing for safety
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
                      ...(availableOptions.streams || []) // Add nullish coalescing for safety
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
                      ...(availableOptions.subjects || []) // Add nullish coalescing for safety
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
                      ...(availableOptions.paperTypes || []) // Add nullish coalescing for safety
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
                      ...(availableOptions.paperTypes || []) // Add nullish coalescing for safety
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

        {/* Right Column: Upload Queue */}
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