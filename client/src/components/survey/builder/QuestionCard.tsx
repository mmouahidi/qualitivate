import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuestionType } from '../../../types';

interface QuestionCardProps {
    question: {
        id: string;
        type: QuestionType;
        content: string;
        is_required: boolean;
        options?: {
            choices?: string[];
            min?: number;
            max?: number;
        };
    };
    isActive: boolean;
    onActivate: () => void;
    onDeactivate: () => void;
    onUpdate: (data: any) => void;
    onDelete: () => void;
    onDuplicate: () => void;
}

const QuestionTypeIcons: Record<QuestionType, { icon: string; label: string; color: string }> = {
    nps: { icon: '📊', label: 'NPS (0-10)', color: 'bg-blue-100 text-blue-700' },
    multiple_choice: { icon: '☑️', label: 'Multiple Choice', color: 'bg-green-100 text-green-700' },
    text_short: { icon: '📝', label: 'Short Text', color: 'bg-purple-100 text-purple-700' },
    text_long: { icon: '📄', label: 'Long Text', color: 'bg-indigo-100 text-indigo-700' },
    rating_scale: { icon: '⭐', label: 'Rating Scale', color: 'bg-yellow-100 text-yellow-700' },
    matrix: { icon: '📋', label: 'Matrix', color: 'bg-pink-100 text-pink-700' },
};

const QuestionCard: React.FC<QuestionCardProps> = ({
    question,
    isActive,
    onActivate,
    onDeactivate,
    onUpdate,
    onDelete,
    onDuplicate,
}) => {
    const [localContent, setLocalContent] = useState(question.content);
    const [localRequired, setLocalRequired] = useState(question.is_required);
    const [localChoices, setLocalChoices] = useState<string[]>(question.options?.choices || []);
    const cardRef = useRef<HTMLDivElement>(null);

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: question.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const typeInfo = QuestionTypeIcons[question.type] || QuestionTypeIcons.text_short;

    // Handle click outside to save and deactivate
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isActive && cardRef.current && !cardRef.current.contains(event.target as Node)) {
                handleSave();
                onDeactivate();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isActive, localContent, localRequired, localChoices]);

    const handleSave = () => {
        onUpdate({
            content: localContent,
            isRequired: localRequired,
            options: { ...question.options, choices: localChoices },
        });
    };

    const handleAddChoice = () => {
        setLocalChoices([...localChoices, '']);
    };

    const handleRemoveChoice = (index: number) => {
        setLocalChoices(localChoices.filter((_, i) => i !== index));
    };

    const handleChoiceChange = (index: number, value: string) => {
        const newChoices = [...localChoices];
        newChoices[index] = value;
        setLocalChoices(newChoices);
    };

    return (
        <div
            ref={(node) => {
                setNodeRef(node);
                (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }}
            style={style}
            className={`
        bg-white rounded-xl border-2 transition-all duration-200 mb-4
        ${isActive
                    ? 'border-primary-500 shadow-lg ring-2 ring-primary-100'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md cursor-pointer'
                }
        ${isDragging ? 'shadow-2xl scale-[1.02]' : ''}
      `}
            onClick={() => !isActive && onActivate()}
        >
            {/* Header with drag handle */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                    </svg>
                </button>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${typeInfo.color}`}>
                    {typeInfo.icon} {typeInfo.label}
                </span>
                {question.is_required && (
                    <span className="text-xs font-medium text-red-500">* Required</span>
                )}
                <div className="flex-1" />
                {isActive && (
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                            title="Duplicate"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Delete"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-4 py-4">
                {isActive ? (
                    <div className="space-y-4">
                        {/* Question Text */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                            <textarea
                                value={localContent}
                                onChange={(e) => setLocalContent(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                                rows={2}
                                placeholder="Enter your question..."
                                autoFocus
                            />
                        </div>

                        {/* Multiple Choice Options */}
                        {question.type === 'multiple_choice' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Choices</label>
                                <div className="space-y-2">
                                    {localChoices.map((choice, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <span className="text-gray-400">○</span>
                                            <input
                                                type="text"
                                                value={choice}
                                                onChange={(e) => handleChoiceChange(index, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                                placeholder={`Choice ${index + 1}`}
                                            />
                                            {localChoices.length > 1 && (
                                                <button
                                                    onClick={() => handleRemoveChoice(index)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleAddChoice}
                                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add choice
                                </button>
                            </div>
                        )}

                        {/* NPS Preview */}
                        {question.type === 'nps' && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-sm text-gray-600 mb-2">NPS Scale Preview:</p>
                                <div className="flex gap-1">
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                        <div
                                            key={n}
                                            className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium
                        ${n <= 6 ? 'bg-red-100 text-red-700' : n <= 8 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}
                      `}
                                        >
                                            {n}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>Not likely</span>
                                    <span>Very likely</span>
                                </div>
                            </div>
                        )}

                        {/* Required Toggle */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localRequired}
                                    onChange={(e) => setLocalRequired(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">Required question</span>
                            </label>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSave(); onDeactivate(); }}
                                className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-900 font-medium">
                        {question.content || <span className="text-gray-400 italic">Untitled question</span>}
                    </p>
                )}
            </div>
        </div>
    );
};

export default QuestionCard;
