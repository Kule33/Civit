import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5201';

// Get auth token from local storage
const getAuthToken = () => {
  const authData = JSON.parse(localStorage.getItem('sb-cvkqftzrfwmjotjhqzwa-auth-token') || '{}');
  return authData?.access_token;
};

// Create axios instance with auth
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Create a new typeset request
 * @param {Object} data - { paperFilePath, userMessage?, paperMetadata? }
 * @returns {Promise<Object>} Created typeset request
 */
export const createTypesetRequest = async (data) => {
  try {
    const response = await apiClient.post('/api/typeset-requests', data);
    return response.data;
  } catch (error) {
    console.error('Error creating typeset request:', error);
    throw error;
  }
};

/**
 * Get current user's typeset requests
 * @returns {Promise<Array>} List of user's typeset requests
 */
export const getMyTypesetRequests = async () => {
  try {
    const response = await apiClient.get('/api/typeset-requests/my-requests');
    return response.data;
  } catch (error) {
    console.error('Error fetching typeset requests:', error);
    throw error;
  }
};

/**
 * Get a specific typeset request by ID
 * @param {number} id - Request ID
 * @returns {Promise<Object>} Typeset request details
 */
export const getTypesetRequestById = async (id) => {
  try {
    const response = await apiClient.get(`/api/typeset-requests/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching typeset request #${id}:`, error);
    throw error;
  }
};

/**
 * Check if user can create a new typeset request (rate limiting check)
 * @returns {Promise<boolean>} Whether user can create a request
 */
export const canCreateTypesetRequest = async () => {
  try {
    const response = await apiClient.get('/api/typeset-requests/can-create');
    return response.data.canCreate;
  } catch (error) {
    console.error('Error checking typeset request eligibility:', error);
    return false;
  }
};

/**
 * Delete a typeset request
 * @param {number} id - Request ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteTypesetRequest = async (id) => {
  try {
    await apiClient.delete(`/api/typeset-requests/${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting typeset request #${id}:`, error);
    throw error;
  }
};

/**
 * Save generated PDF to temp storage on backend
 * @param {Object} data - { pdfBase64, fileName?, paperMetadata? }
 * @returns {Promise<Object>} { tempFilePath, fileName, paperMetadata }
 */
export const savePdfToTemp = async (data) => {
  try {
    const response = await apiClient.post('/api/papergenerations/save-temp', data);
    return response.data;
  } catch (error) {
    console.error('Error saving PDF to temp storage:', error);
    throw error;
  }
};

// Admin endpoints (if needed later)
/**
 * Get all typeset requests (Admin only)
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>} List of all typeset requests
 */
export const getAllTypesetRequests = async (status = null) => {
  try {
    const url = status 
      ? `/api/typeset-requests?status=${status}` 
      : '/api/typeset-requests';
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching all typeset requests:', error);
    throw error;
  }
};

/**
 * Update typeset request status (Admin only)
 * @param {number} id - Request ID
 * @param {Object} data - { status, adminNotes?, adminProcessedBy? }
 * @returns {Promise<boolean>} Success status
 */
export const updateTypesetRequestStatus = async (id, data) => {
  try {
    await apiClient.put(`/api/typeset-requests/${id}/status`, data);
    return true;
  } catch (error) {
    console.error(`Error updating typeset request #${id}:`, error);
    throw error;
  }
};

export default {
  createTypesetRequest,
  getMyTypesetRequests,
  getTypesetRequestById,
  canCreateTypesetRequest,
  deleteTypesetRequest,
  savePdfToTemp,
  getAllTypesetRequests,
  updateTypesetRequestStatus,
};
