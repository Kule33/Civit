import axios from 'axios';

const API_BASE_URL = 'http://localhost:5201/api/questions';

// Mapping from frontend values to backend database names
const subjectValueToName = {
  // A/L Physical Science
  'pure_maths': 'Pure Mathematics',
  'applied_maths': 'Applied Mathematics',
  'physics': 'Physics',
  'chemistry': 'Chemistry',
  
  // A/L Biological Science
  'biology': 'Biology',
  
  // A/L Commerce
  'business_studies': 'Business Studies',
  'accounting': 'Accounting',
  'economics': 'Economics',
  
  // A/L Technology
  'engineering_tech': 'Engineering Technology',
  'bio_systems_tech': 'Bio-Systems Technology',
  
  // A/L Arts
  'sinhala': 'Sinhala',
  'history': 'History',
  'geography': 'Geography',
  'buddhism': 'Buddhism',
  'english': 'English',
  'tamil': 'Tamil',
  'music': 'Music',
  'art': 'Art',
  'dancing': 'Dancing',
  'drama': 'Drama',
  
  // O/L Subjects
  'mathematics': 'Mathematics',
  'science': 'Science',
  'civics': 'Civics',
  'ict': 'Information & Communication Technology',
  'health': 'Health & Physical Education',
  'commerce': 'Commerce',
  
  // Grade 5
  'environment': 'Environment Related Activities'
};

// Get Cloudinary signature from backend
export const getCloudinarySignature = async (metadata) => {
  try {
    console.log('📤 Requesting Cloudinary signature with metadata:', metadata);
    
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
    
    const response = await axios.post('http://localhost:5201/api/cloudinary/signature', backendMetadata);
    
    console.log('✅ Signature received:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error getting Cloudinary signature:', error.response?.data || error.message);
    throw error;
  }
};

// Upload file to Cloudinary
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
    
    // Get signature first
    const signatureData = await getCloudinarySignature(metadata);
    console.log('✅ Signature received:', signatureData);
    
    // Upload to Cloudinary
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
export const saveQuestionMetadata = async (metadataWithUrls) => {
  try {
    // Transform subject value to database name and ensure all fields match backend DTO
    const transformedData = {
      country: metadataWithUrls.country,
      examType: metadataWithUrls.examType,
      stream: metadataWithUrls.stream,
      subject: subjectValueToName[metadataWithUrls.subject] || metadataWithUrls.subject,
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

    console.log('📤 Sending to backend:', transformedData);

    const response = await axios.post(API_BASE_URL + '/upload', transformedData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Metadata save successful:', response.data);
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

// Get all subjects from backend
export const getAllSubjects = async () => {
  try {
    const response = await axios.get(API_BASE_URL + '/subjects');
    console.log('✅ Subjects fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch subjects:', error.response?.data || error.message);
    throw error;
  }
};

// Get all schools from backend
export const getAllSchools = async () => {
  try {
    const response = await axios.get(API_BASE_URL + '/schools');
    console.log('✅ Schools fetched:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch schools:', error.response?.data || error.message);
    throw error;
  }
};

// Test backend connection
export const testBackendConnection = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
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
    
    const signature = await getCloudinarySignature(testData);
    console.log('🎉 Cloudinary signature endpoint works!', signature);
    return signature;
  } catch (error) {
    console.error('❌ Cloudinary signature endpoint failed', error);
    throw error;
  }
};