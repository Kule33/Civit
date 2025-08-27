import React from 'react';
import { FileText, Users, CreditCard, TrendingUp, Plus, Share, Download, Eye, Icon } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
    <div className={`p-3 rounded-xl ${color} bg-opacity-10 mr-4`}>
      <Icon className={color} size={24} />
    </div>
    <div>
      <p className="text-sm text-gray-600">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
      {trend && (
        <p className={`text-xs ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          {trend} from last month
        </p>
      )}
    </div>
  </div>
);

const TeacherDashboard = () => {
  const stats = [
    {
      title: 'Total Papers',
      value: '12',
      icon: FileText,
      trend: '+2',
      color: 'text-blue-600'
    },
    {
      title: 'Students',
      value: '254',
      icon: Users,
      trend: '+12',
      color: 'text-green-600'
    },
    {
      title: 'Revenue',
      value: '$1,240',
      icon: CreditCard,
      trend: '+$240',
      color: 'text-purple-600'
    },
    {
      title: 'Engagement',
      value: '78%',
      icon: TrendingUp,
      trend: '+5%',
      color: 'text-orange-600'
    }
  ];

  const recentPapers = [
    { id: 1, title: 'Mathematics Final Exam', date: '2 hours ago', status: 'Published' },
    { id: 2, title: 'Science Quiz', date: '5 hours ago', status: 'Draft' },
    { id: 3, title: 'History Midterm', date: '1 day ago', status: 'Published' },
    { id: 4, title: 'English Literature Test', date: '2 days ago', status: 'Archived' },
  ];

  const quickActions = [
    { icon: Plus, label: 'Create Paper', color: 'bg-blue-500' },
    { icon: Share, label: 'Share Papers', color: 'bg-green-500' },
    { icon: Download, label: 'Export', color: 'bg-purple-500' },
    { icon: Eye, label: 'Preview', color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your papers today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            color={stat.color}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Papers</h2>
          <div className="space-y-4">
            {recentPapers.map((paper) => (
              <div key={paper.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <h3 className="font-medium text-gray-800">{paper.title}</h3>
                  <p className="text-sm text-gray-600">{paper.date}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  paper.status === 'Published' ? 'bg-green-100 text-green-800' :
                  paper.status === 'Draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {paper.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all hover:shadow-md"
              >
                <div className={`p-3 rounded-xl ${action.color} mb-2`}>
                  <action.icon className="text-white" size={20} />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;