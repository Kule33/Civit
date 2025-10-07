import axios from 'axios';

export const getCloudinarySignature = async (metadata) => {
  try {
    const response = await axios.post('http://localhost:5201/api/cloudinary/signature', metadata);
    return response.data;
  } catch (error) {
    console.error('Error getting Cloudinary signature:', error);
    throw error;
  }
};

export const uploadToCloudinary = async (file, signatureData, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signatureData.apiKey);
  formData.append('timestamp', signatureData.timestamp);
  formData.append('signature', signatureData.signature);
  formData.append('folder', signatureData.folder);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return {
      publicId: response.data.public_id,
      secureUrl: response.data.secure_url,
      format: response.data.format,
      bytes: response.data.bytes,
      fileName: file.name
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export const uploadWithProgress = async (file, metadata, onProgress) => {
  // Get signature first
  const signatureData = await getCloudinarySignature(metadata);
  
  // Upload to Cloudinary
  const result = await uploadToCloudinary(file, signatureData, onProgress);
  
  return result;
};

// For raw file uploads (DOCX, PDF, etc.)
export const uploadRawWithProgress = async (file, folder = 'typesets', onProgress) => {
  try {
    // Get signature for raw upload with resource_type
    const signatureData = await getCloudinarySignature({ 
      folder: folder,
      resourceType: 'raw' 
    });
    
    // Upload as raw file to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signatureData.apiKey);
    formData.append('timestamp', signatureData.timestamp);
    formData.append('signature', signatureData.signature);
    formData.append('folder', signatureData.folder);
    formData.append('resource_type', 'raw'); // Must match what was signed

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/raw/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return {
      publicId: response.data.public_id,
      secureUrl: response.data.secure_url,
      format: response.data.format,
      bytes: response.data.bytes,
      fileName: file.name
    };
  } catch (error) {
    console.error('Error uploading raw file to Cloudinary:', error);
    throw error;
  }
};