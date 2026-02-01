/**
 * Survey Core - Validation Engine
 * 
 * Validates survey responses against question validators.
 * Supports required, numeric, text, email, regex, and expression validators.
 */

import { runExpression } from './expression-runner';
import type { SurveyElement, Validator, SurveyResultData } from '../../types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  questionName: string;
  validatorType: string;
  message: string;
}

/**
 * Default error messages for validators
 */
const DEFAULT_MESSAGES: Record<string, string> = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  numeric: 'Please enter a valid number',
  numeric_min: 'The value should be at least {0}',
  numeric_max: 'The value should be at most {0}',
  numeric_range: 'The value should be between {0} and {1}',
  text_minLength: 'Please enter at least {0} characters',
  text_maxLength: 'Please enter no more than {0} characters',
  text_range: 'Please enter between {0} and {1} characters',
  regex: 'Please enter a value in the correct format',
  expression: 'The value does not meet the required condition',
  answercount_min: 'Please select at least {0} items',
  answercount_max: 'Please select no more than {0} items',
  answercount_range: 'Please select between {0} and {1} items',
};

/**
 * Format an error message with parameters
 */
function formatMessage(template: string, ...params: any[]): string {
  let result = template;
  params.forEach((param, index) => {
    result = result.replace(`{${index}}`, String(param));
  });
  return result;
}

/**
 * Check if a value is empty
 */
function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Validate a single value against a validator
 */
function validateValue(
  value: any,
  validator: Validator,
  allValues: SurveyResultData,
  variables?: Record<string, any>
): string | null {
  switch (validator.type) {
    case 'required':
      if (isEmpty(value)) {
        return validator.text || DEFAULT_MESSAGES.required;
      }
      break;

    case 'email':
      if (!isEmpty(value)) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          return validator.text || DEFAULT_MESSAGES.email;
        }
      }
      break;

    case 'numeric':
      if (!isEmpty(value)) {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          return validator.text || DEFAULT_MESSAGES.numeric;
        }
        if (validator.minValue !== undefined && numValue < validator.minValue) {
          return validator.text || formatMessage(DEFAULT_MESSAGES.numeric_min, validator.minValue);
        }
        if (validator.maxValue !== undefined && numValue > validator.maxValue) {
          return validator.text || formatMessage(DEFAULT_MESSAGES.numeric_max, validator.maxValue);
        }
      }
      break;

    case 'text':
      if (!isEmpty(value)) {
        const strValue = String(value);
        const len = strValue.length;
        
        if (validator.minLength !== undefined && len < validator.minLength) {
          return validator.text || formatMessage(DEFAULT_MESSAGES.text_minLength, validator.minLength);
        }
        if (validator.maxLength !== undefined && len > validator.maxLength) {
          return validator.text || formatMessage(DEFAULT_MESSAGES.text_maxLength, validator.maxLength);
        }
        if (validator.allowDigits === false && /\d/.test(strValue)) {
          return validator.text || 'Digits are not allowed';
        }
      }
      break;

    case 'regex':
      if (!isEmpty(value) && validator.regex) {
        try {
          const regex = new RegExp(validator.regex);
          if (!regex.test(String(value))) {
            return validator.text || DEFAULT_MESSAGES.regex;
          }
        } catch {
          console.warn('Invalid regex in validator:', validator.regex);
        }
      }
      break;

    case 'expression':
      if (validator.expression) {
        const result = runExpression(validator.expression, allValues, {
          variables,
          properties: { value },
          defaultValue: true,
        });
        if (!result) {
          return validator.text || DEFAULT_MESSAGES.expression;
        }
      }
      break;

    case 'answercount':
      if (!isEmpty(value) && Array.isArray(value)) {
        const count = value.length;
        if (validator.minCount !== undefined && count < validator.minCount) {
          return validator.text || formatMessage(DEFAULT_MESSAGES.answercount_min, validator.minCount);
        }
        if (validator.maxCount !== undefined && count > validator.maxCount) {
          return validator.text || formatMessage(DEFAULT_MESSAGES.answercount_max, validator.maxCount);
        }
      }
      break;
  }

  return null; // Valid
}

/**
 * Validate a single question
 */
export function validateQuestion(
  element: SurveyElement,
  value: any,
  allValues: SurveyResultData,
  options?: {
    variables?: Record<string, any>;
    isRequired?: boolean; // Override for conditional required
  }
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check required
  const isRequired = options?.isRequired ?? element.isRequired;
  if (isRequired && isEmpty(value)) {
    errors.push({
      questionName: element.name,
      validatorType: 'required',
      message: DEFAULT_MESSAGES.required,
    });
    // Return early for required - no point checking other validators
    return { isValid: false, errors };
  }

  // Run validators
  if (element.validators) {
    for (const validator of element.validators) {
      // Skip required validator if already checked
      if (validator.type === 'required') continue;
      
      const error = validateValue(value, validator, allValues, options?.variables);
      if (error) {
        errors.push({
          questionName: element.name,
          validatorType: validator.type,
          message: error,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate all questions on a page
 */
export function validatePage(
  elements: SurveyElement[],
  values: SurveyResultData,
  options?: {
    variables?: Record<string, any>;
    requiredOverrides?: Record<string, boolean>;
  }
): ValidationResult {
  const allErrors: ValidationError[] = [];

  for (const element of elements) {
    const value = values[element.name];
    const isRequired = options?.requiredOverrides?.[element.name] ?? element.isRequired;
    
    const result = validateQuestion(element, value, values, {
      variables: options?.variables,
      isRequired,
    });

    allErrors.push(...result.errors);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Validate the entire survey
 */
export function validateSurvey(
  elements: SurveyElement[],
  values: SurveyResultData,
  options?: {
    variables?: Record<string, any>;
    requiredOverrides?: Record<string, boolean>;
    visibilityOverrides?: Record<string, boolean>;
  }
): ValidationResult {
  const allErrors: ValidationError[] = [];

  for (const element of elements) {
    // Skip invisible elements
    const isVisible = options?.visibilityOverrides?.[element.name] ?? true;
    if (!isVisible) continue;

    const value = values[element.name];
    const isRequired = options?.requiredOverrides?.[element.name] ?? element.isRequired;
    
    const result = validateQuestion(element, value, values, {
      variables: options?.variables,
      isRequired,
    });

    allErrors.push(...result.errors);
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Create a validator helper for a specific question type
 */
export function createDefaultValidators(element: SurveyElement): Validator[] {
  const validators: Validator[] = [];

  switch (element.type) {
    case 'nps':
    case 'rating_scale':
      validators.push({
        type: 'numeric',
        minValue: element.rateMin ?? element.npsMin ?? 0,
        maxValue: element.rateMax ?? element.npsMax ?? 10,
      });
      break;

    case 'text_short':
      if (element.inputType === 'email') {
        validators.push({ type: 'email' });
      }
      if (element.inputType === 'number') {
        validators.push({ type: 'numeric' });
      }
      if (element.maxLength) {
        validators.push({ type: 'text', maxLength: element.maxLength });
      }
      break;

    case 'checkbox':
    case 'ranking':
      // Answer count validators can be added based on element options
      break;
  }

  return validators;
}
