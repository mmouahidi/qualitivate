/**
 * Property Grid Component
 * 
 * Right-side panel for editing all properties of a selected question.
 * Supports different property types: text, number, boolean, select, array, expression.
 */

import React, { useState } from 'react';
import type { SurveyElement, ExtendedQuestionType, Validator } from '../../../types';

interface PropertyDefinition {
  name: string;
  displayName: string;
  type: 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'array' | 'expression' | 'choices' | 'validators';
  category: string;
  description?: string;
  options?: string[];
  dependsOn?: { property: string; value: any };
  placeholder?: string;
}

// Property definitions for each question type
const COMMON_PROPERTIES: PropertyDefinition[] = [
  { name: 'name', displayName: 'Name', type: 'text', category: 'General', description: 'Unique identifier' },
  { name: 'title', displayName: 'Title', type: 'text', category: 'General', description: 'Question text' },
  { name: 'description', displayName: 'Description', type: 'textarea', category: 'General' },
  { name: 'isRequired', displayName: 'Required', type: 'boolean', category: 'General' },
  { name: 'visible', displayName: 'Visible', type: 'boolean', category: 'General' },
  { name: 'readOnly', displayName: 'Read Only', type: 'boolean', category: 'General' },
  { name: 'visibleIf', displayName: 'Visible If', type: 'expression', category: 'Logic' },
  { name: 'enableIf', displayName: 'Enable If', type: 'expression', category: 'Logic' },
  { name: 'requiredIf', displayName: 'Required If', type: 'expression', category: 'Logic' },
];

