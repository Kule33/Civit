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
