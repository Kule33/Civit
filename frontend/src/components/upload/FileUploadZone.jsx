// components/upload/FileUploadZone.jsx
import React from 'react';
import { Upload, Image as ImageIcon, FileText, Cloud } from 'lucide-react'; // Renamed Image to ImageIcon to avoid conflict with HTML <img> tag

const FileUploadZone = ({
  uploadType,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInput,
  inputRef,
  files // New prop: Pass the uploaded files from useFileUpload
}) => {
  const isImageUpload = uploadType === 'image';

  // Filter for image files that are currently being 'staged' in the upload zone (status 'pending')
  // This ensures we only show previews for files that are not yet "uploaded" (completed/failed)
  const filesToPreview = files.filter(file => 
    file.uploadType === 'image' && file.previewUrl && file.status === 'pending'
  );

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer 
        ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${filesToPreview.length > 0 && isImageUpload ? 'min-h-[200px] py-4' : 'min-h-[150px]'}
      `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()} // Keep click to browse functionality
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={onFileInput}
        className="hidden"
        accept={isImageUpload ? 'image/*' : '.doc,.docx,.pdf'}
      />

      {filesToPreview.length > 0 && isImageUpload ? (
        // Display image previews
        <div className="flex flex-wrap justify-center gap-4 mb-4">
          {filesToPreview.map(file => (
            <div key={file.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
              <img
                src={file.previewUrl}
                alt={file.name}
                className="w-full h-full object-cover"
                onLoad={() => URL.revokeObjectURL(file.previewUrl)} // Revoke URL after image loads to free up memory
              />
              <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate">
                {file.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        // Default upload zone content
        <div className="flex flex-col items-center justify-center">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Cloud size={24} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-1">
            Drag & drop files here or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Multiple files supported
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        {isImageUpload 
          ? 'Supports JPG, PNG, GIF - Max 10MB each'
          : 'Supports DOC, DOCX, PDF - Max 20MB each'
        }
      </p>
    </div>
  );
};

export default FileUploadZone;