const TYPE_SPECIFIC_PROPERTIES: Record<string, PropertyDefinition[]> = {
  text_short: [
    { name: 'inputType', displayName: 'Input Type', type: 'select', category: 'Input', options: ['text', 'email', 'tel', 'url', 'number', 'password', 'date', 'datetime-local', 'time'] },
    { name: 'placeholder', displayName: 'Placeholder', type: 'text', category: 'Input' },
    { name: 'maxLength', displayName: 'Max Length', type: 'number', category: 'Validation' },
  ],
  text_long: [
    { name: 'rows', displayName: 'Rows', type: 'number', category: 'Input' },
    { name: 'placeholder', displayName: 'Placeholder', type: 'text', category: 'Input' },
    { name: 'maxLength', displayName: 'Max Length', type: 'number', category: 'Validation' },
    { name: 'autoGrow', displayName: 'Auto Grow', type: 'boolean', category: 'Input' },
  ],
  comment: [
    { name: 'rows', displayName: 'Rows', type: 'number', category: 'Input' },
    { name: 'placeholder', displayName: 'Placeholder', type: 'text', category: 'Input' },
    { name: 'maxLength', displayName: 'Max Length', type: 'number', category: 'Validation' },
  ],
  multiple_choice: [
    { name: 'choices', displayName: 'Choices', type: 'choices', category: 'Choices' },
    { name: 'choicesOrder', displayName: 'Choices Order', type: 'select', category: 'Choices', options: ['none', 'asc', 'desc', 'random'] },
    { name: 'colCount', displayName: 'Column Count', type: 'number', category: 'Layout' },
    { name: 'hasOther', displayName: 'Has Other', type: 'boolean', category: 'Choices' },
    { name: 'otherText', displayName: 'Other Text', type: 'text', category: 'Choices', dependsOn: { property: 'hasOther', value: true } },
  ],
  checkbox: [
    { name: 'choices', displayName: 'Choices', type: 'choices', category: 'Choices' },
    { name: 'choicesOrder', displayName: 'Choices Order', type: 'select', category: 'Choices', options: ['none', 'asc', 'desc', 'random'] },
    { name: 'colCount', displayName: 'Column Count', type: 'number', category: 'Layout' },
    { name: 'hasSelectAll', displayName: 'Has Select All', type: 'boolean', category: 'Choices' },
    { name: 'selectAllText', displayName: 'Select All Text', type: 'text', category: 'Choices', dependsOn: { property: 'hasSelectAll', value: true } },
    { name: 'hasNone', displayName: 'Has None', type: 'boolean', category: 'Choices' },
    { name: 'noneText', displayName: 'None Text', type: 'text', category: 'Choices', dependsOn: { property: 'hasNone', value: true } },
    { name: 'hasOther', displayName: 'Has Other', type: 'boolean', category: 'Choices' },
  ],
  dropdown: [
    { name: 'choices', displayName: 'Choices', type: 'choices', category: 'Choices' },
    { name: 'choicesOrder', displayName: 'Choices Order', type: 'select', category: 'Choices', options: ['none', 'asc', 'desc', 'random'] },
    { name: 'placeholder', displayName: 'Placeholder', type: 'text', category: 'Input' },
    { name: 'hasOther', displayName: 'Has Other', type: 'boolean', category: 'Choices' },
  ],
  boolean: [
    { name: 'labelTrue', displayName: 'True Label', type: 'text', category: 'Options' },
    { name: 'labelFalse', displayName: 'False Label', type: 'text', category: 'Options' },
    { name: 'valueTrue', displayName: 'True Value', type: 'text', category: 'Options' },
    { name: 'valueFalse', displayName: 'False Value', type: 'text', category: 'Options' },
  ],
  rating_scale: [
    { name: 'rateMin', displayName: 'Min Rating', type: 'number', category: 'Rating' },
    { name: 'rateMax', displayName: 'Max Rating', type: 'number', category: 'Rating' },
    { name: 'rateType', displayName: 'Display Type', type: 'select', category: 'Rating', options: ['labels', 'stars', 'smileys'] },
    { name: 'minRateDescription', displayName: 'Min Description', type: 'text', category: 'Rating' },
    { name: 'maxRateDescription', displayName: 'Max Description', type: 'text', category: 'Rating' },
  ],
  nps: [
    { name: 'npsMin', displayName: 'Min Score', type: 'number', category: 'NPS' },
    { name: 'npsMax', displayName: 'Max Score', type: 'number', category: 'NPS' },
  ],
  ranking: [
    { name: 'choices', displayName: 'Items to Rank', type: 'choices', category: 'Ranking' },
    { name: 'selectToRankEnabled', displayName: 'Select to Rank', type: 'boolean', category: 'Ranking' },
  ],
  matrix: [
    { name: 'rows', displayName: 'Rows', type: 'array', category: 'Matrix' },
    { name: 'columns', displayName: 'Columns', type: 'array', category: 'Matrix' },
    { name: 'isAllRowRequired', displayName: 'All Rows Required', type: 'boolean', category: 'Matrix' },
  ],
  image_picker: [
    { name: 'choices', displayName: 'Images', type: 'choices', category: 'Images' },
    { name: 'multiSelect', displayName: 'Multi Select', type: 'boolean', category: 'Images' },
    { name: 'showLabel', displayName: 'Show Labels', type: 'boolean', category: 'Images' },
    { name: 'imageFit', displayName: 'Image Fit', type: 'select', category: 'Images', options: ['contain', 'cover', 'fill', 'none'] },
  ],
  file_upload: [
    { name: 'allowMultiple', displayName: 'Allow Multiple', type: 'boolean', category: 'Upload' },
    { name: 'acceptedTypes', displayName: 'Accepted Types', type: 'text', category: 'Upload', placeholder: 'e.g., image/*,.pdf' },
    { name: 'maxSize', displayName: 'Max Size (bytes)', type: 'number', category: 'Upload' },
    { name: 'allowImagesPreview', displayName: 'Preview Images', type: 'boolean', category: 'Upload' },
  ],
  signature_pad: [
    { name: 'signatureWidth', displayName: 'Width', type: 'number', category: 'Signature' },
    { name: 'signatureHeight', displayName: 'Height', type: 'number', category: 'Signature' },
    { name: 'penColor', displayName: 'Pen Color', type: 'text', category: 'Signature', placeholder: '#000000' },
    { name: 'backgroundColor', displayName: 'Background Color', type: 'text', category: 'Signature', placeholder: '#ffffff' },
  ],
  html: [
    { name: 'html', displayName: 'HTML Content', type: 'textarea', category: 'Content' },
  ],
  expression: [
    { name: 'expression', displayName: 'Expression', type: 'expression', category: 'Expression' },
    { name: 'displayStyle', displayName: 'Display Style', type: 'select', category: 'Expression', options: ['none', 'decimal', 'currency', 'percent'] },
    { name: 'currency', displayName: 'Currency', type: 'text', category: 'Expression', dependsOn: { property: 'displayStyle', value: 'currency' } },
  ],
};

