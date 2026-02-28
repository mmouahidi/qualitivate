/**
 * Enhanced Toolbox Component
 * 
 * Left sidebar with searchable list of question types following SurveyJS patterns.
 * Supports both click-to-add and drag-and-drop functionality.
 */

import React, { useState, useMemo } from 'react';
import type { ExtendedQuestionType } from '../../../types';

export interface ToolboxItem {
  type: ExtendedQuestionType;
  title: string;
  icon: React.ReactNode;
  category: 'input' | 'choice' | 'rating' | 'matrix' | 'media' | 'layout';
  defaultOptions?: Record<string, any>;
}

interface EnhancedToolboxProps {
  onSelect: (type: ExtendedQuestionType, defaultOptions?: Record<string, any>) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

// SVG Icons for question types
const Icons = {
  RadioGroup: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  ),
  Rating: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  ),
  Slider: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  ),
  Checkbox: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  Dropdown: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M8 12h8M12 9l3 3-3 3" />
    </svg>
  ),
  MultiSelect: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  ),
  YesNo: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="8" height="12" rx="4" />
      <circle cx="6" cy="12" r="2" fill="currentColor" />
      <rect x="14" y="6" width="8" height="12" rx="4" />
      <circle cx="18" cy="12" r="2" />
    </svg>
  ),
  FileUpload: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  ),
  ImagePicker: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  Ranking: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="18" r="1" fill="currentColor" />
    </svg>
  ),
  TextShort: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="6" x2="12" y2="6" />
    </svg>
  ),
  TextLong: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="14" y2="18" />
    </svg>
  ),
  MultipleTextboxes: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="5" rx="1" />
      <rect x="3" y="11" width="18" height="5" rx="1" />
    </svg>
  ),
  Panel: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
    </svg>
  ),
  DynamicPanel: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <rect x="7" y="7" width="14" height="14" rx="2" />
    </svg>
  ),
  MatrixSingle: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  MatrixMulti: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <path d="M13 13l2 2 3-3" />
    </svg>
  ),
  MatrixDynamic: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <line x1="3" y1="9" x2="17" y2="9" />
      <line x1="9" y1="3" x2="9" y2="17" />
      <circle cx="19" cy="19" r="3" />
      <path d="M19 17v4M17 19h4" />
    </svg>
  ),
  Html: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Expression: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <text x="7" y="16" fontSize="10" fill="currentColor" stroke="none">fx</text>
    </svg>
  ),
  TitleSettings: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </svg>
  ),
  Image: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  Signature: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 17c3-2 6 2 9-2s6-6 9-2" />
      <line x1="3" y1="21" x2="21" y2="21" />
    </svg>
  ),
  NPS: () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="8" width="20" height="8" rx="1" />
      <line x1="6" y1="8" x2="6" y2="16" />
      <line x1="10" y1="8" x2="10" y2="16" />
      <line x1="14" y1="8" x2="14" y2="16" />
      <line x1="18" y1="8" x2="18" y2="16" />
    </svg>
  ),
  Search: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
};

