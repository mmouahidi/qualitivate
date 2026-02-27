/**
 * JSON Editor View Component
 * 
 * Provides a raw JSON editor for viewing and editing the survey schema.
 * Includes syntax highlighting and validation.
 */

import React, { useState, useEffect, useCallback } from 'react';

interface JsonEditorViewProps {
  survey: any;
  onUpdate: (surveyJson: any) => void;
  className?: string;
}

const JsonEditorView: React.FC<JsonEditorViewProps> = ({
  survey,
  onUpdate,
  className = '',
}) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Convert survey to JSON string on load/change
  useEffect(() => {
    if (survey) {
      try {
        const formatted = JSON.stringify(survey, null, 2);
        setJsonText(formatted);
        setError(null);
        setIsDirty(false);
      } catch (e) {
        setError('Failed to serialize survey');
      }
    }
  }, [survey]);

  // Handle text changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setJsonText(value);
    setIsDirty(true);

    // Validate JSON
    try {
      JSON.parse(value);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // Apply changes
  const handleApply = useCallback(() => {
    if (error) return;

    try {
      const parsed = JSON.parse(jsonText);
      onUpdate(parsed);
      setIsDirty(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [jsonText, error, onUpdate]);

  // Format/prettify JSON
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleApply();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleApply]);

  return (
    <div className={`flex flex-col h-full bg-surface ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">Survey JSON</span>
          {isDirty && (
            <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
              Modified
            </span>
          )}
          {error && (
            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded">
              Invalid JSON
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
            title="Copy to clipboard"
          >
            <svg className="w-4 h-4 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy
          </button>
          <button
            onClick={handleFormat}
            className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
            title="Format JSON"
          >
            <svg className="w-4 h-4 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="21" y1="10" x2="3" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="21" y1="18" x2="3" y2="18" />
            </svg>
            Format
          </button>
          <button
            onClick={handleApply}
            disabled={!!error || !isDirty}
            className={`
              px-3 py-1.5 text-xs font-medium rounded transition-colors
              ${error || !isDirty
                ? 'text-text-muted bg-surface cursor-not-allowed'
                : 'text-white bg-primary-600 hover:bg-primary-700'
              }
            `}
            title="Apply changes (Ctrl+S)"
          >
            <svg className="w-4 h-4 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Apply
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400 font-mono">
            <svg className="w-4 h-4 inline-block mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 relative">
        <textarea
          value={jsonText}
          onChange={handleChange}
          spellCheck={false}
          className={`
            absolute inset-0 w-full h-full p-4 font-mono text-sm
            bg-gray-900 text-gray-100
            border-none resize-none focus:outline-none focus:ring-0
            ${error ? 'text-red-300' : ''}
          `}
          style={{
            tabSize: 2,
            lineHeight: 1.6,
          }}
        />
        {/* Line numbers overlay - simplified version */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gray-800 border-r border-gray-700 pointer-events-none overflow-hidden">
          <div className="p-4 font-mono text-xs text-gray-500 select-none" style={{ lineHeight: 1.6 }}>
            {jsonText.split('\n').map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
        </div>
        <style>{`
          textarea {
            padding-left: 4rem !important;
          }
        `}</style>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-border bg-background flex items-center justify-between text-xs text-text-muted">
        <span>
          {jsonText.split('\n').length} lines • {jsonText.length} characters
        </span>
        <span>
          Press <kbd className="px-1.5 py-0.5 bg-surface border border-border rounded">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 bg-surface border border-border rounded">S</kbd> to apply
        </span>
      </div>
    </div>
  );
};

export default JsonEditorView;
