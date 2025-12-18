import apiClient from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5201';

// Cache configuration
const CACHE_CONFIG = {
  notifications: { ttl: 15000 }, // 15 seconds
  unreadCount: { ttl: 10000 },   // 10 seconds
};

// Cache storage
const cache = {
  notifications: { data: null, timestamp: null },
  unreadCount: { data: null, timestamp: null },
};

// Helper: Check if cache is valid
const isCacheValid = (cacheKey) => {
  const cached = cache[cacheKey];
  if (!cached.data || !cached.timestamp) return false;
  
  const age = Date.now() - cached.timestamp;
  return age < CACHE_CONFIG[cacheKey].ttl;
};

// Helper: Get from cache
const getFromCache = (cacheKey) => {
  if (isCacheValid(cacheKey)) {
    return cache[cacheKey].data;
  }
  return null;
};

// Helper: Set cache
const setCache = (cacheKey, data) => {
  cache[cacheKey] = {
    data,
    timestamp: Date.now(),
  };
};

// Helper: Clear cache
const clearCache = (cacheKey) => {
  if (cacheKey) {
    cache[cacheKey] = { data: null, timestamp: null };
  } else {
    // Clear all cache
    Object.keys(cache).forEach(key => {
      cache[key] = { data: null, timestamp: null };
    });
  }
};

// Helper: Get authorization headers from Supabase session
const getAuthHeaders = async () => {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Get user notifications (paginated)
export const getUserNotifications = async (page = 1, pageSize = 10, isRead = null) => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) {
      // Return empty list if not authenticated
      return { notifications: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
    }

    const params = { page, pageSize };
    if (isRead !== null) {
      params.isRead = isRead;
    }

    const response = await apiClient.get(`${API_BASE_URL}/api/notifications`, {
      headers,
      params,
      timeout: 30000,
    });

    // Cache the first page of all notifications
    if (page === 1 && isRead === null) {
      setCache('notifications', response.data);
    }

    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Return empty list on error
    return { notifications: [], totalCount: 0, page: 1, pageSize: 10, totalPages: 0 };
  }
};

// Get unread count (for badge)
export const getUnreadCount = async () => {
  try {
    // Check cache first
    const cached = getFromCache('unreadCount');
    if (cached !== null) {
      return cached;
    }

    const headers = await getAuthHeaders();
    if (!headers) {
      // Return 0 if not authenticated
      return { unreadCount: 0 };
    }

    const response = await apiClient.get(`${API_BASE_URL}/api/notifications/unread-count`, {
      headers,
      timeout: 30000,
    });

    setCache('unreadCount', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    // Return 0 count on error
    return { unreadCount: 0 };
  }
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  try {
    const headers = await getAuthHeaders();
    if (!headers) {
      throw new Error('Not authenticated');
    }

    const response = await apiClient.put(
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

    const response = await apiClient.put(
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

    const response = await apiClient.delete(
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
