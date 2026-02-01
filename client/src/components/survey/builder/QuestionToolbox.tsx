/**
 * Enhanced Question Toolbox
 * 
 * Categorized toolbox with all available question types for the survey builder.
 * Supports drag-and-drop and click-to-add functionality.
 */

import React, { useState } from 'react';
import type { ExtendedQuestionType } from '../../../types';

export interface ToolboxItem {
  type: ExtendedQuestionType;
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultOptions?: any;
}

export interface ToolboxCategory {
  name: string;
  icon: React.ReactNode;
  items: ToolboxItem[];
}

// Icon components
const TextIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const ListIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const SignatureIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const RankIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h12M4 18h8" />
  </svg>
);

const ToggleIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PanelIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const CalculatorIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const NPSIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="2" y="8" width="20" height="8" rx="1" strokeWidth="2"/>
    <path d="M6 12h1M11 12h2M17 12h1" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Toolbox configuration
export const TOOLBOX_CATEGORIES: ToolboxCategory[] = [
  {
    name: 'Text Input',
    icon: <TextIcon />,
    items: [
      {
        type: 'text_short',
        title: 'Short Text',
        description: 'Single line text input',
        icon: <TextIcon />,
        defaultOptions: { inputType: 'text' },
      },
      {
        type: 'text_long',
        title: 'Long Text',
        description: 'Multi-line text area',
        icon: <TextIcon />,
        defaultOptions: { rows: 4 },
      },
      {
        type: 'comment',
        title: 'Comment',
        description: 'Extended text with character count',
        icon: <TextIcon />,
        defaultOptions: { rows: 5, maxLength: 1000 },
      },
    ],
  },
  {
    name: 'Choice',
    icon: <ListIcon />,
    items: [
      {
        type: 'multiple_choice',
        title: 'Radio Group',
        description: 'Single selection from options',
        icon: <CheckIcon />,
        defaultOptions: { choices: ['Option 1', 'Option 2', 'Option 3'] },
      },
      {
        type: 'checkbox',
        title: 'Checkboxes',
        description: 'Multiple selection from options',
        icon: <CheckIcon />,
        defaultOptions: { choices: ['Option 1', 'Option 2', 'Option 3'] },
      },
      {
        type: 'dropdown',
        title: 'Dropdown',
        description: 'Single selection dropdown',
        icon: <ListIcon />,
        defaultOptions: { choices: ['Option 1', 'Option 2', 'Option 3'] },
      },
      {
        type: 'boolean',
        title: 'Yes/No',
        description: 'Simple boolean toggle',
        icon: <ToggleIcon />,
        defaultOptions: { labelTrue: 'Yes', labelFalse: 'No' },
      },
      {
        type: 'image_picker',
        title: 'Image Picker',
        description: 'Select from images',
        icon: <ImageIcon />,
        defaultOptions: { choices: [], showLabel: true },
      },
    ],
  },
  {
    name: 'Rating',
    icon: <StarIcon />,
    items: [
      {
        type: 'rating_scale',
        title: 'Star Rating',
        description: 'Rate with stars',
        icon: <StarIcon />,
        defaultOptions: { rateMin: 1, rateMax: 5, rateType: 'stars' },
      },
      {
        type: 'nps',
        title: 'NPS',
        description: 'Net Promoter Score (0-10)',
        icon: <NPSIcon />,
        defaultOptions: { npsMin: 0, npsMax: 10 },
      },
      {
        type: 'ranking',
        title: 'Ranking',
        description: 'Order items by preference',
        icon: <RankIcon />,
        defaultOptions: { choices: ['Item 1', 'Item 2', 'Item 3'] },
      },
    ],
  },
  {
    name: 'Matrix',
    icon: <GridIcon />,
    items: [
      {
        type: 'matrix',
        title: 'Matrix (Single)',
        description: 'Grid with single selection per row',
        icon: <GridIcon />,
        defaultOptions: {
          rows: ['Row 1', 'Row 2', 'Row 3'],
          columns: ['Column 1', 'Column 2', 'Column 3'],
        },
      },
      {
        type: 'matrix_dropdown',
        title: 'Matrix (Dropdown)',
        description: 'Grid with dropdowns per cell',
        icon: <GridIcon />,
        defaultOptions: {
          rows: ['Row 1', 'Row 2'],
          columns: [
            { name: 'col1', title: 'Column 1', cellType: 'dropdown', choices: ['A', 'B', 'C'] },
          ],
        },
      },
    ],
  },
  {
    name: 'Media',
    icon: <UploadIcon />,
    items: [
      {
        type: 'file_upload',
        title: 'File Upload',
        description: 'Upload files',
        icon: <UploadIcon />,
        defaultOptions: { allowMultiple: false, maxSize: 10 * 1024 * 1024 },
      },
      {
        type: 'signature_pad',
        title: 'Signature',
        description: 'Draw signature',
        icon: <SignatureIcon />,
        defaultOptions: { signatureWidth: 400, signatureHeight: 200 },
      },
    ],
  },
  {
    name: 'Layout',
    icon: <PanelIcon />,
    items: [
      {
        type: 'html',
        title: 'HTML Content',
        description: 'Display formatted text',
        icon: <CodeIcon />,
        defaultOptions: { html: '<p>Enter your content here...</p>' },
      },
      {
        type: 'expression',
        title: 'Calculated Field',
        description: 'Display calculated value',
        icon: <CalculatorIcon />,
        defaultOptions: { expression: '', displayStyle: 'none' },
      },
      {
        type: 'panel_dynamic' as ExtendedQuestionType,
        title: 'Dynamic Panel',
        description: 'Repeatable panel group',
        icon: <PanelIcon />,
        defaultOptions: { panelCount: 1, minPanelCount: 1, maxPanelCount: 5 },
      },
    ],
  },
];

