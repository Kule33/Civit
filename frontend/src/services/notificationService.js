import axios from 'axios';
import { supabase } from '../supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5201';

// Simplified cache with better performance
const cache = new Map();
const pendingRequests = new Map();

// Cache helper with deduplication
const getCached = async (cacheKey, fetcher, ttlMs = 15000) => {
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data;
  }

  // Check if request is already in flight
  const pending = pendingRequests.get(cacheKey);
  if (pending) {
    return pending;
  }

  // Make new request
  const promise = fetcher()
    .then(data => {
      cache.set(cacheKey, { data, timestamp: Date.now() });
      pendingRequests.delete(cacheKey);
      return data;
    })
    .catch(error => {
      pendingRequests.delete(cacheKey);
      throw error;
    });

  pendingRequests.set(cacheKey, promise);
  return promise;
};

// Clear cache helper
const clearCache = (cacheKey) => {
  if (cacheKey) {
    cache.delete(cacheKey);
  } else {
    cache.clear();
  }
  pendingRequests.clear();
};

// Helper: Get authorization headers from Supabase session
const getAuthHeaders = async () => {
  try {
    // Add timeout to prevent hanging
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session fetch timeout')), 2000)
    );
    
    const result = await Promise.race([sessionPromise, timeoutPromise]);
    const { data: { session }, error } = result;
    
    if (error || !session) {
      return null;
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    };
  } catch (error) {
    console.error('Error getting auth headers:', error);
    return null;
  }
};

// Get user notifications (paginated) with caching and deduplication
export const getUserNotifications = async (page = 1, pageSize = 10, isRead = null) => {
  const cacheKey = `notifications_${page}_${pageSize}_${isRead}`;
  
  return getCached(cacheKey, async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        return { notifications: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
      }

      const params = { page, pageSize };
      if (isRead !== null) {
        params.isRead = isRead;
      }

      const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers,
        params,
        timeout: 10000, // Reduced timeout to 10s
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { notifications: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
    }
  }, 15000); // Cache for 15 seconds
};

// Get unread count (for badge) with caching and deduplication
export const getUnreadCount = async () => {
  return getCached('unread_count', async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers) {
        return { unreadCount: 0 };
      }

      const response = await axios.get(`${API_BASE_URL}/api/notifications/unread-count`, {
        headers,
        timeout: 10000, // Reduced timeout to 10s
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { unreadCount: 0 };
    }
  }, 15000); // Cache for 15 seconds
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) {
      throw new Error('Not authenticated');
    }

    const response = await axios.put(
      `${API_BASE_URL}/api/notifications/${notificationId}/read`,
      {},
      {
        headers,
        timeout: 30000,
      }
    );

    // Invalidate cache after marking as read
    clearCache();

    return response.data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) {
      throw new Error('Not authenticated');
    }

    const response = await axios.put(
      `${API_BASE_URL}/api/notifications/mark-all-read`,
      {},
      {
        headers,
        timeout: 30000,
      }
    );

    // Invalidate cache after marking all as read
    clearCache();

    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) {
      throw new Error('Not authenticated');
    }

    const response = await axios.delete(
      `${API_BASE_URL}/api/notifications/${notificationId}`,
      {
        headers,
        timeout: 30000,
      }
    );

    // Invalidate cache after deletion
    clearCache();

    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Create notification (admin only)
export const createNotification = async (notificationData) => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) {
      throw new Error('Not authenticated');
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/notifications`,
      notificationData,
      {
        headers,
        timeout: 30000,
      }
    );

    // Invalidate cache after creation
    clearCache();

    return response.data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Export cache clear function for external use
export const clearNotificationCache = clearCache;
