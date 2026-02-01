import React from 'react';
import { LogicRule, LogicOperator, LogicActionType, QuestionType } from '../../types';

interface LogicRuleEditorProps {
  questionType: QuestionType | string;
  questionOptions?: { choices?: string[] };
  availableTargets: Array<{ id: string; content: string; orderIndex: number }>;
  rules: LogicRule[];
  onRulesChange: (rules: LogicRule[]) => void;
}

// Define which operators are available for each question type
const operatorsByQuestionType: Record<string, LogicOperator[]> = {
  nps: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'is_answered', 'is_not_answered'],
  rating_scale: ['equals', 'not_equals', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'is_answered', 'is_not_answered'],
  multiple_choice: ['equals', 'not_equals', 'is_any_of', 'is_none_of', 'is_answered', 'is_not_answered'],
  text_short: ['equals', 'not_equals', 'contains', 'not_contains', 'is_answered', 'is_not_answered'],
  text_long: ['equals', 'not_equals', 'contains', 'not_contains', 'is_answered', 'is_not_answered'],
  matrix: ['is_answered', 'is_not_answered'],
};

const operatorLabels: Record<LogicOperator, string> = {
  equals: 'Equals',
  not_equals: 'Does not equal',
  contains: 'Contains',
  not_contains: 'Does not contain',
  greater_than: 'Is greater than',
  less_than: 'Is less than',
  greater_than_or_equal: 'Is greater than or equal to',
  less_than_or_equal: 'Is less than or equal to',
  is_answered: 'Is answered',
  is_not_answered: 'Is not answered',
  is_any_of: 'Is any of',
  is_none_of: 'Is none of',
};

const actionLabels: Record<LogicActionType, string> = {
  skip_to: 'Skip to question',
  end_survey: 'End survey',
  show: 'Show question',
  hide: 'Hide question',
};

const LogicRuleEditor: React.FC<LogicRuleEditorProps> = ({
  questionType,
  questionOptions,
  availableTargets,
  rules,
  onRulesChange,
}) => {
  const availableOperators = operatorsByQuestionType[questionType] || ['is_answered', 'is_not_answered'];
  const choices = questionOptions?.choices || [];
  const sortedTargets = [...availableTargets].sort((a, b) => a.orderIndex - b.orderIndex);

  const addRule = () => {
    const newRule: LogicRule = {
      id: `rule_${Date.now()}`,
      condition: {
        operator: availableOperators[0],
        value: undefined,
      },
      action: {
        type: 'skip_to',
        targetQuestionId: sortedTargets[0]?.id,
      },
    };
    onRulesChange([...rules, newRule]);
  };

  const updateRule = (ruleId: string, updates: Partial<LogicRule>) => {
    onRulesChange(
      rules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    );
  };

  const updateCondition = (ruleId: string, conditionUpdates: Partial<LogicRule['condition']>) => {
    onRulesChange(
      rules.map((rule) =>
        rule.id === ruleId
          ? { ...rule, condition: { ...rule.condition, ...conditionUpdates } }
          : rule
      )
    );
  };

  const updateAction = (ruleId: string, actionUpdates: Partial<LogicRule['action']>) => {
    onRulesChange(
      rules.map((rule) =>
        rule.id === ruleId
          ? { ...rule, action: { ...rule.action, ...actionUpdates } }
          : rule
      )
    );
  };

  const removeRule = (ruleId: string) => {
    onRulesChange(rules.filter((rule) => rule.id !== ruleId));
  };

  const needsValue = (operator: LogicOperator): boolean => {
    return !['is_answered', 'is_not_answered'].includes(operator);
  };

  const renderValueInput = (rule: LogicRule) => {
    if (!needsValue(rule.condition.operator)) {
      return null;
    }

    // For NPS or rating scale, show number input
    if (['nps', 'rating_scale'].includes(questionType)) {
      return (
        <input
          type="number"
          value={rule.condition.value ?? ''}
          onChange={(e) => updateCondition(rule.id, { value: parseInt(e.target.value, 10) || 0 })}
          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
          min={questionType === 'nps' ? 0 : 1}
          max={questionType === 'nps' ? 10 : 5}
        />
      );
    }

    // For multiple choice with is_any_of/is_none_of, show multi-select
    if (questionType === 'multiple_choice' && ['is_any_of', 'is_none_of'].includes(rule.condition.operator)) {
      const selectedValues = Array.isArray(rule.condition.value) ? rule.condition.value : [];
      return (
        <div className="flex flex-wrap gap-2">
          {choices.map((choice, idx) => (
            <label key={idx} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedValues.includes(choice)}
                onChange={(e) => {
                  const newValues = e.target.checked
                    ? [...selectedValues, choice]
                    : selectedValues.filter((v: string) => v !== choice);
                  updateCondition(rule.id, { value: newValues });
                }}
                className="rounded"
              />
              {choice}
            </label>
          ))}
        </div>
      );
    }

    // For multiple choice with equals/not_equals, show dropdown
    if (questionType === 'multiple_choice') {
      return (
        <select
          value={rule.condition.value || ''}
          onChange={(e) => updateCondition(rule.id, { value: e.target.value })}
          className="px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="">Select an option</option>
          {choices.map((choice, idx) => (
            <option key={idx} value={choice}>{choice}</option>
          ))}
        </select>
      );
    }

    // For text questions, show text input
    return (
      <input
        type="text"
        value={rule.condition.value || ''}
        onChange={(e) => updateCondition(rule.id, { value: e.target.value })}
        placeholder="Enter value..."
        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
      />
    );
  };

  if (availableTargets.length === 0) {
    return (
      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
        Add more questions to enable skip logic.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rules.length === 0 ? (
        <p className="text-sm text-gray-500">No logic rules defined. Add a rule to control survey flow.</p>
      ) : (
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div key={rule.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-medium text-gray-500">Rule {index + 1}</span>
                <button
                  onClick={() => removeRule(rule.id)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </div>

              <div className="space-y-3">
                {/* Condition */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-600">If answer</span>
                  <select
                    value={rule.condition.operator}
                    onChange={(e) => updateCondition(rule.id, { 
                      operator: e.target.value as LogicOperator,
                      value: needsValue(e.target.value as LogicOperator) ? rule.condition.value : undefined
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    {availableOperators.map((op) => (
                      <option key={op} value={op}>{operatorLabels[op]}</option>
                    ))}
                  </select>
                  {renderValueInput(rule)}
                </div>

                {/* Action */}
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-600">Then</span>
                  <select
                    value={rule.action.type}
                    onChange={(e) => updateAction(rule.id, { 
                      type: e.target.value as LogicActionType,
                      targetQuestionId: e.target.value === 'end_survey' ? undefined : rule.action.targetQuestionId
                    })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="skip_to">{actionLabels.skip_to}</option>
                    <option value="end_survey">{actionLabels.end_survey}</option>
                  </select>
                  {rule.action.type === 'skip_to' && (
                    <select
                      value={rule.action.targetQuestionId || ''}
                      onChange={(e) => updateAction(rule.id, { targetQuestionId: e.target.value })}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm min-w-[200px]"
                    >
                      <option value="">Select a question</option>
                      {sortedTargets.map((target) => (
                        <option key={target.id} value={target.id}>
                          Q{target.orderIndex + 1}: {target.content.substring(0, 40)}{target.content.length > 40 ? '...' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addRule}
        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Logic Rule
      </button>
    </div>
  );
};

export default LogicRuleEditor;
