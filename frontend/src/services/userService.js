import apiClient from './apiClient';

const API_BASE_URL = 'http://localhost:5201/api/userprofiles';

// Helper function to get the authorization header using stored token
const getAuthHeaders = async (accessToken = null) => {
  const token = accessToken || localStorage.getItem('auth_token');
  if (!token) throw new Error('No auth token');
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    timeout: 10000,
  };
};

/**
 * Get current user's profile
 * @param {string} accessToken - Optional access token to use (avoids calling getSession)
 * @returns {Promise<Object>} User profile data
 */
export const getMyProfile = async (accessToken = null) => {
  console.log('[userService] getMyProfile called');
  try {
    console.log('[userService] Getting auth headers for profile fetch...');
    const authHeaders = await getAuthHeaders(accessToken);
    console.log('[userService] Auth headers obtained, making API call to', `${API_BASE_URL}/me`);
    const response = await apiClient.get(`${API_BASE_URL}/me`, authHeaders);
    console.log('[userService] Profile API response received:', response.status);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Profile not found');
    }
    throw error;
  }
};

/**
 * Create a new user profile
 * @param {Object} profileData - Profile data (without id or role - backend handles these)
 * @returns {Promise<Object>} Created profile
 */
export const createProfile = async (profileData) => {
  try {
    // Remove id and role if present - backend extracts from JWT
    const { id: _id, role: _role, ...dataWithoutIdAndRole } = profileData;
    
    const authHeaders = await getAuthHeaders();
    const response = await apiClient.post(API_BASE_URL, dataWithoutIdAndRole, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      throw new Error(error.response.data.message || 'Profile already exists or NIC is duplicate');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid profile data');
    }
    throw error;
  }
};

/**
 * Update current user's own profile
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} Updated profile
 */
export const updateMyProfile = async (profileData) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await apiClient.put(`${API_BASE_URL}/me`, profileData, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Profile not found');
    }
    if (error.response?.status === 409) {
      throw new Error(error.response.data.message || 'NIC already exists');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid profile data');
    }
    throw error;
  }
};

/**
 * Update user profile (admin only, or user updating their own profile)
 * @param {string} id - User profile ID
 * @param {Object} profileData - Updated profile data
 * @returns {Promise<Object>} Updated profile
 */
export const updateProfile = async (id, profileData) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await apiClient.put(`${API_BASE_URL}/${id}`, profileData, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Profile not found');
    }
    if (error.response?.status === 409) {
      throw new Error(error.response.data.message || 'NIC already exists');
    }
    if (error.response?.status === 403) {
      throw new Error('Not authorized to update this profile');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid profile data');
    }
    throw error;
  }
};

/**
 * Get all user profiles (admin only)
 * @returns {Promise<Array>} List of all profiles
 */
export const getAllProfiles = async () => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await apiClient.get(API_BASE_URL, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    throw error;
  }
};

/**
 * Get profile by ID (admin only)
 * @param {string} id - User profile ID
 * @returns {Promise<Object>} User profile
 */
export const getProfileById = async (id) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await apiClient.get(`${API_BASE_URL}/${id}`, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Profile not found');
    }
    if (error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    throw error;
  }
};

/**
 * Change user role (admin only)
 * @param {string} id - User profile ID
 * @param {string} newRole - New role ('admin' or 'teacher')
 * @returns {Promise<Object>} Updated profile
 */
export const changeUserRole = async (id, newRole) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await apiClient.put(`${API_BASE_URL}/${id}/role`, { role: newRole }, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Profile not found');
    }
    if (error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid role');
    }
    throw error;
  }
};

/**
 * Get current user's activity statistics
 * @returns {Promise<Object>} User activity stats
 */
export const getMyActivity = async () => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/me/activity`, authHeaders);
    return response.data;
  } catch (error) {
    console.error('Error fetching own activity:', error);
    throw error;
  }
};

/**
 * Get user activity statistics (admin only)
 * @param {string} userId - User ID to get activity for
 * @returns {Promise<Object>} User activity stats
 */
export const getUserActivity = async (userId) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/${userId}/activity`, authHeaders);
    return response.data;
  } catch (error) {
    console.error('Error fetching user activity:', error);
    throw error;
  }
};
