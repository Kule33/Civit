// frontend/src/pages/Uploads.jsx
import React, { useState } from 'react';
import { Upload, Type } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/card';
import Button from '../components/ui/Button';

// Import upload components
import QuestionUpload from '../components/Uploads/QuestionUpload';
import TypesetUpload from '../components/Uploads/TypesetUpload';

const Uploads = () => {
  const [activeTab, setActiveTab] = useState('question-upload');

  // Define tabs - only admins can access uploads
  const tabs = [
    { id: 'question-upload', label: 'Question Upload', icon: Upload },
    { id: 'typeset-upload', label: 'Typeset Upload', icon: Type },
  ];

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'question-upload':
        return <QuestionUpload />;
      case 'typeset-upload':
        return <TypesetUpload />;
      default:
        return <QuestionUpload />;
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Uploads"
        subtitle="Upload questions and typeset documents for the question bank"
      />

      {/* Tabbed Navigation */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </Card>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Uploads;
