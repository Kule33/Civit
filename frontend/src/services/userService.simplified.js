// Simplified User Service - Server handles all authentication validation
// This version removes redundant client-side checks since the server validates everything

import axios from 'axios';
import { supabase } from '../supabaseClient';

const API_BASE_URL = 'http://localhost:5201/api/userprofiles';

/**
 * Get authorization headers with current session token
 * Server handles all token validation, expiration checks, and role extraction
 */
const getAuthHeaders = async (accessToken = null) => {
  try {
    // Get token from provided parameter or current session
    let token = accessToken;
    
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    }
    
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    return {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    };
  } catch (err) {
    console.error('Failed to get auth headers:', err);
    throw err;
  }
};

/**
 * Get current user's profile
 * Server validates authentication and extracts user ID from JWT token
 */
export const getMyProfile = async (accessToken = null) => {
  try {
    const authHeaders = await getAuthHeaders(accessToken);
    const response = await axios.get(`${API_BASE_URL}/me`, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Profile not found. Please complete your profile.');
    }
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in.');
    }
    throw error;
  }
};

/**
 * Create a new user profile
 * Server extracts user ID and role from JWT token
 */
export const createProfile = async (profileData) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.post(API_BASE_URL, profileData, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      throw new Error('Profile already exists');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Invalid profile data');
    }
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    throw error;
  }
};

/**
 * Update current user's own profile
 * Server validates that user is updating their own profile
 */
export const updateMyProfile = async (profileData) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.put(`${API_BASE_URL}/me`, profileData, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Profile not found');
    }
    if (error.response?.status === 409) {
      throw new Error('Email already in use');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Invalid profile data');
    }
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    throw error;
  }
};

/**
 * Update user profile by ID
 * Server validates: admin can update any profile, users can only update their own
 */
export const updateProfile = async (id, profileData) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.put(`${API_BASE_URL}/${id}`, profileData, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Profile not found');
    }
    if (error.response?.status === 409) {
      throw new Error('Email already in use');
    }
    if (error.response?.status === 403) {
      throw new Error('You do not have permission to update this profile');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Invalid profile data');
    }
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    throw error;
  }
};

/**
 * Get all user profiles
 * Server validates: admin only
 */
export const getAllProfiles = async () => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.get(API_BASE_URL, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    throw error;
  }
};

/**
 * Get profile by ID
 * Server validates: admin only
 */
export const getProfileById = async (id) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/${id}`, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Profile not found');
    }
    if (error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    throw error;
  }
};

/**
 * Change user role
 * Server validates: admin only
 */
export const changeUserRole = async (id, newRole) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.put(`${API_BASE_URL}/${id}/role`, { role: newRole }, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('User not found');
    }
    if (error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || 'Invalid role');
    }
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    throw error;
  }
};

/**
 * Get current user's activity statistics
 * Server validates authentication and extracts user ID from token
 */
export const getMyActivity = async () => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/me/activity`, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    throw error;
  }
};

/**
 * Get user activity statistics by user ID
 * Server validates: admin only
 */
export const getUserActivity = async (userId) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.get(`${API_BASE_URL}/${userId}/activity`, authHeaders);
    return response.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Admin access required');
    }
    if (error.response?.status === 401) {
      throw new Error('Authentication required');
    }
    throw error;
  }
};
