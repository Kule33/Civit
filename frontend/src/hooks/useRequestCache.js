/**
 * Simple request cache hook to prevent duplicate API calls
 * Caches responses for a specified duration
 */
import { useRef } from 'react';

// Global cache shared across all component instances
const globalCache = new Map();

export function useRequestCache() {
  const pendingRequests = useRef(new Map());

  /**
   * Wraps an async function with caching and deduplication
   * @param {string} cacheKey - Unique key for this request
   * @param {Function} fetcher - Async function that performs the request
   * @param {number} ttl - Time to live in milliseconds (default: 10000ms = 10s)
   * @returns {Promise} The cached or fresh result
   */
  const cachedRequest = async (cacheKey, fetcher, ttl = 10000) => {
    // Check if we have a valid cached response
    const cached = globalCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      console.log(`[Cache HIT] ${cacheKey}`);
      return cached.data;
    }

    // Check if there's already a pending request for this key
    const pending = pendingRequests.current.get(cacheKey);
    if (pending) {
      console.log(`[Cache PENDING] ${cacheKey} - waiting for in-flight request`);
      return pending;
    }

    // No cache and no pending request - make a new one
    console.log(`[Cache MISS] ${cacheKey} - fetching fresh data`);
    const requestPromise = fetcher()
      .then(data => {
        // Cache the successful response
        globalCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        // Remove from pending requests
        pendingRequests.current.delete(cacheKey);
        
        return data;
      })
      .catch(error => {
        // Remove from pending requests on error
        pendingRequests.current.delete(cacheKey);
        throw error;
      });

    // Store the pending request
    pendingRequests.current.set(cacheKey, requestPromise);

    return requestPromise;
  };

  /**
   * Invalidate cache for a specific key or all keys
   * @param {string} cacheKey - Optional key to invalidate (omit to clear all)
   */
  const invalidateCache = (cacheKey) => {
    if (cacheKey) {
      globalCache.delete(cacheKey);
      console.log(`[Cache INVALIDATE] ${cacheKey}`);
    } else {
      globalCache.clear();
      console.log('[Cache INVALIDATE ALL]');
    }
  };

  return { cachedRequest, invalidateCache };
}

// Export helper to create cache keys
export function createCacheKey(endpoint, params = {}) {
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  
  return paramString ? `${endpoint}?${paramString}` : endpoint;
}
