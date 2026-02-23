import React from 'react';
import { QuestionType } from '../../../types';

interface QuestionTypeSelectorProps {
    onSelect: (type: QuestionType) => void;
}

const questionTypes: { type: QuestionType; icon: string; label: string; description: string }[] = [
    // Text
    { type: 'text_short', icon: '📝', label: 'Short Text', description: 'Single-line text answer' },
    { type: 'text_long', icon: '📄', label: 'Long Text', description: 'Multi-line paragraph answer' },
    // Choice
    { type: 'multiple_choice', icon: '☑️', label: 'Multiple Choice', description: 'Select from options' },
    { type: 'dropdown', icon: '📋', label: 'Dropdown', description: 'Select from a dropdown list' },
    { type: 'yes_no', icon: '✅', label: 'Yes / No', description: 'Simple binary choice' },
    { type: 'image_choice', icon: '🖼️', label: 'Image Choice', description: 'Pick from images' },
    // Scale
    { type: 'nps', icon: '📊', label: 'NPS (0-10)', description: 'Net Promoter Score scale' },
    { type: 'rating_scale', icon: '⭐', label: 'Rating Scale', description: 'Star or number rating' },
    { type: 'slider', icon: '🎚️', label: 'Slider', description: 'Drag to select a value' },
    // Advanced
    { type: 'matrix', icon: '🔢', label: 'Matrix', description: 'Grid of questions' },
    { type: 'ranking', icon: '🏆', label: 'Ranking', description: 'Drag to rank choices' },
    { type: 'date', icon: '📅', label: 'Date', description: 'Pick a date' },
    { type: 'file_upload', icon: '📎', label: 'File Upload', description: 'Upload a file' },
];

const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({ onSelect }) => {
    return (
        <div className="bg-surface rounded-xl shadow-lg border border-border p-4 w-[420px]">
            <h3 className="text-sm font-medium text-text-muted mb-3">Add Question</h3>
            <div className="grid grid-cols-2 gap-2">
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
