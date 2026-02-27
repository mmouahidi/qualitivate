/**
 * Configuration Panel Component
 * 
 * Right sidebar for editing properties of the selected question.
 * Features collapsible sections: General, Settings, Conditions, Validation.
 */

import React, { useState, useEffect } from 'react';
import type { ExtendedQuestionType, Validator, ValidatorType } from '../../../types';

interface ConfigurationPanelProps {
  question: any | null;
  onUpdate: (updates: Record<string, any>) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

// Section collapse state
type SectionName = 'general' | 'settings' | 'conditions' | 'validation';

// Icons
const Icons = {
  ChevronDown: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  ChevronRight: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  PanelRight: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  ),
};

// Type-specific settings configurations
const TYPE_SETTINGS: Record<string, { label: string; type: 'text' | 'number' | 'boolean' | 'select' | 'choices'; options?: string[]; placeholder?: string }[]> = {
  text_short: [
    { label: 'Input Type', type: 'select', options: ['text', 'email', 'tel', 'url', 'number', 'password'] },
    { label: 'Placeholder', type: 'text', placeholder: 'Enter placeholder text...' },
    { label: 'Max Length', type: 'number' },
  ],
  text_long: [
    { label: 'Rows', type: 'number' },
    { label: 'Placeholder', type: 'text' },
    { label: 'Max Length', type: 'number' },
    { label: 'Auto Grow', type: 'boolean' },
  ],
  multiple_choice: [
    { label: 'Choices', type: 'choices' },
    { label: 'Columns', type: 'number' },
    { label: 'Has Other', type: 'boolean' },
    { label: 'Other Text', type: 'text' },
  ],
  checkbox: [
    { label: 'Choices', type: 'choices' },
    { label: 'Columns', type: 'number' },
    { label: 'Has Select All', type: 'boolean' },
    { label: 'Has None', type: 'boolean' },
    { label: 'Has Other', type: 'boolean' },
  ],
  dropdown: [
    { label: 'Choices', type: 'choices' },
    { label: 'Placeholder', type: 'text' },
    { label: 'Has Other', type: 'boolean' },
  ],
  multiselect_dropdown: [
    { label: 'Choices', type: 'choices' },
    { label: 'Placeholder', type: 'text' },
    { label: 'Max Selected', type: 'number' },
  ],
  boolean: [
    { label: 'True Label', type: 'text', placeholder: 'Yes' },
    { label: 'False Label', type: 'text', placeholder: 'No' },
  ],
  rating_scale: [
    { label: 'Min Rating', type: 'number' },
    { label: 'Max Rating', type: 'number' },
    { label: 'Display Type', type: 'select', options: ['stars', 'labels', 'smileys'] },
    { label: 'Min Description', type: 'text' },
    { label: 'Max Description', type: 'text' },
  ],
  slider: [
    { label: 'Min Value', type: 'number' },
    { label: 'Max Value', type: 'number' },
    { label: 'Step', type: 'number' },
    { label: 'Show Value', type: 'boolean' },
  ],
  nps: [
    { label: 'Min Score', type: 'number' },
    { label: 'Max Score', type: 'number' },
  ],
  ranking: [
    { label: 'Items to Rank', type: 'choices' },
    { label: 'Select to Rank', type: 'boolean' },
  ],
  matrix: [
    { label: 'Rows', type: 'choices' },
    { label: 'Columns', type: 'choices' },
    { label: 'All Rows Required', type: 'boolean' },
  ],
  file_upload: [
    { label: 'Allow Multiple', type: 'boolean' },
    { label: 'Max Size (MB)', type: 'number' },
    { label: 'Accepted Types', type: 'text', placeholder: 'image/*,.pdf' },
  ],
  image_picker: [
    { label: 'Multi Select', type: 'boolean' },
    { label: 'Show Labels', type: 'boolean' },
    { label: 'Image Fit', type: 'select', options: ['contain', 'cover', 'fill'] },
  ],
  signature_pad: [
    { label: 'Width', type: 'number' },
    { label: 'Height', type: 'number' },
    { label: 'Pen Color', type: 'text', placeholder: '#000000' },
  ],
  html: [
    { label: 'HTML Content', type: 'text' },
  ],
  expression: [
    { label: 'Expression', type: 'text' },
    { label: 'Display Style', type: 'select', options: ['none', 'decimal', 'currency', 'percent'] },
  ],
  image: [
    { label: 'Image URL', type: 'text' },
    { label: 'Image Height', type: 'text', placeholder: '150px' },
    { label: 'Image Width', type: 'text', placeholder: 'auto' },
    { label: 'Alt Text', type: 'text' },
  ],
};

