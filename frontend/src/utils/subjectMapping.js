// Subject value to name mapping for consistent transformation between frontend and backend
export const subjectValueToName = {
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

// Helper function to transform subject value to name
export const getSubjectName = (subjectValue) => {
  return subjectValueToName[subjectValue] || subjectValue;
};

// Helper function to transform metadata for backend API calls
export const transformMetadataForBackend = (metadata) => {
  return {
    ...metadata,
    subject: metadata.subject ? getSubjectName(metadata.subject) : metadata.subject
  };
};
