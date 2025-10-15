// frontend/src/services/typesetService.js
import axios from 'axios';

/**
 * Upload or replace a typeset for a question (Admin only)
 * @param {Object} payload - { questionId, fileUrl, filePublicId, fileName }
 * @param {string} token - Supabase JWT access token
 * @returns {Promise<Object>} TypesetResponseDto
 */
export async function upsertTypeset(payload, token) {
  const response = await axios.post('/api/typesets', payload, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return response.data;
}

/**
 * Get typeset by question ID (Admin/Teacher)
 * @param {string} questionId - GUID of the question
 * @param {string} token - Supabase JWT access token
 * @returns {Promise<Object|null>} TypesetResponseDto or null if not found
 */
export async function getTypesetByQuestionId(questionId, token) {
  try {
    const response = await axios.get(`/api/typesets/by-question/${questionId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Delete a typeset (Admin only)
 * @param {string} typesetId - GUID of the typeset to delete
 * @param {string} token - Supabase JWT access token
 * @returns {Promise<boolean>} true if deleted successfully
 */
export async function deleteTypeset(typesetId, token) {
  try {
    const response = await axios.delete(`/api/typesets/${typesetId}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return response.status === 204 || response.status === 200;
  } catch (error) {
    console.error('Error deleting typeset:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Merge multiple Word documents into a single file
 * @param {string[]} fileUrls - Array of Cloudinary URLs for Word documents
 * @returns {Promise<Blob>} The merged document as a blob
 */
export async function mergeDocuments(fileUrls) {
  try {
    console.log('🔄 Merging documents:', fileUrls);
    const response = await axios.post('/api/merge/documents', 
      { fileUrls },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'blob' // Important: tells axios to expect binary data
      }
    );
    console.log('✅ Documents merged successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error merging documents:', error);
    console.error('Response status:', error.response?.status);
    console.error('Response headers:', error.response?.headers);
    
    // Try to read error message from blob if it's an error response
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        console.error('Error response body:', text);
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || 'Failed to merge documents');
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }
    }
    
    throw new Error(error.response?.data?.message || error.message || 'Failed to merge documents');
  }
}
