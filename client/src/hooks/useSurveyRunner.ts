/**
 * useSurveyRunner Hook
 * 
 * Manages survey state, navigation, validation, and expression evaluation.
 * This is the main hook for running a survey in the client.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  SurveyExpressionRunner, 
  validatePage, 
  validateSurvey,
  runExpression,
  type ValidationError,
} from '../lib/survey-core';
import type { 
  SurveySchema, 
  SurveyPage, 
  SurveyElement, 
  SurveyPanel,
  SurveyResultData,
} from '../types';

export interface SurveyRunnerState {
  currentPageIndex: number;
  values: SurveyResultData;
  errors: Record<string, string[]>;
  isCompleted: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  visitedPages: number[];
  startTime: Date;
  progress: {
    pages: { current: number; total: number };
    questions: { answered: number; total: number };
  };
}

export interface UseSurveyRunnerOptions {
  schema: SurveySchema;
  initialValues?: SurveyResultData;
  variables?: Record<string, any>;
  onValueChanged?: (name: string, value: any, allValues: SurveyResultData) => void;
  onPageChanged?: (oldIndex: number, newIndex: number) => void;
  onComplete?: (values: SurveyResultData) => void;
  onValidationError?: (errors: ValidationError[]) => void;
  validateOnValueChange?: boolean;
  autoAdvance?: boolean;
}

export function useSurveyRunner(options: UseSurveyRunnerOptions) {
  const {
    schema,
    initialValues = {},
    variables = {},
    onValueChanged,
    onPageChanged,
    onComplete,
    onValidationError,
    validateOnValueChange = false,
    autoAdvance = false,
  } = options;

  // State
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [values, setValues] = useState<SurveyResultData>(initialValues);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [visitedPages, setVisitedPages] = useState<number[]>([0]);
  const [startTime] = useState(new Date());

  // Expression runner instance
  const expressionRunner = useMemo(
    () => new SurveyExpressionRunner(schema, values, variables),
    [schema, variables]
  );

  // Update expression runner when values change
  useEffect(() => {
    expressionRunner.setValues(values);
  }, [values, expressionRunner]);

  // Get visible pages
  const visiblePages = useMemo(() => {
    return schema.pages.filter(page => expressionRunner.isElementVisible(page));
  }, [schema.pages, expressionRunner, values]);

  // Current page
  const currentPage = visiblePages[currentPageIndex];

  // Navigation state
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === visiblePages.length - 1;

  // Get all visible elements on current page (flattened)
  const currentPageElements = useMemo(() => {
    if (!currentPage) return [];
    return expressionRunner.getVisibleElements(currentPage);
  }, [currentPage, expressionRunner, values]);

  // Progress calculation
  const progress = useMemo(() => {
    const totalPages = visiblePages.length;
    let totalQuestions = 0;
    let answeredQuestions = 0;

    visiblePages.forEach(page => {
      const elements = expressionRunner.getVisibleElements(page);
      elements.forEach(el => {
        if (el.type !== 'html' && el.type !== 'expression') {
          totalQuestions++;
          if (values[el.name] !== undefined && values[el.name] !== null && values[el.name] !== '') {
            answeredQuestions++;
          }
        }
      });
    });

    return {
      pages: { current: currentPageIndex + 1, total: totalPages },
      questions: { answered: answeredQuestions, total: totalQuestions },
    };
  }, [visiblePages, currentPageIndex, values, expressionRunner]);

  // Set a single value
  const setValue = useCallback((name: string, value: any) => {
    setValues(prev => {
      const newValues = { ...prev, [name]: value };
      onValueChanged?.(name, value, newValues);
      return newValues;
    });

    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });

    // Validate on change if enabled
    if (validateOnValueChange) {
      const element = currentPageElements.find(el => el.name === name);
      if (element) {
        const isRequired = expressionRunner.isElementRequired(element);
        const result = validatePage([element], { ...values, [name]: value }, {
          variables,
          requiredOverrides: { [name]: isRequired },
        });
        
        if (!result.isValid) {
          setErrors(prev => ({
            ...prev,
            [name]: result.errors.filter(e => e.questionName === name).map(e => e.message),
          }));
        }
      }
    }
  }, [values, onValueChanged, validateOnValueChange, currentPageElements, variables, expressionRunner]);

  // Validate current page
  const validateCurrentPage = useCallback((): boolean => {
    // Build required overrides based on requiredIf expressions
    const requiredOverrides: Record<string, boolean> = {};
    currentPageElements.forEach(el => {
      requiredOverrides[el.name] = expressionRunner.isElementRequired(el);
    });

    const result = validatePage(currentPageElements, values, {
      variables,
      requiredOverrides,
    });

    if (!result.isValid) {
      const newErrors: Record<string, string[]> = {};
      result.errors.forEach(err => {
        if (!newErrors[err.questionName]) {
          newErrors[err.questionName] = [];
        }
        newErrors[err.questionName].push(err.message);
      });
      setErrors(newErrors);
      onValidationError?.(result.errors);
      return false;
    }

    setErrors({});
    return true;
  }, [currentPageElements, values, variables, expressionRunner, onValidationError]);

  // Go to next page
  const nextPage = useCallback(() => {
    if (isLastPage) {
      // Validate and complete
      if (validateCurrentPage()) {
        setIsCompleted(true);
        onComplete?.(expressionRunner.getAllValues());
      }
      return;
    }

    if (!validateCurrentPage()) {
      return;
    }

    // Check triggers
    const triggers = expressionRunner.evaluateTriggers();
    for (const trigger of triggers) {
      if (trigger.type === 'complete') {
        setIsCompleted(true);
        onComplete?.(expressionRunner.getAllValues());
        return;
      }
      if (trigger.type === 'skip' && trigger.gotoName) {
        // Find page by name
        const targetIndex = visiblePages.findIndex(p => p.name === trigger.gotoName);
        if (targetIndex !== -1) {
          onPageChanged?.(currentPageIndex, targetIndex);
          setCurrentPageIndex(targetIndex);
          setVisitedPages(prev => prev.includes(targetIndex) ? prev : [...prev, targetIndex]);
          return;
        }
      }
      if (trigger.type === 'setvalue' && trigger.setToName) {
        setValue(trigger.setToName, trigger.setValue);
      }
    }

    const newIndex = currentPageIndex + 1;
    onPageChanged?.(currentPageIndex, newIndex);
    setCurrentPageIndex(newIndex);
    setVisitedPages(prev => prev.includes(newIndex) ? prev : [...prev, newIndex]);
  }, [
    isLastPage, 
    validateCurrentPage, 
    currentPageIndex, 
    visiblePages,
    expressionRunner, 
    onPageChanged, 
    onComplete,
    setValue,
  ]);

  // Go to previous page
  const prevPage = useCallback(() => {
    if (isFirstPage) return;
    
    const newIndex = currentPageIndex - 1;
    onPageChanged?.(currentPageIndex, newIndex);
    setCurrentPageIndex(newIndex);
  }, [isFirstPage, currentPageIndex, onPageChanged]);

  // Go to specific page
  const goToPage = useCallback((index: number) => {
    if (index < 0 || index >= visiblePages.length) return;
    if (index > currentPageIndex && !validateCurrentPage()) return;
    
    onPageChanged?.(currentPageIndex, index);
    setCurrentPageIndex(index);
    setVisitedPages(prev => prev.includes(index) ? prev : [...prev, index]);
  }, [visiblePages.length, currentPageIndex, validateCurrentPage, onPageChanged]);

  // Get element visibility
  const isElementVisible = useCallback((element: SurveyElement | SurveyPanel | SurveyPage) => {
    return expressionRunner.isElementVisible(element);
  }, [expressionRunner]);

  // Get element enabled state
  const isElementEnabled = useCallback((element: SurveyElement | SurveyPanel | SurveyPage) => {
    return expressionRunner.isElementEnabled(element);
  }, [expressionRunner]);

  // Get element required state
  const isElementRequired = useCallback((element: SurveyElement) => {
    return expressionRunner.isElementRequired(element);
  }, [expressionRunner]);

  // Get calculated value for expression elements
  const getCalculatedValue = useCallback((element: SurveyElement) => {
    if (element.type !== 'expression' || !element.expression) {
      return undefined;
    }
    return runExpression(element.expression, expressionRunner.getAllValues(), { variables });
  }, [expressionRunner, variables]);

  // Reset survey
  const reset = useCallback(() => {
    setValues(initialValues);
    setCurrentPageIndex(0);
    setErrors({});
    setIsCompleted(false);
    setVisitedPages([0]);
  }, [initialValues]);

  return {
    // State
    state: {
      currentPageIndex,
      values,
      errors,
      isCompleted,
      isFirstPage,
      isLastPage,
      visitedPages,
      startTime,
      progress,
    } as SurveyRunnerState,
    
    // Current page data
    currentPage,
    currentPageElements,
    visiblePages,
    
    // Actions
    setValue,
    nextPage,
    prevPage,
    goToPage,
    validateCurrentPage,
    reset,
    
    // Helpers
    isElementVisible,
    isElementEnabled,
    isElementRequired,
    getCalculatedValue,
    getAllValues: () => expressionRunner.getAllValues(),
  };
}

export default useSurveyRunner;
