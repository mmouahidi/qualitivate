import React from 'react';
import {
  DropdownRenderer,
  CheckboxRenderer,
  BooleanRenderer,
  RankingRenderer,
  ImagePickerRenderer,
  SignaturePadRenderer,
  FileUploadRenderer,
  HtmlRenderer,
  ExpressionRenderer,
  CommentRenderer,
  MatrixDropdownRenderer,
  type BaseRendererProps,
} from './ExtendedQuestionRenderers';

export interface QuestionRendererProps {
  question: {
    id: string;
    type: string;
    content: string;
    name?: string;
    title?: string;
    options?: string[] | { 
      choices?: string[]; 
      min?: number; 
      max?: number;
      rows?: string[];
      columns?: string[];
    };
    isRequired?: boolean;
    // Extended properties for new question types
    choices?: any[];
    rows?: any[];
    columns?: any[];
    rateMin?: number;
    rateMax?: number;
    rateType?: string;
    minRateDescription?: string;
    maxRateDescription?: string;
    placeholder?: string;
    maxLength?: number;
    inputType?: string;
    hasOther?: boolean;
    hasNone?: boolean;
    hasSelectAll?: boolean;
    otherText?: string;
    noneText?: string;
    selectAllText?: string;
    colCount?: number;
    labelTrue?: string;
    labelFalse?: string;
    valueTrue?: any;
    valueFalse?: any;
    multiSelect?: boolean;
    showLabel?: boolean;
    imageFit?: string;
    signatureWidth?: number;
    signatureHeight?: number;
    penColor?: string;
    backgroundColor?: string;
    allowMultiple?: boolean;
    allowImagesPreview?: boolean;
    acceptedTypes?: string;
    maxSize?: number;
    html?: string;
    expression?: string;
    displayStyle?: string;
    currency?: string;
  };
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  readOnly?: boolean;
  errors?: string[];
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({ 
  question, 
  value, 
  onChange, 
  disabled = false,
  readOnly = false,
  errors = [],
}) => {
  // Convert to extended element format for new renderers
  const element = {
    ...question,
    name: question.name || question.id,
    title: question.title || question.content,
  } as any;

  // Normalize options - handle both array and object formats
  const getChoices = (): string[] => {
    if (Array.isArray(question.options)) {
      return question.options;
    }
    if (question.options && 'choices' in question.options) {
      return question.options.choices || [];
    }
    return [];
  };

  const choices = getChoices();

  switch (question.type) {
    case 'text':
    case 'text_short':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
          disabled={disabled}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoFocus={!disabled}
        />
      );

    case 'textarea':
    case 'text_long':
      return (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
          rows={5}
          disabled={disabled}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoFocus={!disabled}
        />
      );

    case 'single_choice':
      return (
        <div className="space-y-3">
          {choices.map((option, idx) => (
            <button
              key={idx}
              onClick={() => !disabled && onChange(option)}
              disabled={disabled}
              className={`w-full text-left p-4 border-2 rounded-xl transition-all ${
                value === option
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              } ${disabled ? 'cursor-not-allowed opacity-75' : ''}`}
            >
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-4 ${
                  value === option ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                }`}>
                  {value === option && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="text-lg text-gray-800">{option}</span>
              </div>
            </button>
          ))}
        </div>
      );

    case 'multiple_choice':
      return (
        <div className="space-y-3">
          {choices.map((option, idx) => {
            const isSelected = (value || []).includes(option);
            return (
              <button
                key={idx}
                onClick={() => {
                  if (disabled) return;
                  const current = value || [];
                  if (isSelected) {
                    onChange(current.filter((v: string) => v !== option));
                  } else {
                    onChange([...current, option]);
                  }
                }}
                disabled={disabled}
                className={`w-full text-left p-4 border-2 rounded-xl transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                } ${disabled ? 'cursor-not-allowed opacity-75' : ''}`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mr-4 ${
                    isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
                  }`}>
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-lg text-gray-800">{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      );

    case 'rating':
    case 'rating_scale':
      const maxRating = (question.options as any)?.max || 5;
      return (
        <div className="flex justify-center gap-3 py-4">
          {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              onClick={() => !disabled && onChange(star)}
              disabled={disabled}
              className={`p-2 transition-transform hover:scale-125 focus:outline-none ${disabled ? 'cursor-not-allowed' : ''}`}
            >
              <svg
                className={`w-14 h-14 transition-colors ${
                  star <= (value || 0) ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      );

    case 'nps':
      return (
        <div className="space-y-6">
          <div className="flex justify-between text-sm text-gray-500 px-2">
            <span>Not at all likely</span>
            <span>Extremely likely</span>
          </div>
          <div className="grid grid-cols-11 gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => !disabled && onChange(num)}
                disabled={disabled}
                className={`aspect-square rounded-xl font-bold text-lg transition-all ${
                  value === num
                    ? num <= 6
                      ? 'bg-red-500 text-white shadow-lg scale-110'
                      : num <= 8
                        ? 'bg-yellow-500 text-white shadow-lg scale-110'
                        : 'bg-green-500 text-white shadow-lg scale-110'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                } ${disabled ? 'cursor-not-allowed' : ''}`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      );

    case 'matrix':
      const rows = (question.options as any)?.rows || [];
      const columns = (question.options as any)?.columns || [];
      return (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-2"></th>
                {columns.map((col: string, idx: number) => (
                  <th key={idx} className="p-2 text-center text-sm font-medium text-gray-700">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row: string, rowIdx: number) => (
                <tr key={rowIdx} className="border-t">
                  <td className="p-2 text-sm text-gray-700">{row}</td>
                  {columns.map((col: string, colIdx: number) => (
                    <td key={colIdx} className="p-2 text-center">
                      <button
                        onClick={() => {
                          if (disabled) return;
                          const current = value || {};
                          onChange({ ...current, [row]: col });
                        }}
                        disabled={disabled}
                        className={`w-6 h-6 rounded-full border-2 ${
                          (value || {})[row] === col
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300 hover:border-primary-300'
                        } ${disabled ? 'cursor-not-allowed' : ''}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'date':
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter a number..."
          disabled={disabled}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
          autoFocus={!disabled}
        />
      );

    // =========================================================================
    // Extended Question Types (SurveyJS-compatible)
    // =========================================================================

    case 'dropdown':
      return (
        <DropdownRenderer
          element={element}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          errors={errors}
        />
      );

    case 'checkbox':
      return (
        <CheckboxRenderer
          element={element}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          errors={errors}
        />
      );

    case 'boolean':
      return (
        <BooleanRenderer
          element={element}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          errors={errors}
        />
      );

    case 'ranking':
      return (
        <RankingRenderer
          element={element}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          errors={errors}
        />
      );

    case 'image_picker':
      return (
        <ImagePickerRenderer
          element={element}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          errors={errors}
        />
      );

    case 'signature_pad':
      return (
        <SignaturePadRenderer
          element={element}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          errors={errors}
        />
      );

    case 'file_upload':
      return (
        <FileUploadRenderer
          element={element}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          errors={errors}
        />
      );

    case 'html':
      return (
        <HtmlRenderer
          element={element}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          errors={errors}
        />
      );

    case 'expression':
      return (
        <ExpressionRenderer
          element={element}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          errors={errors}
        />
      );

    case 'comment':
      return (
        <CommentRenderer
          element={element}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          errors={errors}
        />
      );

    case 'matrix_dropdown':
      return (
        <MatrixDropdownRenderer
          element={element}
          value={value}
          onChange={onChange}
          disabled={disabled}
          readOnly={readOnly}
          errors={errors}
        />
      );

    default:
      return (
        <div className="text-gray-500 italic p-4 bg-gray-50 rounded-lg">
          Question type "{question.type}" preview not available
        </div>
      );
  }
};

export default QuestionRenderer;
