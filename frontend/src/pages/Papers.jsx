// frontend/src/pages/Papers.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthProvider';
import { FileText, FileCheck, Upload, Search } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/card';
import Button from '../components/ui/Button';

// Import components (we'll create these next)
import PaperUpload from '../components/Papers/PaperUpload';
import MarkingUpload from '../components/Papers/MarkingUpload';
import PapersList from '../components/Papers/PapersList';
import MarkingsList from '../components/Papers/MarkingsList';

const Papers = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(isAdmin ? 'upload-papers' : 'papers');

  // Define tabs based on user role
  const adminTabs = [
    { id: 'upload-papers', label: 'Upload Papers', icon: Upload },
    { id: 'upload-markings', label: 'Upload Markings', icon: Upload },
    { id: 'papers', label: 'Papers', icon: FileText },
    { id: 'markings', label: 'Markings', icon: FileCheck },
  ];

  const teacherTabs = [
    { id: 'papers', label: 'Papers', icon: FileText },
    { id: 'markings', label: 'Markings', icon: FileCheck },
  ];

  const tabs = isAdmin ? adminTabs : teacherTabs;

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload-papers':
        return <PaperUpload />;
      case 'upload-markings':
        return <MarkingUpload />;
      case 'papers':
        return <PapersList />;
      case 'markings':
        return <MarkingsList />;
      default:
        return <PapersList />;
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Papers & Markings"
        subtitle={isAdmin ? "Upload and manage exam papers and marking schemes" : "Browse and download exam papers and marking schemes"}
        actions={
          <div className="flex space-x-2">
            <Button 
              variant="secondary" 
              icon={Search}
              onClick={() => setActiveTab(isAdmin ? 'papers' : 'papers')}
            >
              Browse Papers
            </Button>
          </div>
        }
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

export default Papers;
