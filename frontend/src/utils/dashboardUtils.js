// frontend/src/utils/dashboardUtils.js

/**
 * Calculate hero statistics from questions and typesets
 * @param {Array} questions - Array of question objects
 * @param {Array} typesets - Array of typeset objects
 * @returns {Object} Statistics object with totals and coverage
 */
export const calculateHeroStats = (questions, typesets) => {
  const totalQuestions = questions.length;
  const withTypesets = questions.filter(q => q.typesetAvailable).length;
  const totalTypesets = Array.isArray(typesets) && typesets.length > 0 ? typesets.length : withTypesets;
  const missingTypesets = totalQuestions - withTypesets;
  const coverage = totalQuestions > 0 
    ? ((withTypesets / totalQuestions) * 100).toFixed(1) 
    : '0.0';

  return {
    totalQuestions,
    totalTypesets,
    withTypesets,
    missingTypesets,
    coverage
  };
};

/**
 * Group questions by subject with counts
 * @param {Array} questions - Array of question objects
 * @returns {Array} Array of {name, value} objects sorted by count descending
 */
export const groupBySubject = (questions) => {
  const grouped = {};
  questions.forEach(q => {
    const subject = q.subject?.name || 'Unknown';
    grouped[subject] = (grouped[subject] || 0) + 1;
  });
  
  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Group questions by exam type with counts
 * @param {Array} questions - Array of question objects
 * @returns {Array} Array of {name, value} objects
 */
export const groupByExamType = (questions) => {
  const grouped = {};
  questions.forEach(q => {
    const type = q.examType || 'Unknown';
    grouped[type] = (grouped[type] || 0) + 1;
  });
  
  return Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Get top schools by question count
 * @param {Array} questions - Array of question objects
 * @param {number} limit - Maximum number of schools to return
 * @returns {Array} Array of {school, count} objects sorted by count descending
 */
export const getTopSchools = (questions, limit = 10) => {
  const grouped = {};
  questions.forEach(q => {
    const school = q.school?.name || 'Unknown';
    grouped[school] = (grouped[school] || 0) + 1;
  });
  
  return Object.entries(grouped)
    .map(([school, count]) => ({ school, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * Group uploads by date for the last N days
 * @param {Array} questions - Array of question objects
 * @param {Array} typesets - Array of typeset objects
 * @param {number} days - Number of days to include
 * @returns {Array} Array of {date, questions, typesets} objects
 */
export const groupByUploadDate = (questions, typesets, days = 30) => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const dateMap = {};
  
  // Initialize all dates with 0 counts
  for (let i = 0; i < days; i++) {
    const date = new Date(cutoff.getTime() + i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().split('T')[0];
    dateMap[key] = { date: key, questions: 0, typesets: 0 };
  }
  
  // Count questions
  questions.forEach(q => {
    const date = new Date(q.uploadDate).toISOString().split('T')[0];
    if (dateMap[date]) {
      dateMap[date].questions++;
    }
  });
  
  // Count typesets
  typesets.forEach(t => {
    const date = new Date(t.uploadedAt).toISOString().split('T')[0];
    if (dateMap[date]) {
      dateMap[date].typesets++;
    }
  });
  
  return Object.values(dateMap);
};

/**
 * Get recent activity from questions and typesets combined
 * @param {Array} questions - Array of question objects
 * @param {Array} typesets - Array of typeset objects
 * @param {number} limit - Maximum number of items to return
 * @returns {Array} Array of activity items sorted by date descending
 */
export const getRecentActivity = (questions, typesets, limit = 10) => {
  const activity = [];
  
  // Add questions
  questions.forEach(q => {
    activity.push({
      type: 'question',
      id: q.id,
      subject: q.subject?.name || 'N/A',
      school: q.school?.name || 'N/A',
      date: new Date(q.uploadDate),
      fileUrl: q.fileUrl,
      item: q.subject?.name || 'Question'
    });
  });
  
  // Add typesets
  typesets.forEach(t => {
    activity.push({
      type: 'typeset',
      id: t.id,
      subject: t.question?.subject?.name || 'N/A',
      school: t.question?.school?.name || 'N/A',
      date: new Date(t.uploadedAt),
      fileUrl: t.fileUrl,
      item: t.fileName || 'Unnamed'
    });
  });
  
  return activity
    .sort((a, b) => b.date - a.date)
    .slice(0, limit);
};

/**
 * Filter items by date range
 * @param {Array} items - Array of items to filter
 * @param {string} dateField - Name of the date field to use
 * @param {number|null} days - Number of days to include (null for all time)
 * @returns {Array} Filtered array
 */
export const filterByDateRange = (items, dateField, days) => {
  if (!days || days === null) return items; // "All time"
  
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  return items.filter(item => {
    const itemDate = new Date(item[dateField]);
    return itemDate >= cutoff;
  });
};

/**
 * Process paper analytics data from backend
 * @param {Object} analyticsData - Raw analytics data from API
 * @returns {Object} Processed analytics
 */
export const processPaperAnalytics = (analyticsData) => {
  if (!analyticsData) return null;

  return {
    totalPapersGenerated: analyticsData.totalPapersGenerated || 0,
    mostSelectedQuestions: Object.entries(analyticsData.mostSelectedQuestions || {}).map(([id, data]) => ({
      questionId: id,
      selectionCount: data.selectionCount,
      questionText: data.questionText,
      subject: data.subject,
      school: data.school
    })),
    popularSubjects: Object.entries(analyticsData.popularSubjects || {}).map(([name, value]) => ({
      name,
      value
    })).sort((a, b) => b.value - a.value),
    teacherActivity: Object.entries(analyticsData.teacherActivity || {}).map(([email, count]) => ({
      teacherEmail: email,
      papersGenerated: count
    })).sort((a, b) => b.papersGenerated - a.papersGenerated),
    generationTrend: analyticsData.generationTrend || []
  };
};