interface PropertyGridProps {
  element: SurveyElement | null;
  onUpdate: (updates: Partial<SurveyElement>) => void;
  className?: string;
}

const PropertyGrid: React.FC<PropertyGridProps> = ({
  element,
  onUpdate,
  className = '',
}) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['General', 'Choices', 'Input', 'Rating', 'NPS']);
  
  if (!element) {
    return (
      <div className={`w-80 bg-white border-l border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <p>Select a question to edit its properties</p>
        </div>
      </div>
    );
  }

  const properties = [
    ...COMMON_PROPERTIES,
    ...(TYPE_SPECIFIC_PROPERTIES[element.type] || []),
  ];

  // Group properties by category
  const categories = properties.reduce((acc, prop) => {
    if (!acc[prop.category]) acc[prop.category] = [];
    acc[prop.category].push(prop);
    return acc;
  }, {} as Record<string, PropertyDefinition[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handlePropertyChange = (name: string, value: any) => {
    onUpdate({ [name]: value } as Partial<SurveyElement>);
  };

  const shouldShowProperty = (prop: PropertyDefinition): boolean => {
    if (!prop.dependsOn) return true;
    const depValue = (element as any)[prop.dependsOn.property];
    return depValue === prop.dependsOn.value;
  };

  const renderPropertyInput = (prop: PropertyDefinition) => {
    const value = (element as any)[prop.name];

    switch (prop.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handlePropertyChange(prop.name, e.target.value)}
            placeholder={prop.placeholder}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handlePropertyChange(prop.name, e.target.value)}
            placeholder={prop.placeholder}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => handlePropertyChange(prop.name, e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        );

      case 'boolean':
        return (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handlePropertyChange(prop.name, e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              {value ? 'Yes' : 'No'}
            </span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handlePropertyChange(prop.name, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select...</option>
            {prop.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'expression':
        return (
          <div className="space-y-1">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handlePropertyChange(prop.name, e.target.value)}
              placeholder="{questionName} = 'value'"
              className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-400">
              Use {'{'}questionName{'}'} to reference values
            </p>
          </div>
        );

      case 'choices':
        return <ChoicesEditor value={value || []} onChange={(v) => handlePropertyChange(prop.name, v)} />;

      case 'array':
        return <ArrayEditor value={value || []} onChange={(v) => handlePropertyChange(prop.name, v)} />;

      default:
        return null;
    }
  };

  return (
    <div className={`w-80 bg-white border-l border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Properties</h3>
        <p className="text-sm text-gray-500 mt-1">
          {element.type.replace(/_/g, ' ')}
        </p>
      </div>

      {/* Properties */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(categories).map(([category, props]) => (
          <div key={category} className="border-b border-gray-100">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
            >
              <span className="font-medium text-gray-700">{category}</span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expandedCategories.includes(category) ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedCategories.includes(category) && (
              <div className="px-4 pb-4 space-y-4">
                {props.filter(shouldShowProperty).map(prop => (
                  <div key={prop.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {prop.displayName}
                      {prop.description && (
                        <span className="ml-1 text-gray-400" title={prop.description}>ℹ️</span>
                      )}
                    </label>
                    {renderPropertyInput(prop)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Validators Section */}
        <div className="border-b border-gray-100">
          <button
            onClick={() => toggleCategory('Validators')}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50"
          >
            <span className="font-medium text-gray-700">Validators</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                expandedCategories.includes('Validators') ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedCategories.includes('Validators') && (
            <div className="px-4 pb-4">
              <ValidatorsEditor
                validators={element.validators || []}
                onChange={(validators) => handlePropertyChange('validators', validators)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Choices Editor Component
const ChoicesEditor: React.FC<{
  value: (string | { value: string; text?: string })[];
  onChange: (value: any[]) => void;
}> = ({ value, onChange }) => {
  const [newChoice, setNewChoice] = useState('');

  const addChoice = () => {
    if (newChoice.trim()) {
      onChange([...value, newChoice.trim()]);
      setNewChoice('');
    }
  };

  const removeChoice = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateChoice = (index: number, newValue: string) => {
    const updated = [...value];
    updated[index] = newValue;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {value.map((choice, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={typeof choice === 'string' ? choice : choice.value}
            onChange={(e) => updateChoice(index, e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={() => removeChoice(index)}
            className="text-red-500 hover:text-red-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newChoice}
          onChange={(e) => setNewChoice(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addChoice()}
          placeholder="Add choice..."
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={addChoice}
          className="text-primary-600 hover:text-primary-800"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Array Editor Component (for matrix rows/columns)
const ArrayEditor: React.FC<{
  value: string[];
  onChange: (value: string[]) => void;
}> = ({ value, onChange }) => {
  const [newItem, setNewItem] = useState('');

  const addItem = () => {
    if (newItem.trim()) {
      onChange([...value, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, newValue: string) => {
    const updated = [...value];
    updated[index] = newValue;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            type="text"
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={() => removeItem(index)}
            className="text-red-500 hover:text-red-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add item..."
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={addItem}
          className="text-primary-600 hover:text-primary-800"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Validators Editor Component
const ValidatorsEditor: React.FC<{
  validators: Validator[];
  onChange: (validators: Validator[]) => void;
}> = ({ validators, onChange }) => {
  const addValidator = (type: Validator['type']) => {
    onChange([...validators, { type }]);
  };

  const removeValidator = (index: number) => {
    onChange(validators.filter((_, i) => i !== index));
  };

  const updateValidator = (index: number, updates: Partial<Validator>) => {
    const updated = [...validators];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {validators.map((validator, index) => (
        <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 capitalize">
              {validator.type.replace(/_/g, ' ')}
            </span>
            <button
              onClick={() => removeValidator(index)}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Validator-specific fields */}
          {validator.type === 'numeric' && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={validator.minValue ?? ''}
                onChange={(e) => updateValidator(index, { minValue: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Min"
                className="px-2 py-1 text-sm border rounded"
              />
              <input
                type="number"
                value={validator.maxValue ?? ''}
                onChange={(e) => updateValidator(index, { maxValue: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Max"
                className="px-2 py-1 text-sm border rounded"
              />
            </div>
          )}

          {validator.type === 'text' && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={validator.minLength ?? ''}
                onChange={(e) => updateValidator(index, { minLength: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Min Length"
                className="px-2 py-1 text-sm border rounded"
              />
              <input
                type="number"
                value={validator.maxLength ?? ''}
                onChange={(e) => updateValidator(index, { maxLength: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Max Length"
                className="px-2 py-1 text-sm border rounded"
              />
            </div>
          )}

          {validator.type === 'regex' && (
            <input
              type="text"
              value={validator.regex ?? ''}
              onChange={(e) => updateValidator(index, { regex: e.target.value })}
              placeholder="Regex pattern"
              className="w-full px-2 py-1 text-sm border rounded font-mono"
            />
          )}

          {validator.type === 'expression' && (
            <input
              type="text"
              value={validator.expression ?? ''}
              onChange={(e) => updateValidator(index, { expression: e.target.value })}
              placeholder="Expression"
              className="w-full px-2 py-1 text-sm border rounded font-mono"
            />
          )}

          {/* Error message */}
          <input
            type="text"
            value={validator.text ?? ''}
            onChange={(e) => updateValidator(index, { text: e.target.value })}
            placeholder="Error message"
            className="w-full px-2 py-1 text-sm border rounded"
          />
        </div>
      ))}

      {/* Add validator dropdown */}
      <select
        onChange={(e) => {
          if (e.target.value) {
            addValidator(e.target.value as Validator['type']);
            e.target.value = '';
          }
        }}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        defaultValue=""
      >
        <option value="">+ Add Validator</option>
        <option value="required">Required</option>
        <option value="email">Email</option>
        <option value="numeric">Numeric</option>
        <option value="text">Text Length</option>
        <option value="regex">Regex</option>
        <option value="expression">Expression</option>
        <option value="answercount">Answer Count</option>
      </select>
    </div>
  );
};

export default PropertyGrid;
