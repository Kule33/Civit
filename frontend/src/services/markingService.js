// frontend/src/services/markingService.js
import axios from 'axios';
import { supabase } from '../supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5201';

// Get auth headers from Supabase session
const getAuthHeaders = async () => {
  try {
    // Add timeout to prevent hanging
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session fetch timeout')), 2000)
    );
    
    const result = await Promise.race([sessionPromise, timeoutPromise]);
    const { data: { session }, error } = result;
    
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
  } catch (error) {
    console.error("Error in getAuthHeaders:", error);
    throw error;
  }
};

/**
 * Upload marking PDF to Cloudinary
 * @param {File} file - PDF file to upload
 * @param {Object} metadata - Marking metadata for folder structure
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Upload result with fileUrl, publicId, etc.
 */
export const uploadMarkingToCloudinary = async (file, metadata, onProgress) => {
  try {
    // Step 1: Get Cloudinary signature from backend
    const headers = await getAuthHeaders();
    const signatureResponse = await axios.post(
      `${API_BASE_URL}/api/cloudinary/signature`,
      {
        folder: `markings/${metadata.country}/${metadata.examType}/${metadata.subject}`,
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
    formData.append('folder', `markings/${metadata.country}/${metadata.examType}/${metadata.subject}`);
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

    return {
      secureUrl: uploadResponse.data.secure_url,
      publicId: uploadResponse.data.public_id,
      fileName: file.name,
      fileSize: uploadResponse.data.bytes,
      fileFormat: uploadResponse.data.format,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload marking to Cloudinary');
  }
};

/**
 * Save marking metadata to backend
 * @param {Object} markingData - Complete marking data including Cloudinary results
 * @returns {Promise<Object>} Saved marking response
 */
export const saveMarkingMetadata = async (markingData) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.post(
      `${API_BASE_URL}/api/markings/upload`,
      markingData,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Save marking metadata error:', error);
    throw new Error(error.response?.data || 'Failed to save marking metadata');
  }
};

/**
 * Search for markings based on filters
 * @param {Object} searchCriteria - Search filters
 * @returns {Promise<Array>} Array of markings
 */
export const searchMarkings = async (searchCriteria) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/api/markings`, {
      params: searchCriteria,
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('Search markings error:', error);
    throw new Error(error.response?.data || 'Failed to search markings');
  }
};

/**
 * Get a specific marking by ID
 * @param {string} markingId - Marking ID
 * @returns {Promise<Object>} Marking details
 */
export const getMarkingById = async (markingId) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/api/markings/${markingId}`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error('Get marking error:', error);
    throw new Error(error.response?.data || 'Failed to get marking');
  }
};

/**
 * Get signed URL for viewing/downloading a marking
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
 * Download a marking (tracks download activity)
 * @param {string} markingId - Marking ID
 * @returns {Promise<void>}
 */
export const downloadMarking = async (markingId) => {
  try {
    const headers = await getAuthHeaders();
    await axios.post(
      `${API_BASE_URL}/api/markings/${markingId}/download`,
      {},
      { headers }
    );
  } catch (error) {
    console.error('Download marking error:', error);
    throw new Error(error.response?.data || 'Failed to track marking download');
  }
};

/**
 * Delete a marking (admin only)
 * @param {string} markingId - Marking ID
 * @returns {Promise<void>}
 */
export const deleteMarking = async (markingId) => {
  try {
    const headers = await getAuthHeaders();
    await axios.delete(`${API_BASE_URL}/api/markings/${markingId}`, {
      headers,
    });
  } catch (error) {
    console.error('Delete marking error:', error);
    throw new Error(error.response?.data || 'Failed to delete marking');
  }
};
