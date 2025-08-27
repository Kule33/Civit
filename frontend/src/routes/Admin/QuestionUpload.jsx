import React, { useState } from 'react';
import { Upload, Image, FileText, X } from 'lucide-react';

const AdminQuestionUpload = () => {
  const [uploadType, setUploadType] = useState('image');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(prev => [...prev, ...files.map(file => ({
      file,
      type: uploadType,
      status: 'pending'
    }))]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Upload</h1>
          <p className="text-gray-600">Upload questions and metadata</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Upload New Questions</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Type</label>
            <div className="flex space-x-4">
              {['image', 'document', 'text'].map((type) => (
                <button
                  key={type}
                  onClick={() => setUploadType(type)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    uploadType === type
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept={uploadType === 'image' ? 'image/*' : uploadType === 'document' ? '.doc,.docx,.pdf' : '*'}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                {uploadType === 'image' ? <Image size={24} /> : 
                 uploadType === 'document' ? <FileText size={24} /> : 
                 <Upload size={24} />}
              </div>
              <p className="text-sm text-gray-600">
                Drag & drop files or <span className="text-blue-600">browse</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {uploadType === 'image' ? 'JPG, PNG, GIF' : 
                 uploadType === 'document' ? 'DOC, DOCX, PDF' : 
                 'Any file type'} accepted
              </p>
            </label>
          </div>

          <button className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Process Uploads
          </button>
        </div>

        {/* Upload Queue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Queue</h2>
          
          {uploadedFiles.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No files in queue</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      {file.type === 'image' ? <Image size={16} /> : 
                       file.type === 'document' ? <FileText size={16} /> : 
                       <FileText size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{file.file.name}</p>
                      <p className="text-xs text-gray-500">{(file.file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminQuestionUpload;