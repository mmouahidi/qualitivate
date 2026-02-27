/**
 * Builder Tabs Component
 * 
 * Top navigation tabs for switching between Designer, Preview, Logic, and JSON Editor views.
 */

import React from 'react';

export type BuilderTabId = 'designer' | 'preview' | 'logic' | 'json';

interface Tab {
  id: BuilderTabId;
  label: string;
  icon: React.ReactNode;
}

interface BuilderTabsProps {
  activeTab: BuilderTabId;
  onTabChange: (tab: BuilderTabId) => void;
  className?: string;
}

const Icons = {
  Designer: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  Preview: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Logic: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M6 21V9a9 9 0 0 0 9 9" />
    </svg>
  ),
  Json: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
};

const TABS: Tab[] = [
  { id: 'designer', label: 'Designer', icon: <Icons.Designer /> },
  { id: 'preview', label: 'Preview', icon: <Icons.Preview /> },
  { id: 'logic', label: 'Logic', icon: <Icons.Logic /> },
  { id: 'json', label: 'JSON Editor', icon: <Icons.Json /> },
];

const BuilderTabs: React.FC<BuilderTabsProps> = ({
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors
              ${isActive
                ? 'bg-surface text-primary-600 border-b-2 border-primary-600'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }
            `}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BuilderTabs;
