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
        { value: 'Pure Mathematics', label: 'Pure Mathematics' },
        { value: 'Applied Mathematics', label: 'Applied Mathematics' },
        { value: 'Physics', label: 'Physics' },
        { value: 'Chemistry', label: 'Chemistry' }
      ],
      biological: [
        { value: 'Biology', label: 'Biology' },
        { value: 'Physics', label: 'Physics' },
        { value: 'Chemistry', label: 'Chemistry' }
      ],
      commerce: [
        { value: 'Business Studies', label: 'Business Studies' },
        { value: 'Accounting', label: 'Accounting' },
        { value: 'Economics', label: 'Economics' }
      ],
      technology: [
        { value: 'Engineering Technology', label: 'Engineering Technology' },
        { value: 'Bio-Systems Technology', label: 'Bio-Systems Technology' }
      ],
      arts: [
        { value: 'Sinhala', label: 'Sinhala' },
        { value: 'History', label: 'History' },
        { value: 'Geography', label: 'Geography' },
        { value: 'Buddhism', label: 'Buddhism' },
        { value: 'English', label: 'English' },
        { value: 'Tamil', label: 'Tamil' },
        { value: 'Music', label: 'Music' },
        { value: 'Art', label: 'Art' },
        { value: 'Dancing', label: 'Dancing' },
        { value: 'Drama', label: 'Drama' }
      ],
      o_level: [
        { value: 'Mathematics', label: 'Mathematics' },
        { value: 'Science', label: 'Science' },
        { value: 'Sinhala', label: 'Sinhala' },
        { value: 'English', label: 'English' },
        { value: 'History', label: 'History' },
        { value: 'Geography', label: 'Geography' },
        { value: 'Civics', label: 'Civics' },
        { value: 'Buddhism', label: 'Buddhism' },
        { value: 'Tamil', label: 'Tamil' },
        { value: 'Information & Communication Technology', label: 'Information & Communication Technology' },
        { value: 'Health & Physical Education', label: 'Health & Physical Education' },
        { value: 'Commerce', label: 'Commerce' },
        { value: 'Accounting', label: 'Accounting' },
        { value: 'Art', label: 'Art' },
        { value: 'Music', label: 'Music' },
        { value: 'Dancing', label: 'Dancing' },
        { value: 'Drama', label: 'Drama' }
      ],
      grade5: [
        { value: 'Mathematics', label: 'Mathematics' },
        { value: 'Sinhala', label: 'Sinhala' },
        { value: 'Tamil', label: 'Tamil' },
        { value: 'Environment Related Activities', label: 'Environment Related Activities' },
        { value: 'English', label: 'English' }
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
      let staticSubjects = [];
      if (metadata.stream) {
        staticSubjects = allOptions.subjects[metadata.stream] || [];
      } else if (metadata.examType && ['o_level'].includes(metadata.examType)) {
        staticSubjects = allOptions.subjects[metadata.examType] || [];
      }
      
      // Transform backend subjects to the correct format
      const backendSubjects = (availableOptions.backendSubjects || []).map(subject => ({
        value: subject.Name, // Use original name for backend compatibility
        label: subject.Name
      })).filter(s => s.value && s.label);
      
      // Combine static and backend subjects, avoiding duplicates
      const combinedSubjects = [...staticSubjects];
      backendSubjects.forEach(backendSubject => {
        if (!combinedSubjects.find(s => s.value === backendSubject.value)) {
          combinedSubjects.push(backendSubject);
        }
      });
      
      newAvailableOptions.subjects = combinedSubjects;
    }

    // Set paper types for specific subjects or for Grade 5
    if (['Physics', 'Chemistry', 'Biology'].includes(metadata.subject)) {
      const subjectKey = metadata.subject.toLowerCase();
      newAvailableOptions.paperTypes = allOptions.paperTypes[subjectKey] || [];
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