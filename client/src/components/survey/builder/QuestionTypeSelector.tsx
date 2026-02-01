import React from 'react';
import { QuestionType } from '../../../types';

interface QuestionTypeSelectorProps {
    onSelect: (type: QuestionType) => void;
}

const questionTypes: { type: QuestionType; icon: string; label: string; description: string }[] = [
    { type: 'text_short', icon: '📝', label: 'Short Text', description: 'Single-line text answer' },
    { type: 'text_long', icon: '📄', label: 'Long Text', description: 'Multi-line paragraph answer' },
    { type: 'multiple_choice', icon: '☑️', label: 'Multiple Choice', description: 'Select from options' },
    { type: 'nps', icon: '📊', label: 'NPS (0-10)', description: 'Net Promoter Score scale' },
    { type: 'rating_scale', icon: '⭐', label: 'Rating Scale', description: 'Star or number rating' },
    { type: 'matrix', icon: '📋', label: 'Matrix', description: 'Grid of questions' },
];

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({ onSelect }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Add Question</h3>
            <div className="grid grid-cols-2 gap-2">
                {questionTypes.map((item) => (
                    <button
                        key={item.type}
                        onClick={() => onSelect(item.type)}
                        className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all text-left group"
                    >
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                            <p className="text-sm font-medium text-gray-900 group-hover:text-primary-700">{item.label}</p>
                            <p className="text-xs text-gray-500">{item.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuestionTypeSelector;
