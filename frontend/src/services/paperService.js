// frontend/src/services/paperService.js
import axios from 'axios';
import { supabase } from '../supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5201';

// Get auth headers from Supabase session
const getAuthHeaders = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting Supabase session:", error);
    throw new Error("Authentication session not found.");
  }
  if (!session || !session.access_token) {
    throw new Error("No active session or access token found. User might not be logged in.");
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  };
};

/**
 * Upload paper PDF to Cloudinary
 * @param {File} file - PDF file to upload
 * @param {Object} metadata - Paper metadata for folder structure
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Upload result with fileUrl, publicId, etc.
 */
export const uploadPaperToCloudinary = async (file, metadata, onProgress) => {
  try {
    // Step 1: Get Cloudinary signature from backend
    const headers = await getAuthHeaders();
    const signatureResponse = await axios.post(
      `${API_BASE_URL}/api/cloudinary/signature`,
      {
        folder: `papers/${metadata.country}/${metadata.examType}/${metadata.subject}`,
        resourceType: 'raw', // For PDFs
      },
      { headers }
    );

    const { signature, timestamp, cloudName, apiKey } = signatureResponse.data;

    // Step 2: Upload to Cloudinary using /raw/upload endpoint (same as typesets)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', `papers/${metadata.country}/${metadata.examType}/${metadata.subject}`);
    formData.append('resource_type', 'raw'); // Must match what was signed

    const uploadResponse = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (onProgress) onProgress(percentCompleted);
        },
      }
    );

    console.log('Cloudinary upload response:', uploadResponse.data);

    return {
      secureUrl: uploadResponse.data.secure_url,
      publicId: uploadResponse.data.public_id,
      fileName: file.name,
      fileSize: uploadResponse.data.bytes,
      fileFormat: uploadResponse.data.format,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    console.error('Cloudinary error response:', error.response?.data);
    throw new Error(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to upload paper to Cloudinary');
  }
};

/**
 * Save paper metadata to backend
 * @param {Object} paperData - Complete paper data including Cloudinary results
 * @returns {Promise<Object>} Saved paper response
 */
export const savePaperMetadata = async (paperData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_BASE_URL}/api/papers/upload`,
      paperData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Save paper metadata error:', error);
    throw new Error(error.response?.data || 'Failed to save paper metadata');
  }
};

/**
 * Search for papers based on filters
 * @param {Object} searchCriteria - Search filters
 * @returns {Promise<Array>} Array of papers
 */
export const searchPapers = async (searchCriteria) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/api/papers`, {
      params: searchCriteria,
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('Search papers error:', error);
    throw new Error(error.response?.data || 'Failed to search papers');
  }
};

/**
 * Get a specific paper by ID
 * @param {string} paperId - Paper ID
 * @returns {Promise<Object>} Paper details
 */
export const getPaperById = async (paperId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/api/papers/${paperId}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('Get paper error:', error);
    throw new Error(error.response?.data || 'Failed to get paper');
  }
};

/**
 * Get signed URL for viewing/downloading a paper
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<string>} Signed URL
 */
export const getSignedUrl = async (publicId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_BASE_URL}/api/cloudinary/signed-url`,
      {
        publicId: publicId,
        resourceType: 'raw',
        expirationSeconds: 3600 // 1 hour
      },
      { headers }
    );
    return response.data.signedUrl;
  } catch (error) {
    console.error('Get signed URL error:', error);
    throw new Error(error.response?.data || 'Failed to get signed URL');
  }
};

/**
 * Download a paper (tracks download activity)
 * @param {string} paperId - Paper ID
 * @returns {Promise<void>}
 */
export const downloadPaper = async (paperId) => {
  try {
    const headers = await getAuthHeaders();
    await axios.post(
      `${API_BASE_URL}/api/papers/${paperId}/download`,
      {},
      { headers }
    );
  } catch (error) {
    console.error('Download paper error:', error);
    throw new Error(error.response?.data || 'Failed to track paper download');
  }
};

/**
 * Delete a paper (admin only)
 * @param {string} paperId - Paper ID
 * @returns {Promise<void>}
 */
export const deletePaper = async (paperId) => {
  try {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_BASE_URL}/api/papers/${paperId}`, {
      headers,
    });
  } catch (error) {
    console.error('Delete paper error:', error);
    throw new Error(error.response?.data || 'Failed to delete paper');
  }
};
