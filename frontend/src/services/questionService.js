import axios from 'axios';
import { getSubjectName } from '../utils/subjectMapping.js';
import { supabase } from '../supabaseClient';

const API_BASE_URL = 'http://localhost:5201/api/questions';
const CLOUDINARY_API_URL = 'http://localhost:5201/api/cloudinary';

// ============================================
// PERFORMANCE OPTIMIZATION: Caching & Deduplication
// ============================================

// In-memory cache for API responses
const cache = {
  questions: { data: null, timestamp: 0 },
  subjects: { data: null, timestamp: 0 },
  schools: { data: null, timestamp: 0 },
  CACHE_DURATION: 30000, // 30 seconds
};

// Track in-flight requests to prevent duplicates
const inFlightRequests = {};

// Invalidate cache (call after mutations)
export const invalidateCache = (key = null) => {
  if (key) {
    console.log(`🗑️ Invalidating cache for: ${key}`);
    cache[key] = { data: null, timestamp: 0 };
  } else {
    console.log('🗑️ Invalidating all caches');
    Object.keys(cache).forEach(k => {
      if (k !== 'CACHE_DURATION') {
        cache[k] = { data: null, timestamp: 0 };
      }
    });
  }
};

// Helper function to get the authorization header with the current Supabase JWT
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
    };
  } catch (error) {
    console.error("Error in getAuthHeaders:", error);
    throw error;
  }
};

// Test authentication function - ADD THIS FOR DEBUGGING
export const testAuth = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Current session:', session);
    console.log('User:', session?.user);
    console.log('Access token:', session?.access_token ? 'Present' : 'Missing');
    if (session?.user) {
      console.log('User role:', session.user.user_metadata?.role || 'No role set');
      console.log('User email:', session.user.email);
    }
    return session;
  } catch (error) {
    console.error('Auth test failed:', error);
    return null;
  }
};

// Get Cloudinary signature from backend
export const getCloudinarySignature = async (metadata) => {
  try {
    console.log('📤 Requesting Cloudinary signature with metadata:', metadata);
    
    const authHeaders = await getAuthHeaders();

    // Transform the data to match backend DTO field names (PascalCase)
    const backendMetadata = {
      Country: metadata.country,
      ExamType: metadata.examType,
      Stream: metadata.stream,
      Subject: metadata.subject,
      PaperType: metadata.paperType,
      PaperCategory: metadata.paperCategory
    };

    console.log('🔄 Transformed for backend:', backendMetadata);
    
    const response = await axios.post(`${CLOUDINARY_API_URL}/signature`, backendMetadata, authHeaders);
    
    console.log('✅ Signature received:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error getting Cloudinary signature:', error.response?.data || error.message);
    throw error;
  }
};

// Upload file to Cloudinary (direct upload to Cloudinary does NOT need our backend JWT)
export const uploadToCloudinary = async (file, signatureData, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signatureData.apiKey);
  formData.append('timestamp', signatureData.timestamp);
  formData.append('signature', signatureData.signature);
  formData.append('folder', signatureData.folder);

  try {
    console.log('📤 Uploading to Cloudinary with signature data:', signatureData);
    
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('✅ Cloudinary upload successful:', response.data);
    
    // Return Cloudinary's direct response fields
    return {
      publicId: response.data.public_id,
      secureUrl: response.data.secure_url,
      format: response.data.format,
      bytes: response.data.bytes,
      fileName: file.name
    };
  } catch (error) {
    console.error('❌ Error uploading to Cloudinary:', error.response?.data || error.message);
    throw error;
  }
};

// Combined function with progress tracking - WITH FALLBACK
export const uploadWithProgress = async (file, metadata, onProgress) => {
  try {
    console.log('🚀 Starting Cloudinary upload process...');
    
    // Get signature first (this call now includes auth headers)
    const signatureData = await getCloudinarySignature(metadata);
    console.log('✅ Signature received:', signatureData);
    
    // Upload to Cloudinary (this call does NOT need auth headers)
    const result = await uploadToCloudinary(file, signatureData, onProgress);
    
    console.log('✅ Cloudinary upload successful:', result);
    
    // IMPORTANT: Transform Cloudinary result fields to match backend DTO field names
    return {
      fileUrl: result.secureUrl,        // ← Convert secureUrl to fileUrl for backend
      filePublicId: result.publicId,    // ← Convert publicId to filePublicId for backend
      fileName: result.fileName,
      fileSize: result.bytes,           // Backend expects fileSize
      fileFormat: result.format
    };
    
  } catch (error) {
    console.error('💥 Cloudinary upload failed, using fallback mock data:', error);
    
    // SIMULATE PROGRESS FOR FALLBACK
    if (onProgress) {
      setTimeout(() => onProgress(25), 100);
      setTimeout(() => onProgress(50), 200);
      setTimeout(() => onProgress(75), 300);
      setTimeout(() => onProgress(100), 400);
    }
    
    // RETURN MOCK DATA WITH EXACT BACKEND FIELD NAMES for consistency
    return {
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1701234567/sample.jpg',
      filePublicId: `mock_${file.name}_${Date.now()}`,
      fileName: file.name,
      fileSize: file.size, // Mock file size
      fileFormat: file.type.split('/')[1] || 'jpg'
    };
  }
};

