import React from 'react';
import { QuestionType } from '../../../types';

interface QuestionTypeSelectorProps {
    onSelect: (type: QuestionType) => void;
    className?: string;
    columns?: 1 | 2;
    title?: string;
}

const questionTypes: { type: QuestionType; icon: string; label: string; description: string }[] = [
    // Text
    { type: 'text_short', icon: '📝', label: 'Short Text', description: 'Single-line text answer' },
    { type: 'text_long', icon: '📄', label: 'Long Text', description: 'Multi-line paragraph answer' },
    // Choice
    { type: 'multiple_choice', icon: '☑️', label: 'Multiple Choice', description: 'Select from options' },
    // Scale
    { type: 'nps', icon: '📊', label: 'NPS (0-10)', description: 'Net Promoter Score scale' },
    { type: 'rating_scale', icon: '⭐', label: 'Rating Scale', description: 'Star or number rating' },
    // Advanced
    { type: 'matrix', icon: '🔢', label: 'Matrix', description: 'Grid of questions' },
];

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({ onSelect, className = '', columns = 2, title = 'Add Question' }) => {
    return (
        <div className={`bg-surface rounded-xl shadow-lg border border-border p-4 w-full ${className}`}>
            <h3 className="text-sm font-medium text-text-muted mb-3">{title}</h3>
            <div className={`grid gap-2 ${columns === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                {questionTypes.map((item) => (
                    <button
                        key={item.type}
                        onClick={() => onSelect(item.type)}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all text-left group"
                    >
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                            <p className="text-sm font-medium text-text-primary group-hover:text-primary-700 dark:group-hover:text-primary-400">{item.label}</p>
                            <p className="text-xs text-text-muted">{item.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuestionTypeSelector;
