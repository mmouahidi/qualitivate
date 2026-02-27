/**
 * Extended Question Renderers
 * 
 * Individual renderer components for each question type.
 * Following SurveyJS patterns for extensibility.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { SurveyElement, ChoiceItem, MatrixColumn, MatrixRow } from '../../types';

// ============================================================================
// Shared Types
// ============================================================================

export interface BaseRendererProps {
  element: SurveyElement;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  readOnly?: boolean;
  errors?: string[];
}

// ============================================================================
// Utility Functions
// ============================================================================

function getChoiceText(choice: string | ChoiceItem): string {
  return typeof choice === 'string' ? choice : (choice.text ?? String(choice.value));
}

function getChoiceValue(choice: string | ChoiceItem): string | number {
  return typeof choice === 'string' ? choice : choice.value;
}

// ============================================================================
// Dropdown Renderer
// ============================================================================

export const DropdownRenderer: React.FC<BaseRendererProps> = ({
  element,
  value,
  onChange,
  disabled,
  readOnly,
  errors,
}) => {
  const choices = element.choices || [];
  const hasError = errors && errors.length > 0;

  return (
    <div className="space-y-2">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        disabled={disabled || readOnly}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-lg 
          ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'}
          ${disabled || readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
      >
        <option value="">{element.placeholder || 'Select an option...'}</option>
        {choices.map((choice, idx) => (
          <option key={idx} value={getChoiceValue(choice)}>
            {getChoiceText(choice)}
          </option>
        ))}
        {element.hasOther && (
          <option value="__other__">{element.otherText || 'Other'}</option>
        )}
      </select>
      {value === '__other__' && (
        <input
          type="text"
          placeholder={element.otherPlaceholder || 'Please specify...'}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          onChange={(e) => onChange({ value: '__other__', text: e.target.value })}
        />
      )}
    </div>
  );
};

// ============================================================================
// Checkbox Renderer
// ============================================================================

export const CheckboxRenderer: React.FC<BaseRendererProps> = ({
  element,
  value,
  onChange,
  disabled,
  readOnly,
  errors,
}) => {
  const choices = element.choices || [];
  const selectedValues = Array.isArray(value) ? value : [];
  const hasError = errors && errors.length > 0;
  const colCount = element.colCount || 1;

  const toggleValue = (choiceValue: string | number) => {
    if (disabled || readOnly) return;
    const newValues = selectedValues.includes(choiceValue)
      ? selectedValues.filter((v: any) => v !== choiceValue)
      : [...selectedValues, choiceValue];
    onChange(newValues);
  };

  const handleSelectAll = () => {
    if (disabled || readOnly) return;
    const allValues = choices.map(c => getChoiceValue(c));
    onChange(allValues);
  };

  return (
    <div className="space-y-3">
      {element.hasSelectAll && (
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled || readOnly}
          className="text-sm text-primary-600 hover:text-primary-800 mb-2"
        >
          {element.selectAllText || 'Select All'}
        </button>
      )}
      <div className={`grid gap-3 ${colCount > 1 ? `grid-cols-${colCount}` : ''}`}>
        {choices.map((choice, idx) => {
          const choiceValue = getChoiceValue(choice);
          const isSelected = selectedValues.includes(choiceValue);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => toggleValue(choiceValue)}
              disabled={disabled || readOnly}
              className={`w-full text-left p-4 border-2 rounded-xl transition-all ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : hasError
                    ? 'border-red-300 hover:border-red-400'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              } ${disabled || readOnly ? 'cursor-not-allowed opacity-75' : ''}`}
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
                <span className="text-lg text-gray-800">{getChoiceText(choice)}</span>
              </div>
            </button>
          );
        })}
        {element.hasNone && (
          <button
            type="button"
            onClick={() => onChange([])}
            disabled={disabled || readOnly}
            className={`w-full text-left p-4 border-2 rounded-xl transition-all ${
              selectedValues.length === 0
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center mr-4 ${
                selectedValues.length === 0 ? 'border-primary-500 bg-primary-500' : 'border-gray-300'
              }`}>
                {selectedValues.length === 0 && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-lg text-gray-800">{element.noneText || 'None'}</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Boolean Renderer
// ============================================================================

export const BooleanRenderer: React.FC<BaseRendererProps> = ({
  element,
  value,
  onChange,
  disabled,
  readOnly,
}) => {
  const trueLabel = element.labelTrue || 'Yes';
  const falseLabel = element.labelFalse || 'No';
  const trueValue = element.valueTrue ?? true;
  const falseValue = element.valueFalse ?? false;

  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => !disabled && !readOnly && onChange(trueValue)}
        disabled={disabled || readOnly}
        className={`flex-1 py-4 px-6 rounded-xl font-medium text-lg transition-all ${
          value === trueValue
            ? 'bg-green-500 text-white shadow-lg'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } ${disabled || readOnly ? 'cursor-not-allowed opacity-75' : ''}`}
      >
        {trueLabel}
      </button>
      <button
        type="button"
        onClick={() => !disabled && !readOnly && onChange(falseValue)}
        disabled={disabled || readOnly}
        className={`flex-1 py-4 px-6 rounded-xl font-medium text-lg transition-all ${
          value === falseValue
            ? 'bg-red-500 text-white shadow-lg'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        } ${disabled || readOnly ? 'cursor-not-allowed opacity-75' : ''}`}
      >
        {falseLabel}
      </button>
    </div>
  );
};

// ============================================================================
// Ranking Renderer
// ============================================================================

export const RankingRenderer: React.FC<BaseRendererProps> = ({
  element,
  value,
  onChange,
  disabled,
  readOnly,
}) => {
  const choices = element.choices || [];
  const rankedItems = Array.isArray(value) ? value : [];
  const unrankedItems = choices
    .map(c => getChoiceValue(c))
    .filter(v => !rankedItems.includes(v));

  const moveUp = (index: number) => {
    if (index === 0 || disabled || readOnly) return;
    const newRanked = [...rankedItems];
    [newRanked[index - 1], newRanked[index]] = [newRanked[index], newRanked[index - 1]];
    onChange(newRanked);
  };

  const moveDown = (index: number) => {
    if (index === rankedItems.length - 1 || disabled || readOnly) return;
    const newRanked = [...rankedItems];
    [newRanked[index], newRanked[index + 1]] = [newRanked[index + 1], newRanked[index]];
    onChange(newRanked);
  };

  const addToRanked = (itemValue: string | number) => {
    if (disabled || readOnly) return;
    onChange([...rankedItems, itemValue]);
  };

  const removeFromRanked = (itemValue: string | number) => {
    if (disabled || readOnly) return;
    onChange(rankedItems.filter((v: any) => v !== itemValue));
  };

  const getChoiceLabel = (choiceValue: string | number) => {
    const choice = choices.find(c => getChoiceValue(c) === choiceValue);
    return choice ? getChoiceText(choice) : String(choiceValue);
  };

  return (
    <div className="space-y-4">
      {/* Ranked items */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Ranked items:</div>
        {rankedItems.length === 0 ? (
          <div className="text-gray-400 italic p-4 border-2 border-dashed rounded-lg">
            Drag items here or click to rank them
          </div>
        ) : (
          rankedItems.map((itemValue: string | number, index: number) => (
            <div
              key={itemValue}
              className="flex items-center gap-2 p-3 bg-primary-50 border-2 border-primary-200 rounded-lg"
            >
              <span className="w-8 h-8 flex items-center justify-center bg-primary-500 text-white rounded-full font-bold">
                {index + 1}
              </span>
              <span className="flex-1 text-gray-800">{getChoiceLabel(itemValue)}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0 || disabled || readOnly}
                  className="p-1 hover:bg-primary-100 rounded disabled:opacity-30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === rankedItems.length - 1 || disabled || readOnly}
                  className="p-1 hover:bg-primary-100 rounded disabled:opacity-30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => removeFromRanked(itemValue)}
                  disabled={disabled || readOnly}
                  className="p-1 hover:bg-red-100 text-red-500 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Unranked items */}
      {unrankedItems.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">Available items:</div>
          <div className="flex flex-wrap gap-2">
            {unrankedItems.map((itemValue) => (
              <button
                key={itemValue}
                type="button"
                onClick={() => addToRanked(itemValue)}
                disabled={disabled || readOnly}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {getChoiceLabel(itemValue)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Image Picker Renderer
// ============================================================================

export const ImagePickerRenderer: React.FC<BaseRendererProps> = ({
  element,
  value,
  onChange,
  disabled,
  readOnly,
}) => {
  const choices = element.choices || [];
  const multiSelect = element.multiSelect || false;
  const selectedValues = multiSelect
    ? (Array.isArray(value) ? value : [])
    : (value !== undefined ? [value] : []);

  const toggleSelection = (choiceValue: string | number) => {
    if (disabled || readOnly) return;
    
    if (multiSelect) {
      const newValues = selectedValues.includes(choiceValue)
        ? selectedValues.filter((v: any) => v !== choiceValue)
        : [...selectedValues, choiceValue];
      onChange(newValues);
    } else {
      onChange(choiceValue);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {choices.map((choice, idx) => {
        const choiceValue = getChoiceValue(choice);
        const imageLink = typeof choice === 'object' ? choice.imageLink : undefined;
        const isSelected = selectedValues.includes(choiceValue);

        return (
          <button
            key={idx}
            type="button"
            onClick={() => toggleSelection(choiceValue)}
            disabled={disabled || readOnly}
            className={`relative aspect-square rounded-xl overflow-hidden border-4 transition-all ${
              isSelected
                ? 'border-primary-500 shadow-lg scale-105'
                : 'border-transparent hover:border-primary-300'
            } ${disabled || readOnly ? 'cursor-not-allowed opacity-75' : ''}`}
          >
            {imageLink ? (
              <img
                src={imageLink}
                alt={getChoiceText(choice)}
                className="w-full h-full object-cover"
                style={{
                  objectFit: element.imageFit || 'cover',
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No image</span>
              </div>
            )}
            {isSelected && (
              <div className="absolute top-2 right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {element.showLabel !== false && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-center text-sm">
                {getChoiceText(choice)}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// Signature Pad Renderer
// ============================================================================

export const SignaturePadRenderer: React.FC<BaseRendererProps> = ({
  element,
  value,
  onChange,
  disabled,
  readOnly,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const width = element.signatureWidth || 400;
  const height = element.signatureHeight || 200;
  const penColor = element.penColor || '#000000';
  const backgroundColor = element.backgroundColor || '#ffffff';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Load existing signature
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = value;
    }
  }, [value, width, height, backgroundColor]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled || readOnly) return;
    setIsDrawing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled || readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    onChange(canvas.toDataURL('image/png'));
  };

  const clearSignature = () => {
    if (disabled || readOnly) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden inline-block">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`touch-none ${disabled || readOnly ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
        />
      </div>
      {!disabled && !readOnly && (
        <button
          type="button"
          onClick={clearSignature}
          className="px-4 py-2 text-sm text-red-600 hover:text-red-800"
        >
          Clear Signature
        </button>
      )}
    </div>
  );
};

// ============================================================================
// File Upload Renderer
// ============================================================================

export const FileUploadRenderer: React.FC<BaseRendererProps> = ({
  element,
  value,
  onChange,
  disabled,
  readOnly,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const files = Array.isArray(value) ? value : (value ? [value] : []);
  const allowMultiple = element.allowMultiple || false;
  const acceptedTypes = element.acceptedTypes || '*/*';
  const maxSize = element.maxSize || 10 * 1024 * 1024; // 10MB default

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || disabled || readOnly) return;

    const newFiles: any[] = [];
    
    Array.from(e.target.files).forEach(file => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        newFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          content: reader.result,
        });

        if (newFiles.length === e.target.files!.length) {
          onChange(allowMultiple ? [...files, ...newFiles] : newFiles);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    if (disabled || readOnly) return;
    const newFiles = files.filter((_: any, i: number) => i !== index);
    onChange(newFiles.length > 0 ? newFiles : null);
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => !disabled && !readOnly && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          disabled || readOnly
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-primary-400 cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes}
          multiple={allowMultiple}
          onChange={handleFileChange}
          disabled={disabled || readOnly}
          className="hidden"
        />
        <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-gray-600">
          {allowMultiple ? 'Drop files here or click to upload' : 'Drop a file here or click to upload'}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Max size: {Math.round(maxSize / 1024 / 1024)}MB
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file: any, index: number) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {element.allowImagesPreview && file.type?.startsWith('image/') && (
                <img src={file.content} alt={file.name} className="w-12 h-12 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{Math.round(file.size / 1024)}KB</p>
              </div>
              {!disabled && !readOnly && (
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// HTML Renderer
// ============================================================================

export const HtmlRenderer: React.FC<BaseRendererProps> = ({ element }) => {
  return (
    <div 
      className="prose max-w-none"
      dangerouslySetInnerHTML={{ __html: element.html || '' }}
    />
  );
};

// ============================================================================
// Expression/Calculated Value Renderer
// ============================================================================

export const ExpressionRenderer: React.FC<BaseRendererProps> = ({
  element,
  value,
}) => {
  const displayStyle = element.displayStyle || 'none';
  const currency = element.currency || 'USD';
  
  let displayValue = value;
  
  if (typeof value === 'number') {
    switch (displayStyle) {
      case 'decimal':
        displayValue = value.toFixed(2);
        break;
      case 'currency':
        displayValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency,
        }).format(value);
        break;
      case 'percent':
        displayValue = `${(value * 100).toFixed(1)}%`;
        break;
    }
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg text-lg font-medium text-gray-800">
      {displayValue ?? '-'}
    </div>
  );
};

// ============================================================================
// Comment (Long Text) Renderer
// ============================================================================

export const CommentRenderer: React.FC<BaseRendererProps> = ({
  element,
  value,
  onChange,
  disabled,
  readOnly,
  errors,
}) => {
  const hasError = errors && errors.length > 0;
  const rows = element.rows || 5;
  const maxLength = element.maxLength;

  return (
    <div className="space-y-2">
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={element.placeholder || 'Type your answer...'}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled || readOnly}
        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 text-lg resize-none 
          ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'}
          ${disabled || readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}
        `}
      />
      {maxLength && (
        <div className="text-sm text-gray-500 text-right">
          {(value || '').length} / {maxLength}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Matrix Dropdown Renderer
// ============================================================================

export const MatrixDropdownRenderer: React.FC<BaseRendererProps> = ({
  element,
  value,
  onChange,
  disabled,
  readOnly,
}) => {
  const rows = (Array.isArray(element.rows) ? element.rows : []) as (string | MatrixRow)[];
  const columns = (Array.isArray(element.columns) ? element.columns : []) as (string | MatrixColumn)[];
  const currentValue = value || {};

  const handleCellChange = (rowValue: string, colName: string, cellValue: any) => {
    if (disabled || readOnly) return;
    onChange({
      ...currentValue,
      [rowValue]: {
        ...currentValue[rowValue],
        [colName]: cellValue,
      },
    });
  };

  const getRowValue = (row: string | MatrixRow): string => {
    return typeof row === 'string' ? row : row.value;
  };

  const getRowText = (row: string | MatrixRow): string => {
    return typeof row === 'string' ? row : (row.text || row.value);
  };

  const getColumnName = (col: string | MatrixColumn): string => {
    return typeof col === 'string' ? col : col.name;
  };

  const getColumnTitle = (col: string | MatrixColumn): string => {
    return typeof col === 'string' ? col : (col.title || col.name);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-3 text-left bg-gray-50 border"></th>
            {columns.map((col, idx) => (
              <th key={idx} className="p-3 text-center bg-gray-50 border font-medium">
                {getColumnTitle(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => {
            const rowValue = getRowValue(row);
            return (
              <tr key={rowIdx}>
                <td className="p-3 border font-medium bg-gray-50">{getRowText(row)}</td>
                {columns.map((col, colIdx) => {
                  const colName = getColumnName(col);
                  const cellType = typeof col === 'object' ? col.cellType : 'dropdown';
                  const choices = typeof col === 'object' ? col.choices : [];
                  const cellValue = currentValue[rowValue]?.[colName];

                  return (
                    <td key={colIdx} className="p-2 border">
                      {cellType === 'dropdown' && (
                        <select
                          value={cellValue ?? ''}
                          onChange={(e) => handleCellChange(rowValue, colName, e.target.value || undefined)}
                          disabled={disabled || readOnly}
                          className="w-full p-2 border rounded"
                        >
                          <option value="">Select...</option>
                          {(choices || []).map((choice, i) => (
                            <option key={i} value={typeof choice === 'string' ? choice : (choice as ChoiceItem).value}>
                              {typeof choice === 'string' ? choice : (choice as ChoiceItem).text || (choice as ChoiceItem).value}
                            </option>
                          ))}
                        </select>
                      )}
                      {cellType === 'text' && (
                        <input
                          type="text"
                          value={cellValue ?? ''}
                          onChange={(e) => handleCellChange(rowValue, colName, e.target.value)}
                          disabled={disabled || readOnly}
                          className="w-full p-2 border rounded"
                        />
                      )}
                      {cellType === 'checkbox' && (
                        <input
                          type="checkbox"
                          checked={cellValue ?? false}
                          onChange={(e) => handleCellChange(rowValue, colName, e.target.checked)}
                          disabled={disabled || readOnly}
                          className="w-5 h-5"
                        />
                      )}
                      {cellType === 'rating' && (
                        <div className="flex gap-1 justify-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleCellChange(rowValue, colName, star)}
                              disabled={disabled || readOnly}
                              className="text-xl"
                            >
                              {star <= (cellValue || 0) ? '★' : '☆'}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// Slider Renderer
// ============================================================================

export const SliderRenderer: React.FC<BaseRendererProps> = ({
  element,
  value,
  onChange,
  disabled,
  readOnly,
  errors,
}) => {
  const min = (element as any).min ?? (element as any).options?.min ?? 0;
  const max = (element as any).max ?? (element as any).options?.max ?? 100;
  const step = (element as any).step ?? (element as any).options?.step ?? 1;
  const showValue = (element as any).showValue ?? true;
  const hasError = errors && errors.length > 0;
  const currentValue = value ?? min;

  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <div className="space-y-4 py-4">
      {/* Value display */}
      {showValue && (
        <div className="text-center">
          <span className="inline-block px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-xl font-bold min-w-[80px]">
            {currentValue}
          </span>
        </div>
      )}

      {/* Slider track and input */}
      <div className="relative">
        {/* Custom track background */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-gray-200 rounded-full" />
        
        {/* Filled portion */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 h-2 bg-primary-500 rounded-full"
          style={{ width: `${percentage}%` }}
        />

        {/* Native slider input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={(e) => !disabled && !readOnly && onChange(Number(e.target.value))}
          disabled={disabled || readOnly}
          className={`relative w-full h-6 appearance-none bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-primary-600
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-primary-600
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-white
            [&::-moz-range-thumb]:shadow-lg
            [&::-moz-range-thumb]:cursor-pointer
            ${hasError ? 'border-red-500' : ''}
            ${disabled || readOnly ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between text-sm text-gray-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

// ============================================================================
// Multiselect Dropdown Renderer
// ============================================================================

export const MultiselectDropdownRenderer: React.FC<BaseRendererProps> = ({
  element,
  value,
  onChange,
  disabled,
  readOnly,
  errors,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const choices = element.choices || [];
  const selectedValues = Array.isArray(value) ? value : [];
  const hasError = errors && errors.length > 0;
  const maxSelected = (element as any).maxSelectedChoices;

  const toggleOption = (optionValue: string | number) => {
    if (disabled || readOnly) return;
    
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v: any) => v !== optionValue));
    } else {
      if (maxSelected && selectedValues.length >= maxSelected) {
        return; // Don't add more if max reached
      }
      onChange([...selectedValues, optionValue]);
    }
  };

  const removeOption = (optionValue: string | number) => {
    if (disabled || readOnly) return;
    onChange(selectedValues.filter((v: any) => v !== optionValue));
  };

  return (
    <div className="relative">
      {/* Selected items display */}
      <div
        onClick={() => !disabled && !readOnly && setIsOpen(!isOpen)}
        className={`min-h-[48px] px-4 py-2 border rounded-lg cursor-pointer flex flex-wrap gap-2 items-center
          ${hasError ? 'border-red-500' : 'border-gray-300'}
          ${disabled || readOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-primary-400'}
        `}
      >
        {selectedValues.length === 0 ? (
          <span className="text-gray-400">{element.placeholder || 'Select options...'}</span>
        ) : (
          selectedValues.map((val: any) => {
            const choice = choices.find((c: any) => getChoiceValue(c) === val);
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm"
              >
                {choice ? getChoiceText(choice) : val}
                {!disabled && !readOnly && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeOption(val); }}
                    className="hover:text-primary-900"
                  >
                    ×
                  </button>
                )}
              </span>
            );
          })
        )}
        <svg className={`w-5 h-5 ml-auto text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && !readOnly && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {choices.map((choice, idx) => {
            const optionValue = getChoiceValue(choice);
            const isSelected = selectedValues.includes(optionValue);
            const isDisabled = !isSelected && maxSelected && selectedValues.length >= maxSelected;
            
            return (
              <button
                key={idx}
                type="button"
                onClick={() => toggleOption(optionValue)}
                disabled={isDisabled}
                className={`w-full px-4 py-2 text-left flex items-center gap-2
                  ${isSelected ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'}
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <span className={`w-4 h-4 border rounded flex items-center justify-center
                  ${isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-300'}
                `}>
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
                {getChoiceText(choice)}
              </button>
            );
          })}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// ============================================================================
// Image Renderer (Display Only)
// ============================================================================

export const ImageRenderer: React.FC<BaseRendererProps> = ({ element }) => {
  const imageLink = (element as any).imageLink || '';
  const imageHeight = (element as any).imageHeight || 'auto';
  const imageWidth = (element as any).imageWidth || '100%';
  const imageAlt = (element as any).imageAlt || element.title || 'Image';

  if (!imageLink) {
    return (
      <div className="p-8 bg-gray-100 rounded-lg text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p>No image URL provided</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <img
        src={imageLink}
        alt={imageAlt}
        style={{ height: imageHeight, width: imageWidth, maxWidth: '100%' }}
        className="rounded-lg object-contain"
      />
    </div>
  );
};

// ============================================================================
// Export all renderers
// ============================================================================

export const questionRenderers: Record<string, React.FC<BaseRendererProps>> = {
  dropdown: DropdownRenderer,
  checkbox: CheckboxRenderer,
  boolean: BooleanRenderer,
  ranking: RankingRenderer,
  image_picker: ImagePickerRenderer,
  signature_pad: SignaturePadRenderer,
  file_upload: FileUploadRenderer,
  html: HtmlRenderer,
  expression: ExpressionRenderer,
  comment: CommentRenderer,
  matrix_dropdown: MatrixDropdownRenderer,
  slider: SliderRenderer,
  multiselect_dropdown: MultiselectDropdownRenderer,
  image: ImageRenderer,
};
