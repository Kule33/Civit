// src/services/questionService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5201/api/questions';

export const uploadQuestion = async (metadata, files, onUploadProgress) => {
  const formData = new FormData();

  // Append metadata fields
  for (const key in metadata) {
    if (metadata[key] !== null && metadata[key] !== undefined) {
      formData.append(key, String(metadata[key]));
    }
  }

  // Append single file - MUST match backend DTO property name "File"
  if (files.length > 0 && files[0].file) {
    formData.append('File', files[0].file);
  }

  // Debug: Log what's being sent
  console.log('📤 Sending to backend:', API_BASE_URL);
  console.log('📋 FormData contents:');
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`  ${key}: ${value.name} (${value.size} bytes, ${value.type})`);
    } else {
      console.log(`  ${key}: ${value}`);
    }
  }

  try {
    const response = await axios.post(API_BASE_URL, formData, {
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(percentCompleted);
        }
      },
    });
    
    console.log('✅ Upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Upload failed:');
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
      console.error('  Headers:', error.response.headers);
    } else if (error.request) {
      console.error('  No response received:', error.request);
    } else {
      console.error('  Error:', error.message);
    }
    throw error;
  }
};

// Test function to check backend connection
export const testBackendConnection = async () => {
  const testData = new FormData();
  testData.append('message', 'Test connection from frontend');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/test`, testData);
    console.log('✅ Backend test successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Backend test failed:', error);
    throw error;
  }
};