// frontend/src/components/Uploads/QuestionUpload.jsx
import React, { useRef, useState, useEffect } from 'react';
import { Upload, Image, FileText, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Card from '../ui/card.jsx';
import InputField from '../ui/InputField.jsx';
import SelectField from '../ui/SelectField.jsx';
import FileUploadZone from '../upload/FileUploadZone.jsx';
import UploadQueue from '../upload/UploadQueue.jsx';
import SearchableSelect from '../ui/SearchableSelect.jsx';
import { useFileUpload } from '../../hooks/useFileUpload.js';
import { useMetadata } from '../../hooks/useMetadata.js';
import { saveQuestionMetadata } from '../../services/questionService.js';
import { useSubmission } from '../../context/SubmissionContext';
import { uploadWithProgress } from '../../services/cloudinaryService';
import { useAuth } from '../../context/AuthProvider';


const QuestionUpload = () => {
  const fileInputRef = useRef(null);
  const [uploadType, setUploadType] = useState('image');
  const [isQueueMinimized, setIsQueueMinimized] = useState(true);
  
  const { showOverlay } = useSubmission();
  const { user, userProfile } = useAuth();

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
  } = useMetadata({
    country: 'sri_lanka',  // Default to Sri Lanka
    uploader: userProfile?.email || user?.email || ''
  });

  // Update uploader field when user data loads
  useEffect(() => {
    const uploaderEmail = userProfile?.email || user?.email;
    if (uploaderEmail && !metadata.uploader) {
      updateMetadata('uploader', uploaderEmail);
    }
  }, [user, userProfile, metadata.uploader, updateMetadata]);

  // Set country to Sri Lanka by default on component mount
  useEffect(() => {
    if (!metadata.country) {
      updateMetadata('country', 'sri_lanka');
    }
  }, [metadata.country, updateMetadata]);

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
      // For multiple file upload, add all files instead of clearing and taking only the first one
      addFiles(files, type);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const filesToUpload = uploadedFiles.filter(f => f.status === 'pending');

    if (filesToUpload.length === 0) {
      showOverlay({
        status: 'error',
        message: 'Please select at least one file to upload.',
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
      // Calculate total size for progress display
      const totalSize = filesToUpload.reduce((sum, file) => sum + file.file.size, 0);
      const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      showOverlay({
        status: 'loading',
        message: `Preparing to upload ${filesToUpload.length} file(s) (${formatFileSize(totalSize)}) to Cloudinary...`,
        autoClose: false
      });

      // Clean metadata - Convert empty strings to null and transform values to database names
      const cleanedMetadata = {
        country: metadata.country === 'sri_lanka' ? 'Sri Lanka' : metadata.country, // Transform country value to name
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

      console.log('🔄 Starting batch upload with metadata:', cleanedMetadata);

      // Upload all files sequentially to avoid overwhelming the server
      const uploadResults = [];
      let successCount = 0;
      let errorCount = 0;
      let uploadedSize = 0;

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        try {
          // Update progress for current file
          updateFileStatus(file.id, { status: 'uploading', progress: 0 });
          
          showOverlay({
            status: 'loading',
            message: `Uploading file ${i + 1} of ${filesToUpload.length}: ${file.name} (${formatFileSize(file.file.size)})`,
            autoClose: false
          });

          console.log(`🔄 Uploading file ${i + 1}/${filesToUpload.length}:`, file.name, `(${formatFileSize(file.file.size)})`);
          
          const uploadResult = await uploadWithProgress(
            file.file,
            {
              country: metadata.country,
              examType: metadata.examType,
              stream: metadata.stream,
              subject: metadata.subject,
              paperType: metadata.paperType,
              paperCategory: metadata.paperCategory
            },
            (progress) => {
              updateFileStatus(file.id, { progress });
              
              // Show detailed progress in overlay
              const currentFileProgress = Math.round(progress);
              
              showOverlay({
                status: 'loading',
                message: `Uploading file ${i + 1} of ${filesToUpload.length}: ${file.name} (${formatFileSize(file.file.size)}) - ${currentFileProgress}%`,
                autoClose: false
              });
            }
          );

          console.log(`✅ Upload result for ${file.name}:`, uploadResult);

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

          console.log(`🚀 Saving metadata for ${file.name}:`, backendData);
          console.log(`📦 BATCH INFO: index=${i}, total=${filesToUpload.length}, isLast=${i === filesToUpload.length - 1}`);

          // Pass batch information to backend
          await saveQuestionMetadata(backendData, i, filesToUpload.length);
          
          updateFileStatus(file.id, { status: 'completed' });
          uploadResults.push({ file: file.name, success: true });
          successCount++;
          uploadedSize += file.file.size;

        } catch (error) {
          console.error(`❌ Upload failed for ${file.name}:`, error);
          updateFileStatus(file.id, { status: 'error' });
          uploadResults.push({ 
            file: file.name, 
            success: false, 
            error: error.response?.data || error.message 
          });
          errorCount++;
        }
      }

      // Refresh schools so newly created school appears in dropdown
      await refreshSchools();

      // Show final result with size information
      if (successCount === filesToUpload.length) {
        showOverlay({
          status: 'success',
          message: `All ${successCount} file(s) uploaded successfully! Total size: ${formatFileSize(uploadedSize)}`,
          autoClose: true,
          autoCloseDelay: 3000
        });
        
        // Reset form immediately on complete success
        setTimeout(() => {
          clearAllFiles();
          resetMetadata();
        }, 1000);
        
      } else if (successCount > 0) {
        showOverlay({
          status: 'warning',
          message: `${successCount} file(s) uploaded successfully (${formatFileSize(uploadedSize)}), ${errorCount} failed. Check upload queue for details.`,
          autoClose: true,
          autoCloseDelay: 5000
        });
        
        // Only clear completed files, keep failed ones for retry
        setTimeout(() => {
          const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
          if (completedFiles.length > 0) {
            completedFiles.forEach(file => removeFile(file.id));
          }
        }, 2000);
        
      } else {
        showOverlay({
          status: 'error',
          message: `All ${errorCount} file(s) failed to upload. Check upload queue for details.`,
          autoClose: true,
          autoCloseDelay: 5000
        });
      }

    } catch (error) {
      console.error("❌ Batch upload error:", error);
      
      showOverlay({
        status: 'error',
        message: `Upload failed: ${error.response?.data || error.message || 'Unknown error'}`,
        autoClose: true,
        autoCloseDelay: 5000
      });
    }
  };

  const handleMetadataChange = (field, value) => {
    updateMetadata(field, value);
  };

  return (
    <div className="space-y-6">
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
                    Upload Files (Multiple Files Supported)
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
                    label="Uploader Email (Auto-filled)"
                    value={metadata.uploader}
                    onChange={(e) => handleMetadataChange('uploader', e.target.value)}
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
