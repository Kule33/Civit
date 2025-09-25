import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Upload, Download, MessageSquare, Plus, Eye, 
  Clock, CheckCircle, AlertCircle, BookOpen, Users, Target, Database,
  Filter, Star, Heart, Copy, Edit3, Trash2, Settings, Bell,
  TrendingUp, Activity, BarChart3, PieChart, Calendar, Award
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const AnimatedCounter = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = parseInt(value.toString().replace(/\D/g, ''));
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);
  
  return count;
};

const GlassCard = ({ children, className = "", hover = true }) => (
  <div className={`
    backdrop-blur-xl bg-white/70 border border-white/20 
    shadow-xl shadow-black/5 rounded-2xl
    ${hover ? 'hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1' : ''}
    transition-all duration-500 ease-out
    ${className}
  `}>
    {children}
  </div>
);

const StatCard = ({ title, value, icon: Icon, trend, color, subtitle, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <GlassCard className={`p-6 relative overflow-hidden group ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    } transition-all duration-700 ease-out`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      
      <div className="flex items-center relative z-10">
        <div className={`p-4 rounded-2xl bg-gradient-to-br ${
          color === 'blue' ? 'from-blue-500 to-blue-600' :
          color === 'green' ? 'from-green-500 to-green-600' :
          color === 'purple' ? 'from-purple-500 to-purple-600' :
          color === 'orange' ? 'from-orange-500 to-orange-600' :
          'from-gray-500 to-gray-600'
        } shadow-lg mr-4 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="text-white" size={24} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600/80 font-medium">{title}</p>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {typeof value === 'string' && value.includes('%') ? 
              <><AnimatedCounter value={value.replace(/\D/g, '')} />{value.replace(/\d/g, '')}</> :
              <AnimatedCounter value={value} />
            }
          </h3>
          {subtitle && <p className="text-xs text-gray-500/70 mt-1">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center mt-2 ${trend.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>
              <TrendingUp size={12} className="mr-1" />
              <p className="text-xs font-semibold">{trend} from last month</p>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

const PaperMasterDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Relevant stats for Paper Master
  const stats = [
    {
      title: 'My Questions',
      value: 127,
      icon: Database,
      trend: '+12',
      color: 'blue',
      subtitle: 'Questions uploaded'
    },
    {
      title: 'Papers Created',
      value: 43,
      icon: FileText,
      trend: '+8',
      color: 'green',
      subtitle: 'This month'
    },
    {
      title: 'Favorites',
      value: 89,
      icon: Heart,
      trend: '+15',
      color: 'purple',
      subtitle: 'Saved questions'
    },
    {
      title: 'Download Credits',
      value: 25,
      icon: Download,
      color: 'orange',
      subtitle: 'Remaining credits'
    }
  ];

  // Recent papers data
  const recentPapers = [
    { 
      id: 1, 
      title: 'Mathematics Grade 10 - Final Exam', 
      date: '2024-09-20', 
      status: 'Completed',
      questions: 25,
      subject: 'Mathematics'
    },
    { 
      id: 2, 
      title: 'Physics Chapter 3 - Motion', 
      date: '2024-09-18', 
      status: 'In Progress',
      questions: 15,
      subject: 'Physics'
    },
    { 
      id: 3, 
      title: 'Chemistry Organic Compounds', 
      date: '2024-09-15', 
      status: 'Draft',
      questions: 20,
      subject: 'Chemistry'
    },
    { 
      id: 4, 
      title: 'Biology Cell Structure Quiz', 
      date: '2024-09-12', 
      status: 'Completed',
      questions: 12,
      subject: 'Biology'
    }
  ];

  // Subject distribution data
  const subjectData = [
    { subject: 'Mathematics', count: 45, color: '#3B82F6' },
    { subject: 'Physics', count: 32, color: '#10B981' },
    { subject: 'Chemistry', count: 28, color: '#8B5CF6' },
    { subject: 'Biology', count: 22, color: '#F59E0B' }
  ];

  // Activity data for the last 7 days
  const activityData = [
    { day: 'Mon', uploads: 3, downloads: 5, papers: 2 },
    { day: 'Tue', uploads: 5, downloads: 8, papers: 1 },
    { day: 'Wed', uploads: 2, downloads: 12, papers: 3 },
    { day: 'Thu', uploads: 7, downloads: 6, papers: 1 },
    { day: 'Fri', uploads: 4, downloads: 15, papers: 4 },
    { day: 'Sat', uploads: 1, downloads: 3, papers: 0 },
    { day: 'Sun', uploads: 2, downloads: 7, papers: 2 }
  ];

  const quickActions = [
    { 
      icon: Plus, 
      label: 'Create Paper', 
      gradient: 'from-blue-500 to-blue-600', 
      description: 'Start building a new question paper',
      glow: 'shadow-blue-500/25',
      route: '/teacher/paper-builder'
    },
    { 
      icon: Upload, 
      label: 'Upload Question', 
      gradient: 'from-green-500 to-emerald-600', 
      description: 'Add your custom question',
      glow: 'shadow-green-500/25',
      route: '/admin/question-upload'
    },
    { 
      icon: Search, 
      label: 'Browse Questions', 
      gradient: 'from-purple-500 to-purple-600', 
      description: 'Search the question bank',
      glow: 'shadow-purple-500/25',
      route: '/teacher/paper-builder'
    },
    { 
      icon: MessageSquare, 
      label: 'JV Graphics Support', 
      gradient: 'from-orange-500 to-orange-600', 
      description: 'WhatsApp support for typesetting',
      glow: 'shadow-orange-500/25',
      route: 'https://wa.me/1234567890'
    }
  ];

  const getStatusConfig = (status) => {
    switch(status) {
      case 'Draft': return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', dot: 'bg-amber-500' };
      case 'In Progress': return { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100', dot: 'bg-blue-500' };
      case 'Completed': return { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-100', dot: 'bg-emerald-500' };
      default: return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-500' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-r from-green-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
              Welcome back, Teacher!
            </h1>
            <p className="text-lg text-gray-600/80">
              Manage your question papers with 
              <span className="text-blue-600 font-semibold"> Paper Master</span>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-3 rounded-2xl bg-white/70 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <Bell size={20} className="text-gray-600" />
            </button>
            <button className="p-3 rounded-2xl bg-white/70 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              color={stat.color}
              subtitle={stat.subtitle}
              delay={index * 150}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="xl:col-span-2 space-y-6">
            {/* Quick Actions */}
            <GlassCard className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Plus className="mr-3 text-blue-600" size={28} />
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className={`group flex items-center p-5 rounded-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-r ${action.gradient} text-white shadow-lg hover:shadow-xl ${action.glow} relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    
                    <div className="p-3 rounded-xl bg-white/20 mr-4 group-hover:rotate-12 transition-transform duration-300">
                      <action.icon size={24} />
                    </div>
                    <div className="text-left relative z-10">
                      <span className="font-bold text-lg block">{action.label}</span>
                      <span className="text-sm text-white/80">{action.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Recent Papers */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FileText className="mr-3 text-green-600" size={28} />
                  Recent Papers
                </h2>
                <button className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                {recentPapers.map((paper, index) => {
                  const statusConfig = getStatusConfig(paper.status);
                  return (
                    <div key={paper.id} className="group p-4 border border-gray-200/60 rounded-2xl hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <BookOpen size={20} className="text-blue-600" />
                            <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                              {paper.title}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Calendar size={14} className="mr-1" />
                              {paper.date}
                            </span>
                            <span className="flex items-center">
                              <Database size={14} className="mr-1" />
                              {paper.questions} questions
                            </span>
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-medium">
                              {paper.subject}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl ${statusConfig.bg}`}>
                            <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`}></div>
                            <span className={`text-sm font-semibold ${statusConfig.color}`}>
                              {paper.status}
                            </span>
                          </div>
                          <div className="flex space-x-2">
                            <button className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                              <Eye size={16} className="text-gray-600" />
                            </button>
                            <button className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                              <Edit3 size={16} className="text-gray-600" />
                            </button>
                            <button className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                              <Download size={16} className="text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Activity Chart */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Activity className="mr-3 text-purple-600" size={28} />
                  Weekly Activity
                </h2>
                <div className="flex bg-gray-100/60 rounded-xl p-1 backdrop-blur-sm">
                  {['week', 'month'].map((period) => (
                    <button
                      key={period}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        period === 'week' 
                          ? 'bg-white text-blue-600 shadow-lg' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData}>
                    <defs>
                      <linearGradient id="uploadsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="downloadsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="uploads"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#uploadsGradient)"
                    />
                    <Area
                      type="monotone"
                      dataKey="downloads"
                      stroke="#10B981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#downloadsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-center space-x-8 mt-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 font-medium">Uploads</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600 font-medium">Downloads</span>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Subject Distribution */}
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <PieChart className="mr-3 text-purple-600" size={24} />
                My Question Subjects
              </h2>
              
              <div className="h-48 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={subjectData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {subjectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="space-y-3">
                {subjectData.map((subject, index) => (
                  <div key={subject.subject} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      ></div>
                      <span className="font-medium text-gray-800">{subject.subject}</span>
                    </div>
                    <span className="text-sm text-gray-600 font-semibold">{subject.count}</span>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Favorites */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Recent Favorites</h2>
                <div className="flex items-center space-x-2">
                  <Heart className="text-red-500 animate-pulse" size={20} />
                  <span className="text-sm text-gray-600 font-semibold">89</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {['Quadratic Equations', 'Newton\'s Laws', 'Organic Chemistry'].map((question, idx) => (
                  <div key={question} className="group flex items-center justify-between p-3 border border-gray-200/60 rounded-xl hover:bg-gradient-to-r hover:from-red-50/50 hover:to-pink-50/50 transition-all duration-300">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors">{question}</p>
                      <p className="text-xs text-gray-600">Grade 10 • Advanced</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-1 rounded-lg hover:bg-red-100 transition-colors">
                        <Copy size={14} className="text-gray-600" />
                      </button>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-semibold">
                View All Favorites
              </button>
            </GlassCard>

            {/* JV Graphics Info */}
            <GlassCard className="p-6 bg-gradient-to-br from-orange-500 to-red-600 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-white/20 rounded-xl mr-3">
                    <Award size={24} />
                  </div>
                  <h3 className="font-bold text-xl">JV Graphics</h3>
                </div>
                <p className="text-white/90 mb-6 leading-relaxed">
                  Professional typesetting services for your question papers. Get beautifully formatted papers in 24 hours.
                </p>
                <div className="space-y-2 mb-6">
                  <div className="flex items-center space-x-2 text-white/80 text-sm">
                    <CheckCircle size={16} />
                    <span>Professional formatting</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/80 text-sm">
                    <CheckCircle size={16} />
                    <span>24-hour delivery</span>
                  </div>
                  <div className="flex items-center space-x-2 text-white/80 text-sm">
                    <CheckCircle size={16} />
                    <span>Multiple formats (PDF, DOC)</span>
                  </div>
                </div>
                <button className="w-full bg-white text-orange-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors hover:scale-105 transform duration-200 shadow-lg">
                  Contact via WhatsApp
                </button>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperMasterDashboard;