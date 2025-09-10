import axios from 'axios';

const API_BASE_URL = 'http://localhost:5201/api/questions';

// NEW: Save metadata only (after Cloudinary upload)
export const saveQuestionMetadata = async (metadataWithUrls) => {
  try {
    const response = await axios.post(API_BASE_URL, metadataWithUrls, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Metadata save successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Metadata save failed:');
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

// REMOVE: The old uploadQuestion function since we're using direct Cloudinary uploads

// Keep the test function
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