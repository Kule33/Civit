import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5054';

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

// Get user notifications (paginated)
export const getUserNotifications = async (page = 1, pageSize = 10, isRead = null) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const params = { page, pageSize };
    if (isRead !== null) {
      params.isRead = isRead;
    }

    const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
    throw error;
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

    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`${API_BASE_URL}/api/notifications/unread-count`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    });

    setCache('unreadCount', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.put(
      `${API_BASE_URL}/api/notifications/${notificationId}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.put(
      `${API_BASE_URL}/api/notifications/mark-all-read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.delete(
      `${API_BASE_URL}/api/notifications/${notificationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/notifications`,
      notificationData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
