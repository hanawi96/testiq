import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface ResultTabsProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  tabs: Tab[];
}

const ResultTabs: React.FC<ResultTabsProps> = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
      <div className="flex space-x-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{tab.icon}</span>
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ResultTabs; 