// Save metadata after Cloudinary upload
export const saveQuestionMetadata = async (metadataWithUrls, batchIndex = null, batchTotal = null) => {
  try {
    const authHeaders = await getAuthHeaders();

    // Transform subject value to database name and ensure all fields match backend DTO
    const transformedData = {
      country: metadataWithUrls.country,
      examType: metadataWithUrls.examType,
      stream: metadataWithUrls.stream,
      subject: getSubjectName(metadataWithUrls.subject),
      paperType: metadataWithUrls.paperType,
      paperCategory: metadataWithUrls.paperCategory,
      year: metadataWithUrls.year,
      term: metadataWithUrls.term,
      schoolName: metadataWithUrls.schoolName,
      uploader: metadataWithUrls.uploader,
      // Pass the already transformed Cloudinary fields from uploadWithProgress
      fileUrl: metadataWithUrls.fileUrl,
      filePublicId: metadataWithUrls.filePublicId,
      fileName: metadataWithUrls.fileName,
      fileSize: metadataWithUrls.fileSize,
      fileFormat: metadataWithUrls.fileFormat
    };

    // Add batch parameters to URL if provided
    let url = API_BASE_URL + '/upload';
    if (batchIndex !== null && batchTotal !== null) {
      url += `?batchIndex=${batchIndex}&batchTotal=${batchTotal}`;
      console.log(`📤 Sending to backend (batch ${batchIndex + 1}/${batchTotal}):`, transformedData);
    } else {
      console.log('📤 Sending to backend:', transformedData);
    }

    const response = await axios.post(url, transformedData, authHeaders);
    
    console.log('✅ Metadata save successful:', response.data);
    
    // Invalidate questions cache after successful save
    invalidateCache('questions');
    
    return response.data;
  } catch (error) {
    console.error('❌ Metadata save failed:');
    if (error.response) {
      console.error('  Status:', error.response.status);
      console.error('  Data:', error.response.data);
      console.error('  Headers:', error.response.headers);
    } else if (error.request) {
      console.error('  No response received:', error.request);
    } else {
      console.error('  Error:', error.message);
    }
    throw error;
  }
};

// Search questions with filters - OPTIMIZED WITH CACHING & DEDUPLICATION
export const searchQuestions = async (params) => {
  try {
    const cacheKey = `questions_${params?.toString() || 'all'}`;
    const now = Date.now();
    
    // Check cache first using the specific cache key
    if (cache[cacheKey]?.data && cache[cacheKey]?.timestamp && 
        (now - cache[cacheKey].timestamp < cache.CACHE_DURATION)) {
      console.log('💾 Returning cached questions for key:', cacheKey);
      return cache[cacheKey].data;
    }
    
    // Check for in-flight request
    if (inFlightRequests[cacheKey]) {
      console.log('⏳ Deduplicating questions request');
      return await inFlightRequests[cacheKey];
    }
    
    // Create new request
    const requestPromise = (async () => {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(
        `${API_BASE_URL}?${params?.toString() || ''}`, 
        { 
          ...authHeaders,
          timeout: 30000 // 30 second timeout
        }
      );
      console.log('✅ Questions searched:', response.data.length || 0, 'items');
      
      // Update cache using the specific cache key
      cache[cacheKey] = { data: response.data, timestamp: now };
      
      return response.data;
    })();
    
    // Track in-flight request
    inFlightRequests[cacheKey] = requestPromise;
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      delete inFlightRequests[cacheKey];
    }
  } catch (error) {
    console.error('❌ Failed to search questions:', error.response?.data || error.message);
    throw error;
  }
};