// Map settings labels to property names
const LABEL_TO_PROP: Record<string, string> = {
  'Input Type': 'inputType',
  'Placeholder': 'placeholder',
  'Max Length': 'maxLength',
  'Rows': 'rows',
  'Auto Grow': 'autoGrow',
  'Choices': 'choices',
  'Columns': 'colCount',
  'Has Other': 'hasOther',
  'Other Text': 'otherText',
  'Has Select All': 'hasSelectAll',
  'Has None': 'hasNone',
  'Max Selected': 'maxSelectedChoices',
  'True Label': 'labelTrue',
  'False Label': 'labelFalse',
  'Min Rating': 'rateMin',
  'Max Rating': 'rateMax',
  'Display Type': 'rateType',
  'Min Description': 'minRateDescription',
  'Max Description': 'maxRateDescription',
  'Min Value': 'min',
  'Max Value': 'max',
  'Step': 'step',
  'Show Value': 'showValue',
  'Min Score': 'npsMin',
  'Max Score': 'npsMax',
  'Items to Rank': 'choices',
  'Select to Rank': 'selectToRankEnabled',
  'All Rows Required': 'isAllRowRequired',
  'Allow Multiple': 'allowMultiple',
  'Max Size (MB)': 'maxSize',
  'Accepted Types': 'acceptedTypes',
  'Multi Select': 'multiSelect',
  'Show Labels': 'showLabel',
  'Image Fit': 'imageFit',
  'Width': 'signatureWidth',
  'Height': 'signatureHeight',
  'Pen Color': 'penColor',
  'HTML Content': 'html',
  'Expression': 'expression',
  'Display Style': 'displayStyle',
  'Image URL': 'imageLink',
  'Image Height': 'imageHeight',
  'Image Width': 'imageWidth',
  'Alt Text': 'imageAlt',
};

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  question,
  onUpdate,
  collapsed = false,
  onToggleCollapse,
  className = '',
}) => {
  const [expandedSections, setExpandedSections] = useState<SectionName[]>(['general', 'settings']);
  const [localValues, setLocalValues] = useState<Record<string, any>>({});

  // Sync local values with question prop
  useEffect(() => {
    if (question) {
      setLocalValues({
        title: question.content || question.title || '',
        description: question.description || '',
        name: question.name || `question_${question.id?.slice(0, 8) || 'new'}`,
        isRequired: question.is_required ?? question.isRequired ?? false,
        visible: question.visible ?? true,
        visibleIf: question.visibleIf || '',
        enableIf: question.enableIf || '',
        requiredIf: question.requiredIf || '',
        ...question.options,
      });
    }
  }, [question]);

  const toggleSection = (section: SectionName) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleChange = (key: string, value: any) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
    
    // Map certain keys to the correct update structure
    if (key === 'title') {
      onUpdate({ content: value });
    } else if (key === 'isRequired') {
      onUpdate({ isRequired: value });
    } else if (['visibleIf', 'enableIf', 'requiredIf', 'description', 'name', 'visible'].includes(key)) {
      onUpdate({ [key]: value });
    } else {
      // Update in options
      onUpdate({ options: { ...question?.options, [key]: value } });
    }
  };

  // Collapsed view
  if (collapsed) {
    return (
      <div className={`w-12 bg-surface border-l border-border flex flex-col items-center py-4 ${className}`}>
        <button
          onClick={onToggleCollapse}
          className="p-2 text-text-muted hover:text-text-primary rounded hover:bg-surface-hover"
          title="Expand configuration"
        >
          <Icons.ChevronLeft />
        </button>
        <div className="mt-4">
          <Icons.PanelRight />
        </div>
      </div>
    );
  }

  // Empty state
  if (!question) {
    return (
      <div className={`w-72 bg-surface border-l border-border flex flex-col ${className}`}>
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Configuration</span>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface-hover"
              title="Collapse panel"
            >
              <Icons.ChevronRight />
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center text-text-muted">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <p className="text-sm">Select a question to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }

  const typeSettings = TYPE_SETTINGS[question.type] || [];

  const renderSectionHeader = (section: SectionName, label: string) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-surface-hover border-b border-border"
    >
      <span className="text-sm font-medium text-text-primary">{label}</span>
      {expandedSections.includes(section) ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
    </button>
  );

  const renderField = (
    label: string,
    type: 'text' | 'number' | 'boolean' | 'select' | 'choices' | 'expression',
    key: string,
    options?: { selectOptions?: string[]; placeholder?: string }
  ) => {
    const value = localValues[key];

    return (
      <div className="mb-3">
        <label className="block text-xs font-medium text-text-secondary mb-1.5">{label}</label>
        {type === 'text' && (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={options?.placeholder}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        )}
        {type === 'number' && (
          <input
            type="number"
            value={value ?? ''}
            onChange={(e) => handleChange(key, e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        )}
        {type === 'boolean' && (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleChange(key, e.target.checked)}
              className="w-4 h-4 text-primary-600 border-border rounded focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-text-secondary">{value ? 'Yes' : 'No'}</span>
          </label>
        )}
        {type === 'select' && options?.selectOptions && (
          <select
            value={value || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select...</option>
            {options.selectOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )}
        {type === 'expression' && (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder="{questionName} = 'value'"
            className="w-full px-3 py-2 text-sm font-mono bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        )}
        {type === 'choices' && (
          <ChoicesEditor
            value={value || []}
            onChange={(newChoices) => handleChange(key, newChoices)}
          />
        )}
      </div>
    );
  };

  return (
    <div className={`w-72 bg-surface border-l border-border flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Configuration</span>
          <p className="text-xs text-text-muted mt-0.5 capitalize">{question.type?.replace(/_/g, ' ')}</p>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-surface-hover"
            title="Collapse panel"
          >
            <Icons.ChevronRight />
          </button>
        )}
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* General Section */}
        {renderSectionHeader('general', 'General')}
        {expandedSections.includes('general') && (
          <div className="px-4 py-3 border-b border-border">
            {renderField('Title', 'text', 'title', { placeholder: 'Enter question title...' })}
            {renderField('Description', 'text', 'description', { placeholder: 'Optional description...' })}
            {renderField('Name', 'text', 'name', { placeholder: 'question_name' })}
            {renderField('Required', 'boolean', 'isRequired')}
            {renderField('Visible', 'boolean', 'visible')}
          </div>
        )}

        {/* Settings Section */}
        {typeSettings.length > 0 && (
          <>
            {renderSectionHeader('settings', 'Settings')}
            {expandedSections.includes('settings') && (
              <div className="px-4 py-3 border-b border-border">
                {typeSettings.map((setting) => {
                  const propName = LABEL_TO_PROP[setting.label] || setting.label.toLowerCase().replace(/\s+/g, '_');
                  return (
                    <div key={setting.label}>
                      {renderField(
                        setting.label,
                        setting.type,
                        propName,
                        { selectOptions: setting.options, placeholder: setting.placeholder }
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Conditions Section */}
        {renderSectionHeader('conditions', 'Conditions')}
        {expandedSections.includes('conditions') && (
          <div className="px-4 py-3 border-b border-border">
            {renderField('Visible If', 'expression', 'visibleIf')}
            {renderField('Enable If', 'expression', 'enableIf')}
            {renderField('Required If', 'expression', 'requiredIf')}
            <p className="text-xs text-text-muted mt-2">
              Use expressions like <code className="bg-background px-1 rounded">{'{q1}'} = 'yes'</code>
            </p>
          </div>
        )}

        {/* Validation Section */}
        {renderSectionHeader('validation', 'Validation')}
        {expandedSections.includes('validation') && (
          <div className="px-4 py-3 border-b border-border">
            <ValidatorsEditor
              validators={question.validators || question.options?.validators || []}
              onChange={(validators) => handleChange('validators', validators)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Choices Editor Sub-component
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
            className="flex-1 px-2 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={() => removeChoice(index)}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
          >
            <Icons.Trash />
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
          className="flex-1 px-2 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          onClick={addChoice}
          className="p-1 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded"
        >
          <Icons.Plus />
        </button>
      </div>
    </div>
  );
};

// Validators Editor Sub-component
const ValidatorsEditor: React.FC<{
  validators: Validator[];
  onChange: (validators: Validator[]) => void;
}> = ({ validators, onChange }) => {
  const addValidator = (type: ValidatorType) => {
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
        <div key={index} className="p-3 bg-background rounded-lg border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-primary capitalize">
              {validator.type.replace(/_/g, ' ')}
            </span>
            <button
              onClick={() => removeValidator(index)}
              className="p-1 text-red-500 hover:text-red-700"
            >
              <Icons.Trash />
            </button>
          </div>

          {validator.type === 'numeric' && (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={validator.minValue ?? ''}
                onChange={(e) => updateValidator(index, { minValue: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Min"
                className="px-2 py-1 text-xs border border-border rounded"
              />
              <input
                type="number"
                value={validator.maxValue ?? ''}
                onChange={(e) => updateValidator(index, { maxValue: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Max"
                className="px-2 py-1 text-xs border border-border rounded"
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
                className="px-2 py-1 text-xs border border-border rounded"
              />
              <input
                type="number"
                value={validator.maxLength ?? ''}
                onChange={(e) => updateValidator(index, { maxLength: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Max Length"
                className="px-2 py-1 text-xs border border-border rounded"
              />
            </div>
          )}

          {validator.type === 'regex' && (
            <input
              type="text"
              value={validator.regex ?? ''}
              onChange={(e) => updateValidator(index, { regex: e.target.value })}
              placeholder="Regex pattern"
              className="w-full px-2 py-1 text-xs font-mono border border-border rounded"
            />
          )}

          {validator.type === 'expression' && (
            <input
              type="text"
              value={validator.expression ?? ''}
              onChange={(e) => updateValidator(index, { expression: e.target.value })}
              placeholder="Expression"
              className="w-full px-2 py-1 text-xs font-mono border border-border rounded"
            />
          )}

          <input
            type="text"
            value={validator.text ?? ''}
            onChange={(e) => updateValidator(index, { text: e.target.value })}
            placeholder="Error message"
            className="w-full mt-2 px-2 py-1 text-xs border border-border rounded"
          />
        </div>
      ))}

      <select
        onChange={(e) => {
          if (e.target.value) {
            addValidator(e.target.value as ValidatorType);
            e.target.value = '';
          }
        }}
        className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        defaultValue=""
      >
        <option value="">+ Add Validator</option>
        <option value="required">Required</option>
        <option value="email">Email</option>
        <option value="numeric">Numeric</option>
        <option value="text">Text Length</option>
        <option value="regex">Regex</option>
        <option value="expression">Expression</option>
      </select>
    </div>
  );
};

export default ConfigurationPanel;
