// hooks/useFileUpload.js
import { useState, useCallback, useEffect } from 'react'; // Import useEffect
import { v4 as uuidv4 } from 'uuid'; // Assuming you have uuid installed, if not, use Date.now() + Math.random()

export const useFileUpload = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback((files, uploadType) => {
    const newFiles = Array.from(files).map(file => {
      const isImage = file.type.startsWith('image/');
      // Validate file types based on uploadType
      let isValid = false;
      if (uploadType === 'image' && isImage) {
        isValid = true;
      } else if (uploadType === 'document' && (file.type.includes('document') || file.name.match(/\.(doc|docx|pdf)$/i))) {
        isValid = true;
      }

      if (isValid) {
        return {
          id: uuidv4(), // Use uuid for unique IDs
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadType: uploadType, // 'image' or 'document'
          status: 'pending',
          progress: 0,
          previewUrl: isImage ? URL.createObjectURL(file) : null, // Generate preview URL for images
        };
      }
      return null; // Return null for invalid files
    }).filter(Boolean); // Filter out nulls (invalid files)

    setUploadedFiles(prev => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id) => {
    setUploadedFiles(prevFiles => {
      const fileToRemove = prevFiles.find(file => file.id === id);
      if (fileToRemove && fileToRemove.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl); // Clean up object URL
      }
      return prevFiles.filter(file => file.id !== id);
    });
  }, []);

  const clearAllFiles = useCallback(() => {
    uploadedFiles.forEach(file => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl); // Clean up all object URLs
      }
    });
    setUploadedFiles([]);
  }, [uploadedFiles]); // Depend on uploadedFiles to ensure all URLs are revoked

  const updateFileStatus = useCallback((id, updates) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e, uploadType, onFilesAdded) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(e.dataTransfer.files, uploadType);
      e.dataTransfer.clearData(); // Clear data after drop
    }
  }, []);

  const handleFileInput = useCallback((e, uploadType, onFilesAdded) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(e.target.files, uploadType);
      e.target.value = null; // Clear input to allow re-uploading the same file
    }
  }, []);

  // Cleanup for any remaining object URLs when the component using the hook unmounts
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, []); // Run only on mount and unmount

  return {
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
  };
};