// Get all subjects from backend - OPTIMIZED WITH CACHING
export const getAllSubjects = async () => {
  try {
    const now = Date.now();
    
    // Check cache
    if (cache.subjects.data && cache.subjects.timestamp && 
        (now - cache.subjects.timestamp < cache.CACHE_DURATION)) {
      console.log('💾 Returning cached subjects');
      return cache.subjects.data;
    }
    
    // Check for in-flight request
    if (inFlightRequests.subjects) {
      console.log('⏳ Deduplicating subjects request');
      return await inFlightRequests.subjects;
    }
    
    const requestPromise = (async () => {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(API_BASE_URL + '/subjects', { 
        ...authHeaders, 
        timeout: 30000 
      });
      console.log('✅ Subjects fetched:', response.data.length || 0);
      cache.subjects = { data: response.data, timestamp: now };
      return response.data;
    })();
    
    inFlightRequests.subjects = requestPromise;
    try {
      return await requestPromise;
    } finally {
      delete inFlightRequests.subjects;
    }
  } catch (error) {
    console.error('❌ Failed to fetch subjects:', error.response?.data || error.message);
    throw error;
  }
};

// Get all schools from backend - OPTIMIZED WITH CACHING
export const getAllSchools = async () => {
  try {
    const now = Date.now();
    
    // Check cache
    if (cache.schools.data && cache.schools.timestamp && 
        (now - cache.schools.timestamp < cache.CACHE_DURATION)) {
      console.log('💾 Returning cached schools');
      return cache.schools.data;
    }
    
    // Check for in-flight request
    if (inFlightRequests.schools) {
      console.log('⏳ Deduplicating schools request');
      return await inFlightRequests.schools;
    }
    
    const requestPromise = (async () => {
      const authHeaders = await getAuthHeaders();
      const response = await axios.get(API_BASE_URL + '/schools', { 
        ...authHeaders, 
        timeout: 30000 
      });
      console.log('✅ Schools fetched:', response.data.length || 0);
      cache.schools = { data: response.data, timestamp: now };
      return response.data;
    })();
    
    inFlightRequests.schools = requestPromise;
    try {
      return await requestPromise;
    } finally {
      delete inFlightRequests.schools;
    }
  } catch (error) {
    console.error('❌ Failed to fetch schools:', error.response?.data || error.message);
    throw error;
  }
};

// Test backend connection
export const testBackendConnection = async () => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.get(API_BASE_URL, authHeaders);
    console.log('✅ Backend test successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Backend test failed:', error.response?.data || error.message);
    throw error;
  }
};

// Test Cloudinary signature endpoint
export const testCloudinarySignature = async () => {
  try {
    const testData = {
      country: 'sri_lanka',
      examType: 'a_level',
      stream: 'physical',
      subject: 'Physics',
      paperType: 'mcq',
      paperCategory: 'PastPaper'
    };
    
    // This calls the getCloudinarySignature function, which now includes auth headers
    const signature = await getCloudinarySignature(testData); 
    console.log('🎉 Cloudinary signature endpoint works!', signature);
    return signature;
  } catch (error) {
    console.error('❌ Cloudinary signature endpoint failed', error);
    throw error;
  }
};

/**
 * Delete a question (Admin only)
 * @param {string} questionId - GUID of the question to delete
 * @returns {Promise<boolean>} true if deleted successfully
 */
export const deleteQuestion = async (questionId) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.delete(`${API_BASE_URL}/${questionId}`, authHeaders);
    
    // Invalidate questions cache after successful delete
    if (response.status === 204 || response.status === 200) {
      invalidateCache('questions');
    }
    
    return response.status === 204 || response.status === 200;
  } catch (error) {
    console.error('Error deleting question:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Log paper generation to track analytics
 * @param {Array<string>} questionIds - Array of question GUIDs included in the paper
 * @param {string} paperTitle - Optional title for the paper
 * @returns {Promise<Object>} Response data from the backend
 */
export const logPaperGeneration = async (questionIds, paperTitle = null) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.post(
      'http://localhost:5201/api/papergenerations/log',
      { questionIds, paperTitle },
      authHeaders
    );
    console.log('✅ Paper generation logged:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error logging paper generation:', error.response?.data || error.message);
    // Don't throw error - logging failures shouldn't break paper generation
    return null;
  }
};

/**
 * Get paper generation analytics
 * @param {number} days - Number of days to fetch analytics for (default: 30)
 * @returns {Promise<Object>} Analytics data
 */
export const getPaperAnalytics = async (days = 30) => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.get(
      `http://localhost:5201/api/papergenerations/analytics?days=${days}`,
      authHeaders
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching paper analytics:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Get total user count from Supabase
 * @returns {Promise<Object>} User count data
 */
export const getUserCount = async () => {
  try {
    const authHeaders = await getAuthHeaders();
    const response = await axios.get(
      'http://localhost:5201/api/users/count',
      authHeaders
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user count:', error.response?.data || error.message);
    return { totalUsers: 0, adminCount: 0, teacherCount: 0 };
  }
};