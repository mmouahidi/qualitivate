/**
 * Survey Core - Main Entry Point
 * 
 * Exports all survey-core functionality for use across the application.
 */

// Expression Engine
export {
  parseExpression,
  ExpressionLexer,
  ExpressionParser,
  type Token,
  type TokenType,
  type ASTNode,
} from './expression-parser';

export {
  evaluate,
  registerFunction,
  getAvailableFunctions,
  type EvaluationContext,
} from './expression-evaluator';

export {
  runExpression,
  validateExpression,
  extractVariables,
  clearExpressionCache,
  SurveyExpressionRunner,
} from './expression-runner';

// Validation Engine
export {
  validateQuestion,
  validatePage,
  validateSurvey,
  createDefaultValidators,
  type ValidationResult,
  type ValidationError,
} from './validation-engine';

// Re-export types for convenience
export type {
  SurveySchema,
  SurveyPage,
  SurveyPanel,
  SurveyElement,
  ExtendedQuestionType,
  Validator,
  ValidatorType,
  ChoiceItem,
  MatrixColumn,
  MatrixRow,
  SurveyTrigger,
  CalculatedValue,
  SurveyResultData,
  ExpressionContext,
  SurveyWithSchema,
  SurveyTemplate,
} from '../../types';