// Complete toolbox items configuration
export const TOOLBOX_ITEMS: ToolboxItem[] = [
  // Choice questions
  {
    type: 'multiple_choice',
    title: 'Radio Button Group',
    icon: <Icons.RadioGroup />,
    category: 'choice',
    defaultOptions: { choices: ['Option 1', 'Option 2', 'Option 3'] },
  },
  {
    type: 'rating_scale',
    title: 'Rating Scale',
    icon: <Icons.Rating />,
    category: 'rating',
    defaultOptions: { rateMin: 1, rateMax: 5, rateType: 'stars' },
  },
  {
    type: 'slider',
    title: 'Slider',
    icon: <Icons.Slider />,
    category: 'rating',
    defaultOptions: { min: 0, max: 100, step: 1 },
  },
  {
    type: 'checkbox',
    title: 'Checkboxes',
    icon: <Icons.Checkbox />,
    category: 'choice',
    defaultOptions: { choices: ['Option 1', 'Option 2', 'Option 3'] },
  },
  {
    type: 'dropdown',
    title: 'Dropdown',
    icon: <Icons.Dropdown />,
    category: 'choice',
    defaultOptions: { choices: ['Option 1', 'Option 2', 'Option 3'] },
  },
  {
    type: 'multiselect_dropdown',
    title: 'Multiselect Dropdown',
    icon: <Icons.MultiSelect />,
    category: 'choice',
    defaultOptions: { choices: ['Option 1', 'Option 2', 'Option 3'], multiSelect: true },
  },
  {
    type: 'boolean',
    title: 'Yes/No',
    icon: <Icons.YesNo />,
    category: 'choice',
    defaultOptions: { labelTrue: 'Yes', labelFalse: 'No' },
  },
  {
    type: 'file_upload',
    title: 'File Upload',
    icon: <Icons.FileUpload />,
    category: 'media',
    defaultOptions: { allowMultiple: false, maxSize: 10 * 1024 * 1024 },
  },
  {
    type: 'image_picker',
    title: 'Image Picker',
    icon: <Icons.ImagePicker />,
    category: 'choice',
    defaultOptions: { choices: [], showLabel: true },
  },
  {
    type: 'ranking',
    title: 'Ranking',
    icon: <Icons.Ranking />,
    category: 'choice',
    defaultOptions: { choices: ['Item 1', 'Item 2', 'Item 3'] },
  },
  // Text input
  {
    type: 'text_short',
    title: 'Single Line Input',
    icon: <Icons.TextShort />,
    category: 'input',
    defaultOptions: { inputType: 'text' },
  },
  {
    type: 'text_long',
    title: 'Long Text',
    icon: <Icons.TextLong />,
    category: 'input',
    defaultOptions: { rows: 4 },
  },
  {
    type: 'multiple_textboxes',
    title: 'Multiple Textboxes',
    icon: <Icons.MultipleTextboxes />,
    category: 'input',
    defaultOptions: { items: [{ name: 'item1', title: 'Item 1' }, { name: 'item2', title: 'Item 2' }] },
  },
  // Layout
  {
    type: 'html',
    title: 'Title / Text Block',
    icon: <Icons.TitleSettings />,
    category: 'layout',
    defaultOptions: { html: '<h2>Section Title</h2><p>Describe this section here...</p>' },
  },
  {
    type: 'panel',
    title: 'Panel',
    icon: <Icons.Panel />,
    category: 'layout',
    defaultOptions: { title: 'Panel Title' },
  },
  {
    type: 'panel_dynamic',
    title: 'Dynamic Panel',
    icon: <Icons.DynamicPanel />,
    category: 'layout',
    defaultOptions: { panelCount: 1, minPanelCount: 1, maxPanelCount: 5 },
  },
  // Matrix
  {
    type: 'matrix',
    title: 'Single Select Matrix',
    icon: <Icons.MatrixSingle />,
    category: 'matrix',
    defaultOptions: {
      rows: ['Row 1', 'Row 2', 'Row 3'],
      columns: ['Column 1', 'Column 2', 'Column 3'],
    },
  },
  {
    type: 'matrix_dropdown',
    title: 'Multi Select Matrix',
    icon: <Icons.MatrixMulti />,
    category: 'matrix',
    defaultOptions: {
      rows: ['Row 1', 'Row 2'],
      columns: [{ name: 'col1', title: 'Column 1', cellType: 'dropdown', choices: ['A', 'B', 'C'] }],
    },
  },
  {
    type: 'matrix_dynamic',
    title: 'Dynamic Matrix',
    icon: <Icons.MatrixDynamic />,
    category: 'matrix',
    defaultOptions: {
      columns: [{ name: 'col1', title: 'Column 1' }],
      rowCount: 2,
    },
  },
  // Content/Display
  {
    type: 'html',
    title: 'Custom HTML',
    icon: <Icons.Html />,
    category: 'layout',
    defaultOptions: { html: '<p>Enter your custom HTML content here...</p>' },
  },
  {
    type: 'expression',
    title: 'Expression',
    icon: <Icons.Expression />,
    category: 'layout',
    defaultOptions: { expression: '', displayStyle: 'none' },
  },
  {
    type: 'image',
    title: 'Image',
    icon: <Icons.Image />,
    category: 'media',
    defaultOptions: { imageLink: '', imageHeight: '150px', imageWidth: 'auto' },
  },
  {
    type: 'signature_pad',
    title: 'Signature',
    icon: <Icons.Signature />,
    category: 'media',
    defaultOptions: { signatureWidth: 400, signatureHeight: 200 },
  },
];

const EnhancedToolbox: React.FC<EnhancedToolboxProps> = ({
  onSelect,
  collapsed = false,
  onToggleCollapse,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return TOOLBOX_ITEMS;
    const query = searchQuery.toLowerCase();
    return TOOLBOX_ITEMS.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Collapsed view - just icons
  if (collapsed) {
    return (
      <div className={`w-14 bg-surface border-r border-border flex flex-col ${className}`}>
        <button
          onClick={onToggleCollapse}
          className="p-3 border-b border-border hover:bg-surface-hover flex justify-center"
          title="Expand toolbox"
        >
          <Icons.ChevronRight />
        </button>
        <div className="flex-1 overflow-y-auto py-2">
          {TOOLBOX_ITEMS.slice(0, 12).map((item) => (
            <button
              key={item.type}
              onClick={() => onSelect(item.type, item.defaultOptions)}
              className="w-full p-3 text-text-secondary hover:text-primary-600 hover:bg-surface-hover flex justify-center transition-colors"
              title={item.title}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-64 bg-surface border-r border-border flex flex-col ${className}`}>
      {/* Header with search */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Toolbox</span>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface-hover"
              title="Collapse toolbox"
            >
              <Icons.ChevronLeft />
            </button>
          )}
        </div>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <Icons.Search />
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="p-4 text-center text-text-muted text-sm">
            No matching question types
          </div>
        ) : (
          <div className="py-1">
            {filteredItems.map((item) => (
              <button
                key={item.type}
                onClick={() => onSelect(item.type, item.defaultOptions)}
                className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-surface-hover group transition-colors"
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-text-secondary group-hover:text-primary-600 group-hover:border-primary-300 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors">
                  {item.icon}
                </span>
                <span className="text-sm text-text-primary group-hover:text-primary-700 dark:group-hover:text-primary-400 truncate">
                  {item.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer tip */}
      <div className="p-3 border-t border-border bg-background/50">
        <p className="text-xs text-text-muted">
          💡 Click to add or drag to canvas
        </p>
      </div>
    </div>
  );
};

export default EnhancedToolbox;
