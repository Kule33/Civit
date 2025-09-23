import { useState, useEffect } from 'react';
import { getAllSubjects, getAllSchools } from '../services/questionService';

export const useMetadata = (initialMetadata = {}) => {
  const [metadata, setMetadata] = useState({
    country: '',
    examType: '',
    stream: '',
    subject: '',
    paperType: '',
    paperCategory: '',
    year: '',
    term: '',
    schoolName: '',
    uploader: '',
    ...initialMetadata
  });

  const [availableOptions, setAvailableOptions] = useState({
    examTypes: [],
    streams: [],
    subjects: [],
    paperTypes: [],
    schools: []
  });

  const [loading, setLoading] = useState(false);

  // Define all possible options
  const allOptions = {
    countries: [
      { value: 'sri_lanka', label: 'Sri Lanka' },
      { value: 'other', label: 'Other' }
    ],
    
    examTypes: {
      sri_lanka: [
        { value: 'a_level', label: 'A/L (Advanced Level)' },
        { value: 'o_level', label: 'O/L (Ordinary Level)' },
        { value: 'grade5', label: 'Grade 5 Scholarship' }
      ],
      other: [
        { value: 'other', label: 'Other Examination' }
      ]
    },
    
    streams: {
      a_level: [
        { value: 'physical', label: 'Physical Science Stream' },
        { value: 'biological', label: 'Biological Science Stream' },
        { value: 'commerce', label: 'Commerce Stream' },
        { value: 'technology', label: 'Technology Stream' },
        { value: 'arts', label: 'Arts Stream' }
      ]
    },
    
    subjects: {
      physical: [
        { value: 'pure_maths', label: 'Pure Mathematics' },
        { value: 'applied_maths', label: 'Applied Mathematics' },
        { value: 'physics', label: 'Physics' },
        { value: 'chemistry', label: 'Chemistry' }
      ],
      biological: [
        { value: 'biology', label: 'Biology' },
        { value: 'physics', label: 'Physics' },
        { value: 'chemistry', label: 'Chemistry' }
      ],
      commerce: [
        { value: 'business_studies', label: 'Business Studies' },
        { value: 'accounting', label: 'Accounting' },
        { value: 'economics', label: 'Economics' }
      ],
      technology: [
        { value: 'engineering_tech', label: 'Engineering Technology' },
        { value: 'bio_systems_tech', label: 'Bio-Systems Technology' }
      ],
      arts: [
        { value: 'sinhala', label: 'Sinhala' },
        { value: 'history', label: 'History' },
        { value: 'geography', label: 'Geography' },
        { value: 'buddhism', label: 'Buddhism' },
        { value: 'english', label: 'English' },
        { value: 'tamil', label: 'Tamil' },
        { value: 'music', label: 'Music' },
        { value: 'art', label: 'Art' },
        { value: 'dancing', label: 'Dancing' },
        { value: 'drama', label: 'Drama' }
      ],
      o_level: [
        { value: 'mathematics', label: 'Mathematics' },
        { value: 'science', label: 'Science' },
        { value: 'sinhala', label: 'Sinhala' },
        { value: 'english', label: 'English' },
        { value: 'history', label: 'History' },
        { value: 'geography', label: 'Geography' },
        { value: 'civics', label: 'Civics' },
        { value: 'buddhism', label: 'Buddhism' },
        { value: 'tamil', label: 'Tamil' },
        { value: 'ict', label: 'Information & Communication Technology' },
        { value: 'health', label: 'Health & Physical Education' },
        { value: 'commerce', label: 'Commerce' },
        { value: 'accounting', label: 'Accounting' },
        { value: 'art', label: 'Art' },
        { value: 'music', label: 'Music' },
        { value: 'dancing', label: 'Dancing' },
        { value: 'drama', label: 'Drama' }
      ],
      grade5: [
        { value: 'mathematics', label: 'Mathematics' },
        { value: 'sinhala', label: 'Sinhala' },
        { value: 'tamil', label: 'Tamil' },
        { value: 'environment', label: 'Environment Related Activities' },
        { value: 'english', label: 'English' }
      ]
    },
    
    paperTypes: {
      physics: [
        { value: 'mcq', label: 'MCQ Paper' },
        { value: 'essay', label: 'Essay Paper' },
        { value: 'practical', label: 'Practical Paper' }
      ],
      chemistry: [
        { value: 'mcq', label: 'MCQ Paper' },
        { value: 'essay', label: 'Essay Paper' },
        { value: 'practical', label: 'Practical Paper' }
      ],
      biology: [
        { value: 'mcq', label: 'MCQ Paper' },
        { value: 'essay', label: 'Essay Paper' },
        { value: 'practical', label: 'Practical Paper' }
      ],
      grade5: [
        { value: 'mcq', label: 'MCQ Paper' },
        { value: 'essay', label: 'Essay Paper' }
      ]
    }
  };

  // Load schools and subjects from backend on mount
  useEffect(() => {
    loadBackendData();
  }, []);

  const loadBackendData = async () => {
    setLoading(true);
    try {
      const [subjects, schools] = await Promise.all([
        getAllSubjects(),
        getAllSchools()
      ]);

      setAvailableOptions(prev => ({
        ...prev,
        backendSubjects: subjects,
        backendSchools: schools,
        schools: schools // Also set the schools array for compatibility
      }));
    } catch (error) {
      console.error('Failed to load backend data:', error);
      // Don't throw the error, just log it so the component can still work
      // with static options even if backend data fails to load
      setAvailableOptions(prev => ({
        ...prev,
        backendSubjects: [],
        backendSchools: [],
        schools: []
      }));
    } finally {
      setLoading(false);
    }
  };

  // Refresh only schools (e.g., after creating a new school)
  const refreshSchools = async () => {
    try {
      const schools = await getAllSchools();
      setAvailableOptions(prev => ({
        ...prev,
        backendSchools: schools,
        schools: schools
      }));
    } catch (error) {
      console.error('Failed to refresh schools:', error);
    }
  };

  // Update available options based on current selections
  useEffect(() => {
    const newAvailableOptions = {
      examTypes: [],
      streams: [],
      subjects: [],
      paperTypes: [],
      schools: availableOptions.backendSchools || []
    };

    // Set exam types based on country
    if (metadata.country) {
      newAvailableOptions.examTypes = allOptions.examTypes[metadata.country] || [];
    }

    // Set streams based on exam type
    if (metadata.examType === 'a_level') {
      newAvailableOptions.streams = allOptions.streams[metadata.examType] || [];
    }

    // Set subjects based on stream or exam type
    if (metadata.examType !== 'grade5') {
      if (metadata.stream) {
        newAvailableOptions.subjects = allOptions.subjects[metadata.stream] || [];
      } else if (metadata.examType && ['o_level'].includes(metadata.examType)) {
        newAvailableOptions.subjects = allOptions.subjects[metadata.examType] || [];
      }
    }

    // Set paper types for specific subjects or for Grade 5
    if (['physics', 'chemistry', 'biology'].includes(metadata.subject)) {
      newAvailableOptions.paperTypes = allOptions.paperTypes[metadata.subject] || [];
    } else if (metadata.examType === 'grade5') {
      newAvailableOptions.paperTypes = allOptions.paperTypes.grade5 || [];
    }

    setAvailableOptions(prev => ({ ...prev, ...newAvailableOptions }));
  }, [metadata.country, metadata.examType, metadata.stream, metadata.subject, availableOptions.backendSchools]);

  const updateMetadata = (field, value) => {
    setMetadata(prev => {
      const newMetadata = { ...prev, [field]: value };
      
      // Reset dependent fields when parent field changes
      const resetDependencies = {
        country: ['examType', 'stream', 'subject', 'paperType'],
        examType: ['stream', 'subject', 'paperType'],
        stream: ['subject', 'paperType'],
        subject: ['paperType']
      };

      if (resetDependencies[field]) {
        resetDependencies[field].forEach(depField => {
          newMetadata[depField] = '';
        });
      }
      
      return newMetadata;
    });
  };

  const validateMetadata = () => {
    // For Grade 5, we don't require subject, but require paperType
    if (metadata.examType === 'grade5') {
      return metadata.country && metadata.examType && metadata.paperType;
    }
    // For other exam types, require subject
    return metadata.country && metadata.examType && metadata.subject;
  };

  const resetMetadata = () => {
    setMetadata({
      country: '',
      examType: '',
      stream: '',
      subject: '',
      paperType: '',
      paperCategory: '',
      year: '',
      term: '',
      schoolName: '',
      uploader: ''
    });
  };

  return {
    metadata,
    availableOptions,
    loading,
    updateMetadata,
    validateMetadata,
    resetMetadata,
    refreshSchools
  };
};