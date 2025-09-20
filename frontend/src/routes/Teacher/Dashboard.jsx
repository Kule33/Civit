import React, { useState, useEffect } from 'react';
import { FileText, Search, Heart, Upload, Download, MessageSquare, CreditCard, Star, Clock, CheckCircle, AlertCircle, Plus, Eye, Copy, Filter, Zap, TrendingUp, Users, Target, Database, BookOpen, Activity, BarChart3 } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AnimatedCounter = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
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
          color === 'text-blue-600' ? 'from-blue-500 to-blue-600' :
          color === 'text-red-500' ? 'from-red-500 to-pink-600' :
          color === 'text-purple-600' ? 'from-purple-500 to-purple-600' :
          'from-green-500 to-green-600'
        } shadow-lg mr-4 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="text-white" size={24} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600/80 font-medium">{title}</p>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            <AnimatedCounter value={value.replace(/\D/g, '')} />
            {value.replace(/\d/g, '')}
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

const PulsingDot = ({ color = "bg-green-500" }) => (
  <div className="relative">
    <div className={`w-2 h-2 ${color} rounded-full`}></div>
    <div className={`absolute inset-0 w-2 h-2 ${color} rounded-full animate-ping opacity-75`}></div>
  </div>
);

const PaperMasterDashboard = () => {
  const [activeTab, setActiveTab] = useState('recent');
  const [hoveredCard, setHoveredCard] = useState(null);

  const stats = [
    {
      title: 'Question Bank',
      value: '3,650',
      icon: Database,
      trend: '+450',
      color: 'text-blue-600',
      subtitle: 'Total questions available'
    },
    {
      title: 'Registered Users',
      value: '243',
      icon: Users,
      trend: '+45',
      color: 'text-green-600',
      subtitle: 'Active teachers'
    },
    {
      title: 'Papers Created',
      value: '1,287',
      icon: FileText,
      trend: '+156',
      color: 'text-purple-600',
      subtitle: 'This month'
    },
    {
      title: 'Success Rate',
      value: '94%',
      icon: Target,
      trend: '+2%',
      color: 'text-emerald-600',
      subtitle: 'Paper completion'
    }
  ];

  // Platform Analytics Data
  const questionBankData = [
    { month: 'Jan', questions: 1200, users: 45 },
    { month: 'Feb', questions: 1850, users: 78 },
    { month: 'Mar', questions: 2400, users: 112 },
    { month: 'Apr', questions: 2950, users: 156 },
    { month: 'May', questions: 3200, users: 198 },
    { month: 'Jun', questions: 3650, users: 243 }
  ];

  const subjectEngagement = [
    { subject: 'Mathematics', papers: 1245, color: '#3B82F6', percentage: 28 },
    { subject: 'Physics', papers: 987, color: '#10B981', percentage: 22 },
    { subject: 'Chemistry', papers: 856, color: '#8B5CF6', percentage: 19 },
    { subject: 'Biology', papers: 743, color: '#F59E0B', percentage: 17 },
    { subject: 'English', papers: 432, color: '#EF4444', percentage: 10 },
    { subject: 'History', papers: 187, color: '#6B7280', percentage: 4 }
  ];

  const dailyActivity = [
    { day: 'Mon', papers: 45, uploads: 12 },
    { day: 'Tue', papers: 67, uploads: 18 },
    { day: 'Wed', papers: 89, uploads: 25 },
    { day: 'Thu', papers: 76, uploads: 15 },
    { day: 'Fri', papers: 123, uploads: 32 },
    { day: 'Sat', papers: 98, uploads: 28 },
    { day: 'Sun', papers: 54, uploads: 14 }
  ];

  const quickActions = [
    { 
      icon: Plus, 
      label: 'Create New Paper', 
      gradient: 'from-blue-500 to-blue-600', 
      description: 'Start building a new question paper',
      glow: 'shadow-blue-500/25'
    },
    { 
      icon: Search, 
      label: 'Browse Questions', 
      gradient: 'from-green-500 to-emerald-600', 
      description: 'Search the question bank',
      glow: 'shadow-green-500/25'
    },
    { 
      icon: Upload, 
      label: 'Upload Question', 
      gradient: 'from-purple-500 to-purple-600', 
      description: 'Add your custom question',
      glow: 'shadow-purple-500/25'
    },
    { 
      icon: MessageSquare, 
      label: 'Contact JV Graphics', 
      gradient: 'from-orange-500 to-orange-600', 
      description: 'WhatsApp support',
      glow: 'shadow-orange-500/25'
    }
  ];

  const getStatusConfig = (status) => {
    switch(status) {
      case 'Draft': return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', dot: 'bg-amber-500' };
      case 'Submitted': return { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-100', dot: 'bg-blue-500' };
      case 'Paid': return { icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-100', dot: 'bg-purple-500' };
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
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-4">
            Paper Master Dashboard
          </h1>
          <p className="text-xl text-gray-600/80 max-w-2xl mx-auto leading-relaxed">
            Create, manage, and track your question papers with 
            <span className="text-blue-600 font-semibold"> JV Graphics</span> typesetting services
          </p>
        </div>

        {/* Animated Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
          {/* Platform Analytics Dashboard */}
          <div className="xl:col-span-2">
            <GlassCard className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                    <BarChart3 className="mr-3 text-blue-600" size={28} />
                    Platform Analytics
                  </h2>
                  <p className="text-gray-600/70">Real-time insights into question bank growth and user engagement</p>
                </div>
                <div className="flex bg-gray-100/60 rounded-xl p-1 backdrop-blur-sm">
                  {['overview', 'trends'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        activeTab === tab 
                          ? 'bg-white text-blue-600 shadow-lg shadow-blue-500/10' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Bank Growth Chart */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <Database className="mr-2 text-blue-600" size={20} />
                    Question Bank & User Growth
                  </h3>
                  <div className="flex space-x-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Questions</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">Users</span>
                    </div>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={questionBankData}>
                      <defs>
                        <linearGradient id="questionsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
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
                        dataKey="questions"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#questionsGradient)"
                      />
                      <Area
                        type="monotone"
                        dataKey="users"
                        stroke="#10B981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#usersGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Subject Engagement */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <BookOpen className="mr-2 text-purple-600" size={20} />
                    Most Engaging Subjects
                  </h3>
                  <div className="space-y-3">
                    {subjectEngagement.slice(0, 4).map((subject, index) => (
                      <div key={subject.subject} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full animate-pulse"
                              style={{ backgroundColor: subject.color }}
                            ></div>
                            <span className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                              {subject.subject}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-600">{subject.papers}</span>
                            <span className="text-xs font-semibold text-gray-800">{subject.percentage}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{ 
                              width: `${subject.percentage}%`,
                              backgroundColor: subject.color,
                              boxShadow: `0 0 10px ${subject.color}40`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Activity className="mr-2 text-green-600" size={20} />
                    Weekly Activity
                  </h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyActivity}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Bar 
                          dataKey="papers" 
                          fill="url(#barGradient)" 
                          radius={[4, 4, 0, 0]}
                          stroke="#3B82F6"
                          strokeWidth={1}
                        />
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#60A5FA" />
                            <stop offset="100%" stopColor="#3B82F6" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Dynamic Quick Actions */}
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Zap className="mr-2 text-yellow-500" size={24} />
                Quick Actions
              </h2>
              <div className="space-y-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className={`w-full group flex items-center p-4 rounded-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-r ${action.gradient} text-white shadow-lg hover:shadow-xl ${action.glow} relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    
                    <div className="p-3 rounded-xl bg-white/20 mr-4 group-hover:rotate-12 transition-transform duration-300">
                      <action.icon size={20} />
                    </div>
                    <div className="text-left relative z-10">
                      <span className="font-bold block">{action.label}</span>
                      <span className="text-xs text-white/80">{action.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Animated Favorites */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Favorite Questions</h2>
                <div className="flex items-center space-x-2">
                  <Star className="text-yellow-500 animate-pulse" size={20} />
                  <span className="text-sm text-gray-600 font-semibold">127</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {['Mathematics', 'Physics', 'Chemistry'].map((subject, idx) => (
                  <div key={subject} className="group flex items-center justify-between p-3 border border-gray-200/60 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300">
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-blue-700">{subject}</p>
                      <p className="text-xs text-gray-600">Advanced • 2024</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-yellow-500' : 'bg-red-500'
                    } animate-pulse`}></div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 py-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors font-semibold">
                View All Favorites
              </button>
            </GlassCard>

            {/* Premium Upgrade Card */}
            <GlassCard className="p-6 bg-gradient-to-br from-blue-600 to-purple-700 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-white/20 rounded-xl mr-3">
                    <Users size={24} />
                  </div>
                  <h3 className="font-bold text-xl">Free Tier</h3>
                </div>
                <p className="text-white/90 mb-6 leading-relaxed">
                  Unlock unlimited questions and priority typesetting with our premium plan.
                </p>
                <button className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors hover:scale-105 transform duration-200 shadow-lg">
                  Upgrade Now
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