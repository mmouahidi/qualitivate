/**
 * SurveyRunner Component
 * 
 * A complete survey rendering component using the new schema format.
 * Handles navigation, validation, expressions, and submission.
 */

import React, { useCallback } from 'react';
import QuestionRenderer from './QuestionRenderer';
import { useSurveyRunner, type UseSurveyRunnerOptions } from '../../hooks/useSurveyRunner';
import type { SurveySchema, SurveyElement, SurveyResultData } from '../../types';

export interface SurveyRunnerProps extends Omit<UseSurveyRunnerOptions, 'schema'> {
  schema: SurveySchema;
  className?: string;
  showProgress?: boolean;
  showPageTitles?: boolean;
  onSubmit?: (values: SurveyResultData) => Promise<void>;
  submitButtonText?: string;
  nextButtonText?: string;
  prevButtonText?: string;
}

const SurveyRunner: React.FC<SurveyRunnerProps> = ({
  schema,
  className = '',
  showProgress = true,
  showPageTitles = true,
  onSubmit,
  submitButtonText = 'Submit',
  nextButtonText = 'Next',
  prevButtonText = 'Previous',
  ...options
}) => {
  const {
    state,
    currentPage,
    currentPageElements,
    setValue,
    nextPage,
    prevPage,
    isElementRequired,
    getCalculatedValue,
  } = useSurveyRunner({
    schema,
    ...options,
    onComplete: async (values) => {
      if (onSubmit) {
        await onSubmit(values);
      }
      options.onComplete?.(values);
    },
  });

  const { values, errors, isFirstPage, isLastPage, isCompleted, progress } = state;

  // Handle value change for a question
  const handleValueChange = useCallback((element: SurveyElement, value: any) => {
    setValue(element.name, value);
  }, [setValue]);

  // Render a single element
  const renderElement = (element: SurveyElement) => {
    const questionValue = element.type === 'expression' 
      ? getCalculatedValue(element) 
      : values[element.name];
    const questionErrors = errors[element.name] || [];
    const isRequired = isElementRequired(element);

    return (
      <div key={element.name} className="mb-8">
        {/* Question title */}
        <div className="mb-4">
          <label className="block text-lg font-medium text-gray-900">
            {element.title || element.name}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          {element.description && (
            <p className="mt-1 text-sm text-gray-500">{element.description}</p>
          )}
        </div>

        {/* Question renderer */}
        <QuestionRenderer
          question={{
            id: element.name,
            name: element.name,
            type: element.type,
            content: element.title || element.name,
            title: element.title,
            choices: element.choices,
            options: element.options,
            rows: element.rows as any,
            columns: element.columns as any,
            isRequired,
            placeholder: element.placeholder,
            maxLength: element.maxLength,
            inputType: element.inputType,
            hasOther: element.hasOther,
            hasNone: element.hasNone,
            hasSelectAll: element.hasSelectAll,
            otherText: element.otherText,
            noneText: element.noneText,
            selectAllText: element.selectAllText,
            colCount: element.colCount,
            rateMin: element.rateMin,
            rateMax: element.rateMax,
            rateType: element.rateType,
            minRateDescription: element.minRateDescription,
            maxRateDescription: element.maxRateDescription,
            labelTrue: element.labelTrue,
            labelFalse: element.labelFalse,
            valueTrue: element.valueTrue,
            valueFalse: element.valueFalse,
            multiSelect: element.multiSelect,
            showLabel: element.showLabel,
            imageFit: element.imageFit,
            signatureWidth: element.signatureWidth,
            signatureHeight: element.signatureHeight,
            penColor: element.penColor,
            backgroundColor: element.backgroundColor,
            allowMultiple: element.allowMultiple,
            allowImagesPreview: element.allowImagesPreview,
            acceptedTypes: element.acceptedTypes,
            maxSize: element.maxSize,
            html: element.html,
            expression: element.expression,
            displayStyle: element.displayStyle,
            currency: element.currency,
          }}
          value={questionValue}
          onChange={(value) => handleValueChange(element, value)}
          errors={questionErrors}
          readOnly={element.readOnly}
        />

        {/* Error display */}
        {questionErrors.length > 0 && (
          <div className="mt-2">
            {questionErrors.map((error, idx) => (
              <p key={idx} className="text-sm text-red-600">{error}</p>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Completed state
  if (isCompleted) {
    return (
      <div className={`survey-completed ${className}`}>
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          {schema.completedHtml ? (
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: schema.completedHtml }}
            />
          ) : (
            <p className="text-gray-600">Your response has been submitted successfully.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`survey-runner ${className}`}>
      {/* Progress bar */}
      {showProgress && schema.showProgressBar !== 'off' && (
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Page {progress.pages.current} of {progress.pages.total}</span>
            <span>{progress.questions.answered} of {progress.questions.total} answered</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ 
                width: `${(progress.questions.answered / Math.max(progress.questions.total, 1)) * 100}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Page title */}
      {showPageTitles && currentPage && (currentPage.title || currentPage.description) && (
        <div className="mb-8">
          {currentPage.title && (
            <h2 className="text-2xl font-bold text-gray-900">{currentPage.title}</h2>
          )}
          {currentPage.description && (
            <p className="mt-2 text-gray-600">{currentPage.description}</p>
          )}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-6">
        {currentPageElements.map(element => renderElement(element))}
      </div>

      {/* Navigation */}
      {schema.showNavigationButtons !== false && (
        <div className="flex justify-between mt-10 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prevPage}
            disabled={isFirstPage}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isFirstPage
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {prevButtonText}
          </button>
          <button
            type="button"
            onClick={nextPage}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            {isLastPage ? submitButtonText : nextButtonText}
          </button>
        </div>
      )}
    </div>
  );
};

export default SurveyRunner;
