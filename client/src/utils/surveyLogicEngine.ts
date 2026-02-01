import { LogicRule, LogicOperator, QuestionOptions } from '../types';

interface Question {
  id: string;
  type: string;
  content: string;
  options?: QuestionOptions;
  isRequired?: boolean;
  is_required?: boolean;
  orderIndex?: number;
  order_index?: number;
}

export interface LogicEvaluationResult {
  nextQuestionIndex: number | 'end';
  skippedQuestionIds: string[];
}

/**
 * Check if a condition matches the given answer
 */
function matchesCondition(
  operator: LogicOperator,
  conditionValue: any,
  answerValue: any
): boolean {
  switch (operator) {
    case 'is_answered':
      return answerValue !== undefined && answerValue !== null && answerValue !== '';

    case 'is_not_answered':
      return answerValue === undefined || answerValue === null || answerValue === '';

    case 'equals':
      return answerValue === conditionValue;

    case 'not_equals':
      return answerValue !== conditionValue;

    case 'contains':
      if (typeof answerValue === 'string') {
        return answerValue.toLowerCase().includes(String(conditionValue).toLowerCase());
      }
      if (Array.isArray(answerValue)) {
        return answerValue.includes(conditionValue);
      }
      return false;

    case 'not_contains':
      if (typeof answerValue === 'string') {
        return !answerValue.toLowerCase().includes(String(conditionValue).toLowerCase());
      }
      if (Array.isArray(answerValue)) {
        return !answerValue.includes(conditionValue);
      }
      return true;

    case 'greater_than':
      return typeof answerValue === 'number' && answerValue > Number(conditionValue);

    case 'less_than':
      return typeof answerValue === 'number' && answerValue < Number(conditionValue);

    case 'greater_than_or_equal':
      return typeof answerValue === 'number' && answerValue >= Number(conditionValue);

    case 'less_than_or_equal':
      return typeof answerValue === 'number' && answerValue <= Number(conditionValue);

    case 'is_any_of':
      if (Array.isArray(conditionValue)) {
        if (Array.isArray(answerValue)) {
          return answerValue.some((v) => conditionValue.includes(v));
        }
        return conditionValue.includes(answerValue);
      }
      return false;

    case 'is_none_of':
      if (Array.isArray(conditionValue)) {
        if (Array.isArray(answerValue)) {
          return !answerValue.some((v) => conditionValue.includes(v));
        }
        return !conditionValue.includes(answerValue);
      }
      return true;

    default:
      return false;
  }
}

/**
 * Evaluate logic rules for a question and determine the next question
 */
export function evaluateLogic(
  currentQuestion: Question,
  currentAnswer: any,
  allQuestions: Question[],
  allAnswers: Record<string, any>
): LogicEvaluationResult {
  const rules = currentQuestion.options?.logicRules || [];
  const currentIndex = allQuestions.findIndex((q) => q.id === currentQuestion.id);
  const skippedQuestionIds: string[] = [];

  // Check each rule in order (first match wins)
  for (const rule of rules) {
    const matches = matchesCondition(
      rule.condition.operator,
      rule.condition.value,
      currentAnswer
    );

    if (matches) {
      // Handle end_survey action
      if (rule.action.type === 'end_survey') {
        // Mark all remaining questions as skipped
        for (let i = currentIndex + 1; i < allQuestions.length; i++) {
          skippedQuestionIds.push(allQuestions[i].id);
        }
        return { nextQuestionIndex: 'end', skippedQuestionIds };
      }

      // Handle skip_to action
      if (rule.action.type === 'skip_to' && rule.action.targetQuestionId) {
        const targetIndex = allQuestions.findIndex(
          (q) => q.id === rule.action.targetQuestionId
        );
        if (targetIndex !== -1 && targetIndex > currentIndex) {
          // Mark skipped questions
          for (let i = currentIndex + 1; i < targetIndex; i++) {
            skippedQuestionIds.push(allQuestions[i].id);
          }
          return { nextQuestionIndex: targetIndex, skippedQuestionIds };
        }
      }
    }
  }

  // Default: next sequential question
  const nextIndex = currentIndex + 1;
  if (nextIndex >= allQuestions.length) {
    return { nextQuestionIndex: 'end', skippedQuestionIds };
  }
  return { nextQuestionIndex: nextIndex, skippedQuestionIds };
}

/**
 * Calculate the navigation path through a survey based on current answers
 * Returns the ordered list of question IDs that should be shown
 */
export function calculateSurveyPath(
  questions: Question[],
  answers: Record<string, any>
): string[] {
  const path: string[] = [];
  let currentIndex = 0;

  while (currentIndex < questions.length && currentIndex !== -1) {
    const question = questions[currentIndex];
    path.push(question.id);

    const answer = answers[question.id];
    const result = evaluateLogic(question, answer, questions, answers);

    if (result.nextQuestionIndex === 'end') {
      break;
    }
    currentIndex = result.nextQuestionIndex;
  }

  return path;
}

/**
 * Get the previous question index, respecting the survey path
 */
export function getPreviousQuestionIndex(
  currentIndex: number,
  questions: Question[],
  answers: Record<string, any>,
  visitedPath: string[]
): number {
  if (currentIndex === 0 || visitedPath.length <= 1) {
    return 0;
  }

  // Find current question in visited path
  const currentQuestion = questions[currentIndex];
  const currentPathIndex = visitedPath.findIndex((id) => id === currentQuestion?.id);

  if (currentPathIndex > 0) {
    // Get the previous question from the visited path
    const prevQuestionId = visitedPath[currentPathIndex - 1];
    const prevIndex = questions.findIndex((q) => q.id === prevQuestionId);
    if (prevIndex !== -1) {
      return prevIndex;
    }
  }

  // Fallback: just go to previous index
  return Math.max(0, currentIndex - 1);
}

/**
 * Check if a question has any logic rules defined
 */
export function hasLogicRules(question: Question): boolean {
  return (question.options?.logicRules?.length || 0) > 0;
}

/**
 * Validate logic rules for a question (check for invalid references, etc.)
 */
export function validateLogicRules(
  question: Question,
  allQuestions: Question[]
): { valid: boolean; errors: string[] } {
  const rules = question.options?.logicRules || [];
  const errors: string[] = [];
  const questionIndex = allQuestions.findIndex((q) => q.id === question.id);

  for (const rule of rules) {
    // Check skip_to targets
    if (rule.action.type === 'skip_to') {
      if (!rule.action.targetQuestionId) {
        errors.push('Skip-to rule must specify a target question');
      } else {
        const targetIndex = allQuestions.findIndex(
          (q) => q.id === rule.action.targetQuestionId
        );
        if (targetIndex === -1) {
          errors.push('Skip-to target question not found');
        } else if (targetIndex <= questionIndex) {
          errors.push('Skip-to target must be after the current question');
        }
      }
    }

    // Check condition values
    if (['equals', 'not_equals', 'contains', 'not_contains'].includes(rule.condition.operator)) {
      if (rule.condition.value === undefined || rule.condition.value === '') {
        errors.push('Condition value is required');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export default {
  evaluateLogic,
  calculateSurveyPath,
  getPreviousQuestionIndex,
  hasLogicRules,
  validateLogicRules,
  matchesCondition,
};
