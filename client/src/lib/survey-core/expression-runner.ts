/**
 * Survey Core - Expression Runner
 * 
 * High-level API for running expressions in survey context.
 * Handles expression evaluation, caching, and error handling.
 */

import { parseExpression, ASTNode } from './expression-parser';
import { evaluate, EvaluationContext, registerFunction, getAvailableFunctions } from './expression-evaluator';
import type { SurveySchema, SurveyElement, SurveyPage, SurveyPanel, SurveyResultData } from '../../types';

// Expression cache for performance
const expressionCache = new Map<string, ASTNode>();
const MAX_CACHE_SIZE = 1000;

/**
 * Run an expression and return the result
 */
export function runExpression(
  expression: string | undefined,
  values: SurveyResultData,
  options?: {
    variables?: Record<string, any>;
    properties?: Record<string, any>;
    row?: Record<string, any>;
    panel?: Record<string, any>;
    defaultValue?: any;
  }
): any {
  if (!expression || expression.trim() === '') {
    return options?.defaultValue ?? true;
  }

  try {
    let ast = expressionCache.get(expression);
    
    if (!ast) {
      ast = parseExpression(expression);
      
      // Cache management
      if (expressionCache.size >= MAX_CACHE_SIZE) {
        // Remove oldest entries
        const keysToDelete = Array.from(expressionCache.keys()).slice(0, 100);
        keysToDelete.forEach(key => expressionCache.delete(key));
      }
      expressionCache.set(expression, ast);
    }

    const context: EvaluationContext = {
      values,
      variables: options?.variables,
      properties: options?.properties,
      row: options?.row,
      panel: options?.panel,
    };

    return evaluate(ast, context);
  } catch (error) {
    console.warn(`Expression evaluation error for "${expression}":`, error);
    return options?.defaultValue ?? false;
  }
}

/**
 * Check if an expression is valid
 */
export function validateExpression(expression: string): { valid: boolean; error?: string } {
  try {
    parseExpression(expression);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid expression' 
    };
  }
}

/**
 * Extract variable names from an expression
 */
export function extractVariables(expression: string): string[] {
  const variables: string[] = [];
  const regex = /\{([^}]+)\}/g;
  let match;
  
  while ((match = regex.exec(expression)) !== null) {
    const varName = match[1].split('.')[0]; // Get base variable name
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }
  
  return variables;
}

/**
 * Clear the expression cache
 */
export function clearExpressionCache(): void {
  expressionCache.clear();
}

/**
 * Survey Expression Runner - Higher level API for survey-specific operations
 */
export class SurveyExpressionRunner {
  private schema: SurveySchema;
  private values: SurveyResultData;
  private variables: Record<string, any>;
  private calculatedValues: Record<string, any> = {};

  constructor(schema: SurveySchema, values: SurveyResultData = {}, variables: Record<string, any> = {}) {
    this.schema = schema;
    this.values = values;
    this.variables = variables;
    this.updateCalculatedValues();
  }

  /**
   * Update survey values
   */
  setValues(values: SurveyResultData): void {
    this.values = values;
    this.updateCalculatedValues();
  }

  /**
   * Update a single value
   */
  setValue(name: string, value: any): void {
    this.values[name] = value;
    this.updateCalculatedValues();
  }

  /**
   * Get all values including calculated
   */
  getAllValues(): SurveyResultData {
    return { ...this.values, ...this.calculatedValues };
  }

  /**
   * Run calculated value expressions
   */
  private updateCalculatedValues(): void {
    if (!this.schema.calculatedValues) return;

    const allValues = { ...this.values };
    
    for (const calc of this.schema.calculatedValues) {
      try {
        const result = runExpression(calc.expression, allValues, {
          variables: this.variables,
        });
        this.calculatedValues[calc.name] = result;
        allValues[calc.name] = result; // Make available for subsequent calculations
      } catch (error) {
        console.warn(`Failed to calculate ${calc.name}:`, error);
      }
    }
  }

  /**
   * Check if an element is visible
   */
  isElementVisible(element: SurveyElement | SurveyPanel | SurveyPage): boolean {
    // Explicit visible = false
    if (element.visible === false) return false;
    
    // No visibleIf means always visible
    if (!element.visibleIf) return true;

    return Boolean(runExpression(element.visibleIf, this.getAllValues(), {
      variables: this.variables,
      defaultValue: true,
    }));
  }

  /**
   * Check if an element is enabled
   */
  isElementEnabled(element: SurveyElement | SurveyPanel | SurveyPage): boolean {
    // Explicit readOnly = true
    if (element.readOnly === true) return false;
    
    // No enableIf means always enabled
    if (!('enableIf' in element) || !element.enableIf) return true;

    return Boolean(runExpression(element.enableIf, this.getAllValues(), {
      variables: this.variables,
      defaultValue: true,
    }));
  }

  /**
   * Check if an element is required
   */
  isElementRequired(element: SurveyElement): boolean {
    // Explicit isRequired
    if (element.isRequired === true) return true;
    
    // No requiredIf means use isRequired
    if (!element.requiredIf) return Boolean(element.isRequired);

    return Boolean(runExpression(element.requiredIf, this.getAllValues(), {
      variables: this.variables,
      defaultValue: false,
    }));
  }

  /**
   * Get visible pages
   */
  getVisiblePages(): SurveyPage[] {
    return this.schema.pages.filter(page => this.isElementVisible(page));
  }

  /**
   * Get visible elements on a page (flattened, including panel contents)
   */
  getVisibleElements(page: SurveyPage): SurveyElement[] {
    const elements: SurveyElement[] = [];
    
    const processElements = (items: (SurveyElement | SurveyPanel)[]) => {
      for (const item of items) {
        if (!this.isElementVisible(item)) continue;
        
        if (item.type === 'panel') {
          processElements((item as SurveyPanel).elements);
        } else {
          elements.push(item as SurveyElement);
        }
      }
    };
    
    processElements(page.elements);
    return elements;
  }

  /**
   * Evaluate triggers and return actions to execute
   */
  evaluateTriggers(): Array<{
    type: string;
    setToName?: string;
    setValue?: any;
    gotoName?: string;
    runExpression?: string;
  }> {
    if (!this.schema.triggers) return [];

    const actions: Array<any> = [];
    
    for (const trigger of this.schema.triggers) {
      const shouldFire = runExpression(trigger.expression, this.getAllValues(), {
        variables: this.variables,
        defaultValue: false,
      });

      if (shouldFire) {
        actions.push({
          type: trigger.type,
          setToName: trigger.setToName,
          setValue: trigger.setValue,
          gotoName: trigger.gotoName,
          runExpression: trigger.runExpression,
        });
      }
    }

    return actions;
  }

  /**
   * Get expression for a calculated field
   */
  evaluateExpression(element: SurveyElement): any {
    if (element.type !== 'expression' || !element.expression) {
      return undefined;
    }

    return runExpression(element.expression, this.getAllValues(), {
      variables: this.variables,
    });
  }
}

// Re-export for convenience
export { parseExpression, evaluate, registerFunction, getAvailableFunctions };
export type { ASTNode, EvaluationContext };
