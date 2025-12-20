// frontend/src/routes/Teacher/Dashboard.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileQuestion, 
  FileCheck, 
  PieChart as PieChartIcon, 
  AlertTriangle, 
  BookOpen,
  ClipboardList,
  TrendingUp,
  School,
  Activity,
  Zap,
  RefreshCw,
  Upload,
  FileUp,
  Settings,
  BarChart3,
  ExternalLink,
  CheckCircle,
  FileText,
  Users,
  Star,
  Sparkles,
  Award,
  Target,
  UserCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import Card from '../../components/ui/card.jsx';
import Button from '../../components/ui/Button.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { searchQuestions, getPaperAnalytics } from '../../services/questionService.js';
import { getTypesetByQuestionId } from '../../services/typesetService.js';
import { searchPapers } from '../../services/paperService.js';
import { searchMarkings } from '../../services/markingService.js';
import { getAllProfiles } from '../../services/userService.js';
import { supabase } from '../../supabaseClient';
import { useSubmission } from '../../context/SubmissionContext';
import {
  calculateHeroStats,
  groupBySubject,
  groupByExamType,
  getTopSchools,
  groupByUploadDate,
  getRecentActivity,
  processPaperAnalytics
} from '../../utils/dashboardUtils.js';

// Color palettes
const BLUE_COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'];
const EXAM_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const { showOverlay, dashboard, setDashboardState } = useSubmission();
  const { questions, typesets, paperAnalytics, papers, markings, totalUsers } = dashboard;
  const loadInFlightRef = useRef(false);

  // Load all data on mount - only once per session
  useEffect(() => {
    if (dashboard.loaded || loadInFlightRef.current) return;
    loadAllData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAllData = async () => {
    if (loadInFlightRef.current) return;
    try {
      loadInFlightRef.current = true;
      setLoading(true);
      
      // Get session token and user info first
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const userRole = session?.user?.user_metadata?.role || 'teacher';

      // 1) Load questions first (fast path). This lets the dashboard render almost immediately.
      const questionsData = await searchQuestions(new URLSearchParams()).catch(err => {
        console.error('Error loading questions:', err);
        return [];
      });

      const questionsArray = Array.isArray(questionsData) ? questionsData : [];
      setDashboardState(prev => ({
        ...prev,
        questions: questionsArray,
        loaded: true
      }));

      // Stop showing loading skeletons once questions are in.
      setLoading(false);

      // 2) Load the rest in the background (lazy / staged)
      if (token) {
        getPaperAnalytics(365)
          .then(result => setDashboardState(prev => ({
            ...prev,
            paperAnalytics: processPaperAnalytics(result)
          })))
          .catch(err => console.error('Error loading paper analytics:', err));

        searchPapers({})
          .then(result => {
            const papersArray = Array.isArray(result) ? result : [];
            console.log('📄 Papers loaded:', papersArray.length);
            setDashboardState(prev => ({ ...prev, papers: papersArray }));
          })
          .catch(err => console.error('Error loading papers:', err));

        searchMarkings({})
          .then(result => {
            const markingsArray = Array.isArray(result) ? result : [];
            console.log('📝 Markings loaded:', markingsArray.length);
            setDashboardState(prev => ({ ...prev, markings: markingsArray }));
          })
          .catch(err => console.error('Error loading markings:', err));

        if (userRole === 'admin') {
          getAllProfiles()
            .then(result => {
              const profilesArray = Array.isArray(result) ? result : [];
              console.log('📊 User profiles loaded:', profilesArray.length);
              setDashboardState(prev => ({ ...prev, totalUsers: profilesArray.length }));
            })
            .catch(err => console.error('Error loading user profiles:', err));
        }
      }
      
      // 3) Defer heavy per-question typeset fetch. This is the slowest part.
      if (token && questionsArray.length > 0) {
        setTimeout(async () => {
          const questionsWithTypesets = questionsArray.filter(q => q.typesetAvailable);

          const typesetPromises = questionsWithTypesets.map(async (q) => {
            try {
              const typeset = await getTypesetByQuestionId(q.id, token);
              if (typeset) {
                return { ...typeset, question: q };
              }
            } catch (error) {
              console.error(`Error loading typeset for question ${q.id}:`, error);
            }
            return null;
          });

          const typesetsResults = await Promise.all(typesetPromises);
          const validTypesets = typesetsResults.filter(t => t !== null);

          setDashboardState(prev => ({
            ...prev,
            typesets: validTypesets
          }));
        }, 0);
      } else {
        setDashboardState(prev => ({ ...prev, typesets: [] }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showOverlay({
        status: 'error',
        message: 'Failed to load dashboard data',
        autoClose: true,
        autoCloseDelay: 3000
      });
    } finally {
      setLoading(false);
      loadInFlightRef.current = false;
    }
  };

  const handleRefresh = () => {
    loadAllData();
  };

  // Use all questions and typesets (no filtering)
  const filteredQuestions = questions;
  const filteredTypesets = typesets;

  // Calculate metrics
  const heroStats = useMemo(() => 
    calculateHeroStats(filteredQuestions, filteredTypesets),
    [filteredQuestions, filteredTypesets]
  );

  const subjectData = useMemo(() => 
    groupBySubject(filteredQuestions),
    [filteredQuestions]
  );

  const examTypeData = useMemo(() => 
    groupByExamType(filteredQuestions),
    [filteredQuestions]
  );

  const topSchools = useMemo(() => 
    getTopSchools(filteredQuestions, 10),
    [filteredQuestions]
  );

  const trendData = useMemo(() => {
    return groupByUploadDate(filteredQuestions, filteredTypesets, 30);
  }, [filteredQuestions, filteredTypesets]);

  const recentActivity = useMemo(() => 
    getRecentActivity(filteredQuestions, filteredTypesets, 5),
    [filteredQuestions, filteredTypesets]
  );

  const papersSubjectData = useMemo(() => 
    groupBySubject(papers),
    [papers]
  );

  const markingsSubjectData = useMemo(() => 
    groupBySubject(markings),
    [markings]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Dashboard"
          subtitle="Overview of questions, typesets, and system activity"
        />
        <Button variant="outline" size="small" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          // ⚡ Show skeleton cards while loading
          <>
            <HeroStatsCardSkeleton />
            <HeroStatsCardSkeleton />
            <HeroStatsCardSkeleton />
            <HeroStatsCardSkeleton />
            <HeroStatsCardSkeleton />
          </>
        ) : (
          // ⚡ Show actual data when loaded
          <>
            <HeroStatsCard
              title="Questions"
              value={heroStats.totalQuestions}
              icon={BookOpen}
              color="blue"
              gradient="from-blue-500 to-cyan-500"
            />
            <HeroStatsCard
              title="Typesets"
              value={heroStats.totalTypesets}
              icon={Award}
              color="green"
              gradient="from-green-500 to-emerald-500"
            />
            <HeroStatsCard
              title="Coverage"
              value={`${heroStats.coverage}%`}
              icon={Target}
              color="purple"
              gradient="from-purple-500 to-pink-500"
              subtitle={`${heroStats.withTypesets} with typesets`}
            />
            <HeroStatsCard
              title="Registered Users"
              value={totalUsers}
              icon={UserCheck}
              color="orange"
              gradient="from-orange-500 to-amber-500"
              subtitle="Total users"
            />
            <HeroStatsCard
              title="Papers"
              value={paperAnalytics?.totalPapersGenerated || 0}
              icon={Sparkles}
              color="indigo"
              gradient="from-indigo-500 to-violet-500"
              subtitle="Generated"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SubjectPieChart data={subjectData} />
        <ExamTypePieChart data={examTypeData} />
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UploadTrendChart 
          data={trendData}
          days={30}
        />
        <TopSchoolsList schools={topSchools} />
      </div>

      {/* Recent Activity */}
      <RecentActivityTable activity={recentActivity} />

      {/* Papers & Markings Analytics Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          Papers & Markings Library
        </h2>
      </div>

      {/* Papers & Markings Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <HeroStatsCard
          title="Papers Uploaded"
          value={papers.length}
          icon={FileText}
          color="blue"
          gradient="from-blue-500 to-cyan-500"
          subtitle="Total papers"
        />
        <HeroStatsCard
          title="Markings Uploaded"
          value={markings.length}
          icon={FileCheck}
          color="green"
          gradient="from-green-500 to-emerald-500"
          subtitle="Total marking schemes"
        />
        <HeroStatsCard
          title="Total Resources"
          value={papers.length + markings.length}
          icon={BookOpen}
          color="purple"
          gradient="from-purple-500 to-pink-500"
          subtitle="Papers + Markings"
        />
      </div>

      {/* Papers & Markings Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Papers by Subject
            </h3>
            {papersSubjectData.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No papers uploaded yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={papersSubjectData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {papersSubjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BLUE_COLORS[index % BLUE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-green-600" />
              Markings by Subject
            </h3>
            {markingsSubjectData.length === 0 ? (
              <div className="text-center py-12">
                <FileCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No markings uploaded yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={markingsSubjectData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {markingsSubjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={EXAM_COLORS[index % EXAM_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Paper Builder Analytics Section */}
      {paperAnalytics && (
        <>
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              Paper Builder Analytics
            </h2>
          </div>

          {/* Paper Generation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <HeroStatsCard
              title="Papers Generated"
              value={paperAnalytics.totalPapersGenerated}
              icon={Sparkles}
              color="blue"
              gradient="from-blue-500 to-cyan-500"
              subtitle="Total papers created"
            />
            <HeroStatsCard
              title="Most Popular"
              value={paperAnalytics.popularSubjects[0]?.name || 'N/A'}
              icon={Star}
              color="purple"
              gradient="from-purple-500 to-pink-500"
              subtitle={`${paperAnalytics.popularSubjects[0]?.value || 0} times selected`}
            />
            <HeroStatsCard
              title="Active Teachers"
              value={paperAnalytics.teacherActivity.length}
              icon={UserCheck}
              color="green"
              gradient="from-green-500 to-emerald-500"
              subtitle="Using Paper Builder"
            />
          </div>

          {/* Paper Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MostSelectedQuestionsList questions={paperAnalytics.mostSelectedQuestions} />
            <PopularPaperSubjectsChart subjects={paperAnalytics.popularSubjects} />
          </div>

          {/* Teacher Activity and Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeacherActivityTable teachers={paperAnalytics.teacherActivity} />
            <PaperGenerationTrendChart trend={paperAnalytics.generationTrend} />
          </div>
        </>
      )}

      {/* Alerts & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertCard missingCount={heroStats.missingTypesets} />
        <QuickActionsCard />
      </div>
    </div>
  );
};

// ⚡ Skeleton loading component for Hero Stats Card
const HeroStatsCardSkeleton = () => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-lg animate-pulse">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-10 bg-gray-300 rounded w-16"></div>
            <div className="h-2 bg-gray-200 rounded w-24 mt-2"></div>
          </div>
          <div className="p-3 rounded-xl bg-gray-200 w-12 h-12"></div>
        </div>
      </div>
      <div className="h-1 bg-gray-200"></div>
    </div>
  );
};

const HeroStatsCard = ({ title, value, icon: Icon, color, gradient, subtitle }) => {
  const colorClasses = {
    blue: {
      shadow: 'shadow-blue-500/20',
      ring: 'ring-blue-500/10',
      text: 'text-blue-600'
    },
    green: {
      shadow: 'shadow-green-500/20',
      ring: 'ring-green-500/10',
      text: 'text-green-600'
    },
    purple: {
      shadow: 'shadow-purple-500/20',
      ring: 'ring-purple-500/10',
      text: 'text-purple-600'
    },
    orange: {
      shadow: 'shadow-orange-500/20',
      ring: 'ring-orange-500/10',
      text: 'text-orange-600'
    },
    indigo: {
      shadow: 'shadow-indigo-500/20',
      ring: 'ring-indigo-500/10',
      text: 'text-indigo-600'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-lg ${colors.shadow} hover:shadow-xl transition-all duration-300 group hover:-translate-y-1 ring-1 ${colors.ring}`}>
      {/* Gradient Background Accent */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
      
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">{title}</p>
            <p className={`text-4xl font-bold bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${gradient}`}></span>
                {subtitle}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            {Icon ? React.createElement(Icon, { className: 'h-6 w-6 text-white' }) : null}
          </div>
        </div>
      </div>
      
      {/* Bottom Accent Line */}
      <div className={`h-1 bg-gradient-to-r ${gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
    </div>
  );
};

// Subject Pie Chart Component
const SubjectPieChart = ({ data }) => {
  if (data.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Questions by Subject
          </h3>
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No data available</p>
            <p className="text-sm text-gray-500 mt-1">Upload questions to see distribution</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          Questions by Subject
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BLUE_COLORS[index % BLUE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

// Exam Type Pie Chart Component
const ExamTypePieChart = ({ data }) => {
  if (data.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Questions by Exam Type
          </h3>
          <div className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No data available</p>
            <p className="text-sm text-gray-500 mt-1">Upload questions to see distribution</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-blue-600" />
          Questions by Exam Type
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={EXAM_COLORS[index % EXAM_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

// Upload Trend Chart Component
const UploadTrendChart = ({ data, days }) => {
  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Upload Trend (Last {days} Days)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="questions"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Questions"
            />
            <Line
              type="monotone"
              dataKey="typesets"
              stroke="#10b981"
              strokeWidth={2}
              name="Typesets"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

// Top Schools List Component
const TopSchoolsList = ({ schools }) => {
  if (schools.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <School className="h-5 w-5 text-blue-600" />
            Top 10 Schools by Questions
          </h3>
          <div className="text-center py-12">
            <School className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No data available</p>
          </div>
        </div>
      </Card>
    );
  }

  const maxCount = Math.max(...schools.map(s => s.count));

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <School className="h-5 w-5 text-blue-600" />
          Top 10 Schools by Questions
        </h3>
        <div className="space-y-3">
          {schools.map((school, index) => (
            <div key={school.school} className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-500 w-6">{index + 1}.</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">{school.school}</span>
                  <span className="text-sm text-gray-600 ml-2">{school.count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(school.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// Recent Activity Table Component
const RecentActivityTable = ({ activity }) => {
  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Recent Activity (Last 5 Uploads)
        </h3>
        {activity.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No recent activity</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">School</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Uploaded</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activity.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        item.type === 'question'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.type === 'question' ? <FileQuestion className="h-3 w-3" /> : <FileCheck className="h-3 w-3" />}
                        {item.type === 'question' ? 'Question' : 'Typeset'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{item.item}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.subject}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.school}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDistanceToNow(item.date, { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => window.open(item.fileUrl, '_blank')}
                        className="text-blue-600 hover:text-blue-800"
                        title="View File"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};

// Alert Card Component
const AlertCard = ({ missingCount }) => {
  const navigate = useNavigate();

  if (missingCount === 0) {
    return (
      <Card>
        <div className="p-6 text-center">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">All Set!</h3>
          <p className="text-sm text-gray-600">All questions have typeset documents.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Attention Needed</h3>
            <p className="text-sm text-red-800 mb-4">
              <span className="font-bold">{missingCount} questions</span> are missing typeset documents.
            </p>
            <Button
              variant="primary"
              size="small"
              onClick={() => navigate('/admin/typeset/upload')}
              className="bg-red-600 hover:bg-red-700"
            >
              Upload Typesets →
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Quick Actions Card Component
const QuickActionsCard = () => {
  const navigate = useNavigate();

  const actions = [
    { label: 'Upload Question', icon: Upload, path: '/admin/upload-question', color: 'blue' },
    { label: 'Upload Typeset', icon: FileUp, path: '/admin/typeset/upload', color: 'green' },
    { label: 'Manage Questions', icon: Settings, path: '/admin/manage-questions', color: 'gray' },
    { label: 'View Reports', icon: BarChart3, path: '/teacher/dashboard', color: 'purple' },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700',
    green: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-700',
    gray: 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700'
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`flex items-center gap-3 p-4 border rounded-lg transition-colors text-left ${colorClasses[action.color]}`}
            >
              <action.icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
};

// Most Selected Questions List Component
const MostSelectedQuestionsList = ({ questions }) => {
  if (!questions || questions.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-blue-600" />
            Most Selected Questions
          </h3>
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No data available</p>
            <p className="text-sm text-gray-500 mt-1">Generate papers to see popular questions</p>
          </div>
        </div>
      </Card>
    );
  }

  const maxCount = Math.max(...questions.map(q => q.selectionCount), 1);

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-blue-600" />
          Most Selected Questions
        </h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {questions.map((question, index) => (
            <div key={question.questionId} className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-500 w-6">{index + 1}.</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{question.questionText || 'Untitled'}</p>
                    <p className="text-xs text-gray-500">
                      {question.subject} • {question.school}
                    </p>
                  </div>
                  <span className="text-sm text-gray-600 ml-2 flex-shrink-0">{question.selectionCount}x</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all"
                    style={{ width: `${(question.selectionCount / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// Popular Paper Subjects Chart Component
const PopularPaperSubjectsChart = ({ subjects }) => {
  if (!subjects || subjects.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Popular Subjects in Papers
          </h3>
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No data available</p>
          </div>
        </div>
      </Card>
    );
  }

  const PAPER_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          Popular Subjects in Papers
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={subjects}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {subjects.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PAPER_COLORS[index % PAPER_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

// Teacher Activity Table Component
const TeacherActivityTable = ({ teachers }) => {
  if (!teachers || teachers.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Teacher Activity
          </h3>
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No activity yet</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Teacher Activity
        </h3>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Teacher</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Papers Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teachers.slice(0, 10).map((teacher, index) => (
                <tr key={teacher.teacherEmail} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{teacher.teacherEmail}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 text-right">{teacher.papersGenerated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

// Paper Generation Trend Chart Component
const PaperGenerationTrendChart = ({ trend }) => {
  if (!trend || trend.length === 0) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Paper Generation Trend
          </h3>
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No data available</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Paper Generation Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), 'MMM dd')}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(date) => format(new Date(date), 'MMM dd, yyyy')}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Papers Generated"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default Dashboard;