interface QuestionToolboxProps {
  onSelect: (type: ExtendedQuestionType, defaultOptions?: any) => void;
  collapsed?: boolean;
  className?: string;
}

const QuestionToolbox: React.FC<QuestionToolboxProps> = ({
  onSelect,
  collapsed = false,
  className = '',
}) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(
    TOOLBOX_CATEGORIES[0]?.name || null
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Filter items by search
  const filteredCategories = searchQuery
    ? TOOLBOX_CATEGORIES.map(cat => ({
        ...cat,
        items: cat.items.filter(
          item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(cat => cat.items.length > 0)
    : TOOLBOX_CATEGORIES;

  if (collapsed) {
    return (
      <div className={`w-16 bg-white border-r border-gray-200 ${className}`}>
        <div className="py-4 space-y-2">
          {TOOLBOX_CATEGORIES.map(category => (
            <button
              key={category.name}
              onClick={() => setExpandedCategory(category.name)}
              className="w-full p-3 text-gray-600 hover:bg-gray-100 hover:text-primary-600 flex justify-center"
              title={category.name}
            >
              {category.icon}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-72 bg-white border-r border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Question Types</h3>
        <input
          type="text"
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto">
        {filteredCategories.map(category => (
          <div key={category.name} className="border-b border-gray-100">
            <button
              onClick={() => setExpandedCategory(
                expandedCategory === category.name ? null : category.name
              )}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-500">{category.icon}</span>
                <span className="font-medium text-gray-700">{category.name}</span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedCategory === category.name ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedCategory === category.name && (
              <div className="pb-2">
                {category.items.map(item => (
                  <button
                    key={item.type}
                    onClick={() => onSelect(item.type, item.defaultOptions)}
                    className="w-full px-4 py-2 flex items-start gap-3 hover:bg-gray-50 text-left group"
                  >
                    <span className="mt-0.5 text-gray-400 group-hover:text-primary-500">
                      {item.icon}
                    </span>
                    <div>
                      <div className="text-sm font-medium text-gray-700 group-hover:text-primary-600">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tip */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          💡 Tip: Drag questions or click to add them to your survey
        </p>
      </div>
    </div>
  );
};

export default QuestionToolbox;
