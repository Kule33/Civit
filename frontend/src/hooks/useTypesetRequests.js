import { useState, useEffect, useCallback } from 'react';
import {
  getMyTypesetRequests,
  createTypesetRequest,
  canCreateTypesetRequest,
  deleteTypesetRequest,
} from '../services/typesetRequestService';

/**
 * Custom hook for managing typeset requests
 * @returns {Object} State and methods for typeset requests
 */
export const useTypesetRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [canCreate, setCanCreate] = useState(true);

  /**
   * Fetch user's typeset requests
   */
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyTypesetRequests();
      setRequests(data);
    } catch (err) {
      console.error('Error fetching typeset requests:', err);
      setError(err.response?.data?.error || 'Failed to load typeset requests');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check if user can create a new request
   */
  const checkCanCreate = useCallback(async () => {
    try {
      const eligible = await canCreateTypesetRequest();
      setCanCreate(eligible);
      return eligible;
    } catch (err) {
      console.error('Error checking eligibility:', err);
      return false;
    }
  }, []);

  /**
   * Create a new typeset request
   * @param {Object} requestData - { paperFilePath, userMessage?, paperMetadata? }
   * @returns {Promise<Object>} Created request or null if failed
   */
  const createRequest = useCallback(async (requestData) => {
    setCreating(true);
    setError(null);
    try {
      const newRequest = await createTypesetRequest(requestData);
      // Add to local state
      setRequests((prev) => [newRequest, ...prev]);
      // Update canCreate status
      await checkCanCreate();
      return newRequest;
    } catch (err) {
      console.error('Error creating typeset request:', err);
      const errorMessage = err.response?.data?.error || 'Failed to create typeset request';
      setError(errorMessage);
      
      // Handle rate limit error
      if (err.response?.status === 429) {
        setCanCreate(false);
      }
      
      throw new Error(errorMessage);
    } finally {
      setCreating(false);
    }
  }, [checkCanCreate]);

  /**
   * Delete a typeset request
   * @param {number} id - Request ID
   * @returns {Promise<boolean>} Success status
   */
  const deleteRequest = useCallback(async (id) => {
    setError(null);
    try {
      await deleteTypesetRequest(id);
      // Remove from local state
      setRequests((prev) => prev.filter((req) => req.id !== id));
      // Update canCreate status
      await checkCanCreate();
      return true;
    } catch (err) {
      console.error('Error deleting typeset request:', err);
      setError(err.response?.data?.error || 'Failed to delete typeset request');
      throw err;
    }
  }, [checkCanCreate]);

  /**
   * Refresh requests list
   */
  const refreshRequests = useCallback(() => {
    return fetchRequests();
  }, [fetchRequests]);

  // Load requests on mount
  useEffect(() => {
    fetchRequests();
    checkCanCreate();
  }, [fetchRequests, checkCanCreate]);

  return {
    requests,
    loading,
    creating,
    error,
    canCreate,
    createRequest,
    deleteRequest,
    refreshRequests,
    checkCanCreate,
  };
};

export default useTypesetRequests;
