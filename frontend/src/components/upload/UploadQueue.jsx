import React from 'react';
import { FileText, Check, AlertCircle, X, Image } from 'lucide-react';

const UploadQueue = ({ files, onRemoveFile, onClearAll }) => {
  const getFileIcon = (type) => {
    return type === 'image' ? <Image size={16} /> : <FileText size={16} />;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'uploading': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Upload Queue</h2>
        {files.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Clear All
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <FileText size={48} className="mx-auto mb-3 text-gray-300" />
          <p>No files in queue</p>
          <p className="text-sm mt-1">Uploaded files will appear here</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg ${getStatusColor(file.status)}`}>
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{file.file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {file.status === 'uploading' && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.status === 'completed' && (
                    <Check size={16} className="text-green-500" />
                  )}
                  {file.status === 'error' && (
                    <AlertCircle size={16} className="text-red-500" />
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Stats */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total files: {files.length}</span>
              <span>
                Completed: {files.filter(f => f.status === 'completed').length}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UploadQueue;