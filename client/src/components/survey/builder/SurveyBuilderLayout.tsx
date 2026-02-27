/**
 * Survey Builder Layout Component
 * 
 * Main layout wrapper for the survey builder featuring:
 * - Top tabs: Designer, Preview, Logic, JSON Editor
 * - Left sidebar: Enhanced toolbox with question types
 * - Center: Canvas/content area
 * - Right sidebar: Configuration panel for selected question
 */

import React, { useState, ReactNode } from 'react';
import BuilderTabs, { BuilderTabId } from './BuilderTabs';
import EnhancedToolbox from './EnhancedToolbox';
import ConfigurationPanel from './ConfigurationPanel';
import JsonEditorView from './JsonEditorView';
import type { ExtendedQuestionType } from '../../../types';

interface SurveyBuilderLayoutProps {
  // Survey data
  survey: any;
  
  // Selected question
  selectedQuestion: any | null;
  
  // Handlers
  onAddQuestion: (type: ExtendedQuestionType, defaultOptions?: Record<string, any>) => void;
  onUpdateQuestion: (updates: Record<string, any>) => void;
  onUpdateSurvey: (updates: any) => void;
  
  // Content for each tab
  designerContent: ReactNode;
  previewContent: ReactNode;
  logicContent: ReactNode;
  
  // Header actions
  headerActions?: ReactNode;
  
  className?: string;
}

const SurveyBuilderLayout: React.FC<SurveyBuilderLayoutProps> = ({
  survey,
  selectedQuestion,
  onAddQuestion,
  onUpdateQuestion,
  onUpdateSurvey,
  designerContent,
  previewContent,
  logicContent,
  headerActions,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<BuilderTabId>('designer');
  const [toolboxCollapsed, setToolboxCollapsed] = useState(false);
  const [configCollapsed, setConfigCollapsed] = useState(false);

  // Handle JSON editor updates
  const handleJsonUpdate = (updatedSurvey: any) => {
    onUpdateSurvey(updatedSurvey);
  };

  // Render the active tab content
  const renderContent = () => {
    switch (activeTab) {
      case 'designer':
        return (
          <div className="flex-1 flex">
            {/* Toolbox - Left Sidebar */}
            <EnhancedToolbox
              onSelect={onAddQuestion}
              collapsed={toolboxCollapsed}
              onToggleCollapse={() => setToolboxCollapsed(!toolboxCollapsed)}
              className="flex-shrink-0 h-full"
            />

            {/* Designer Canvas */}
            <div className="flex-1 overflow-auto bg-background">
              {designerContent}
            </div>

            {/* Configuration Panel - Right Sidebar */}
            <ConfigurationPanel
              question={selectedQuestion}
              onUpdate={onUpdateQuestion}
              collapsed={configCollapsed}
              onToggleCollapse={() => setConfigCollapsed(!configCollapsed)}
              className="flex-shrink-0 h-full"
            />
          </div>
        );

      case 'preview':
        return (
          <div className="flex-1 overflow-auto bg-background p-6">
            <div className="max-w-3xl mx-auto">
              {previewContent}
            </div>
          </div>
        );

      case 'logic':
        return (
          <div className="flex-1 overflow-auto bg-background p-6">
            {logicContent}
          </div>
        );

      case 'json':
        return (
          <JsonEditorView
            survey={survey}
            onUpdate={handleJsonUpdate}
            className="flex-1"
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col h-screen bg-background ${className}`}>
      {/* Header */}
      <header className="flex-shrink-0 bg-surface border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Tabs */}
          <BuilderTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Undo/Redo buttons */}
            <button
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
              title="Undo"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 7v6h6" />
                <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
              </svg>
            </button>
            <button
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
              title="Redo"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 7v6h-6" />
                <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
              </svg>
            </button>

            <div className="w-px h-6 bg-border mx-2" />

            {/* Settings button */}
            <button
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
              title="Survey Settings"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
              </svg>
            </button>

            {headerActions}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default SurveyBuilderLayout;
