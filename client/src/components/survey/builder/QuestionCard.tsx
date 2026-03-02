import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { QuestionType, LogicRule, QuestionOptions } from '../../../types';
import LogicRuleEditor from '../LogicRuleEditor';

interface QuestionCardProps {
    question: {
        id: string;
        type: QuestionType;
        content: string;
        is_required: boolean;
        options?: QuestionOptions;
    };
    isActive: boolean;
    onActivate: () => void;
    onDeactivate: () => void;
    onUpdate: (data: any) => void;
    onDelete: () => void;
    onDuplicate: () => void;
    availableTargets?: Array<{ id: string; content: string; orderIndex: number }>;
}

const QuestionTypeIcons: Record<QuestionType, { icon: string; label: string; color: string }> = {
    nps: { icon: '📊', label: 'NPS (0-10)', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    multiple_choice: { icon: '☑️', label: 'Multiple Choice', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    text_short: { icon: '📝', label: 'Short Text', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    text_long: { icon: '📄', label: 'Long Text', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
    rating_scale: { icon: '⭐', label: 'Rating Scale', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    matrix: { icon: '🔢', label: 'Matrix', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
    yes_no: { icon: '✅', label: 'Yes / No', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    dropdown: { icon: '📋', label: 'Dropdown', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
    date: { icon: '📅', label: 'Date', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    file_upload: { icon: '📎', label: 'File Upload', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    ranking: { icon: '🏆', label: 'Ranking', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    slider: { icon: '🎚️', label: 'Slider', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
    image_choice: { icon: '🖼️', label: 'Image Choice', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
    checkbox: { icon: '☑️', label: 'Checkboxes', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    boolean: { icon: '👍', label: 'Boolean', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    image_picker: { icon: '🖼️', label: 'Image Picker', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
    signature_pad: { icon: '✍️', label: 'Signature', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    html: { icon: '🌐', label: 'HTML', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
    expression: { icon: '🧮', label: 'Expression', color: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-300' },
    comment: { icon: '💬', label: 'Comment', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
    panel_dynamic: { icon: '🔁', label: 'Dynamic Panel', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
    matrix_dropdown: { icon: '🔠', label: 'Matrix Dropdown', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
    matrix_dynamic: { icon: '🔀', label: 'Matrix Dynamic', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
    multiselect_dropdown: { icon: '🗂️', label: 'Multi-Select', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300' },
    multiple_textboxes: { icon: '📑', label: 'Multiple Textboxes', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
    panel: { icon: '🗃️', label: 'Panel', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
    image: { icon: '🖼️', label: 'Image', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' }
};

const hasChoices = (type: QuestionType) =>
    ['multiple_choice', 'dropdown', 'yes_no', 'ranking', 'image_choice', 'checkbox', 'image_picker', 'multiselect_dropdown'].includes(type);

const supportsLogicRules = (type: QuestionType) =>
    ['nps', 'multiple_choice', 'rating_scale', 'text_short', 'text_long', 'matrix', 'checkbox', 'dropdown', 'slider'].includes(type);

const QuestionCard: React.FC<QuestionCardProps> = ({
    question,
    isActive,
    onActivate,
    onDeactivate,
    onUpdate,
    onDelete,
    onDuplicate,
    availableTargets = [],
}) => {
    const [localContent, setLocalContent] = useState(question.content || '');
    const [localRequired, setLocalRequired] = useState(question.is_required);
    const [localChoices, setLocalChoices] = useState<string[]>(question.options?.choices || []);
    const [localCorrectAnswers, setLocalCorrectAnswers] = useState<any[]>(question.options?.correctAnswers || []);
    const [localQuizMode, setLocalQuizMode] = useState<boolean>(!!(question.options?.correctAnswers && question.options.correctAnswers.length > 0));
    const [localLogicRules, setLocalLogicRules] = useState<LogicRule[]>(question.options?.logicRules || []);
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

    useEffect(() => {
        setLocalContent(question.content || '');
        setLocalRequired(question.is_required);
        setLocalChoices(question.options?.choices || []);
        setLocalCorrectAnswers(question.options?.correctAnswers || []);
        setLocalQuizMode(!!(question.options?.correctAnswers && question.options.correctAnswers.length > 0));
        setLocalLogicRules(question.options?.logicRules || []);
    }, [question.id]);

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
    }, [isActive, localContent, localRequired, localChoices, localLogicRules, localCorrectAnswers, localQuizMode]);

    const handleSave = () => {
        const sanitizedContent = (localContent || '').trim() || 'Untitled question';
        if (sanitizedContent !== localContent) {
            setLocalContent(sanitizedContent);
        }
        const nextOptions: Record<string, any> = { ...(question.options || {}) };
        if (hasChoices(question.type)) {
            nextOptions.choices = localChoices;
            if (localQuizMode) {
                nextOptions.correctAnswers = localCorrectAnswers;
            } else {
                delete nextOptions.correctAnswers;
            }
        }
        if (localLogicRules.length > 0) {
            nextOptions.logicRules = localLogicRules;
        } else if ('logicRules' in nextOptions) {
            delete nextOptions.logicRules;
        }
        onUpdate({
            content: sanitizedContent,
            isRequired: localRequired,
            options: nextOptions,
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
        const oldValue = newChoices[index];
        newChoices[index] = value;
        setLocalChoices(newChoices);

        // Update correct answer if the choice text was changed and it was marked as correct
        if (localCorrectAnswers.includes(oldValue)) {
            setLocalCorrectAnswers(localCorrectAnswers.map(ans => ans === oldValue ? value : ans));
        }
    };

    const toggleCorrectAnswer = (value: string) => {
        if (question.type === 'multiple_choice' || question.type === 'dropdown' || question.type === 'yes_no') {
            setLocalCorrectAnswers([value]);
        } else {
            if (localCorrectAnswers.includes(value)) {
                setLocalCorrectAnswers(localCorrectAnswers.filter(a => a !== value));
            } else {
                setLocalCorrectAnswers([...localCorrectAnswers, value]);
            }
        }
    };

    return (
        <div
            ref={(node) => {
                setNodeRef(node);
                (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }}
            style={style}
            className={`
        bg-surface rounded-xl border-2 transition-all duration-200 mb-4
        ${isActive
                    ? 'border-primary-500 shadow-lg ring-2 ring-primary-100 dark:ring-primary-900/40'
                    : 'border-border hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md cursor-pointer'
                }
        ${isDragging ? 'shadow-2xl scale-[1.02]' : ''}
      `}
            onClick={() => !isActive && onActivate()}
        >
            {/* Header with drag handle */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <button
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary p-1"
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
                {question.options?.logicRules && question.options.logicRules.length > 0 && (
                    <span className="text-xs font-medium text-purple-600">🔀 Has Logic</span>
                )}
                <div className="flex-1" />
                {isActive && (
                    <div className="flex items-center gap-2">
                        <select
                            value={question.type}
                            onChange={(e) => { e.stopPropagation(); onUpdate({ type: e.target.value as QuestionType }); }}
                            className="bg-background border border-border text-xs rounded-md px-2 py-1 text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-500 max-w-[120px]"
                            title="Switch Question Type"
                        >
                            {Object.entries(QuestionTypeIcons).map(([type, info]) => (
                                <option key={type} value={type}>
                                    {info.label}
                                </option>
                            ))}
                        </select>
                        <div className="w-px h-4 bg-border mx-1" />
                        <button
                            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-background rounded"
                            title="Duplicate"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
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
                        {/* Question Text / HTML Content */}
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1">
                                {question.type === 'html' ? 'HTML Editor (Raw)' : 'Question'}
                            </label>
                            {question.type === 'html' ? (
                                <textarea
                                    value={question.options?.html || localContent}
                                    onChange={(e) => onUpdate({ options: { ...question.options, html: e.target.value } })}
                                    className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none font-mono text-sm text-text-primary"
                                    rows={4}
                                    placeholder="<h2>Your HTML here...</h2>"
                                    autoFocus
                                />
                            ) : (
                                <textarea
                                    value={localContent}
                                    onChange={(e) => setLocalContent(e.target.value)}
                                    className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-text-primary"
                                    rows={2}
                                    placeholder="Enter your question..."
                                    autoFocus
                                />
                            )}
                        </div>

                        {/* Short Text Preview */}
                        {question.type === 'text_short' && (
                            <div className="bg-background rounded-lg p-3 border border-border/50">
                                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Short Answer Preview</p>
                                <input type="text" disabled className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-muted cursor-not-allowed opacity-70" placeholder="Respondent text will go here..." />
                            </div>
                        )}

                        {/* Long Text Preview */}
                        {question.type === 'text_long' && (
                            <div className="bg-background rounded-lg p-3 border border-border/50">
                                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Paragraph Preview</p>
                                <textarea disabled className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-muted resize-none cursor-not-allowed opacity-70" rows={3} placeholder="Respondent long answer will go here..."></textarea>
                            </div>
                        )}

                        {/* Choice-based Options (multiple_choice, dropdown, yes_no, ranking, image_choice) */}
                        {hasChoices(question.type) && (
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-text-secondary">Choices</label>
                                    <label className="flex items-center gap-2 cursor-pointer bg-surface border border-border px-3 py-1 rounded-full shadow-sm hover:border-primary-300 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={localQuizMode}
                                            onChange={(e) => setLocalQuizMode(e.target.checked)}
                                            className="w-3.5 h-3.5 rounded border-border text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="text-xs font-medium text-text-secondary">Quiz Mode (Correct Answers)</span>
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    {localChoices.map((choice, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            {localQuizMode && (
                                                <button
                                                    onClick={() => toggleCorrectAnswer(choice)}
                                                    className={`p-1 rounded-full transition-colors mr-1 flex-shrink-0 ${localCorrectAnswers.includes(choice) ? 'text-green-500 bg-green-50 shadow-sm border border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'text-text-muted opacity-50 hover:opacity-100 hover:text-green-500'}`}
                                                    title="Mark as correct answer"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                </button>
                                            )}
                                            <span className="text-text-muted flex items-center justify-center w-6 opacity-60">
                                                {question.type === 'ranking' ? `${index + 1}.` : question.type === 'checkbox' ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /></svg> : question.type === 'dropdown' ? `${index + 1}.` : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /></svg>}
                                            </span>
                                            <input
                                                type="text"
                                                value={choice}
                                                onChange={(e) => handleChoiceChange(index, e.target.value)}
                                                className="flex-1 px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-text-primary"
                                                placeholder={`Choice ${index + 1}`}
                                            />
                                            {localChoices.length > 1 && (
                                                <button
                                                    onClick={() => handleRemoveChoice(index)}
                                                    className="p-1.5 text-text-muted hover:text-red-500"
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
                            <div className="bg-background rounded-lg p-4">
                                <p className="text-sm text-text-secondary mb-2">NPS Scale Preview:</p>
                                <div className="flex gap-1">
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                        <div
                                            key={n}
                                            className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium
                        ${n <= 6 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : n <= 8 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}
                      `}
                                        >
                                            {n}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs text-text-muted mt-1">
                                    <span>Not likely</span>
                                    <span>Very likely</span>
                                </div>
                            </div>
                        )}

                        {/* Slider Preview */}
                        {question.type === 'slider' && (
                            <div className="bg-background rounded-lg p-4">
                                <p className="text-sm text-text-secondary mb-2">Slider Preview:</p>
                                <input type="range" min={question.options?.min ?? 0} max={question.options?.max ?? 100} disabled className="w-full" />
                                <div className="flex justify-between text-xs text-text-muted mt-1">
                                    <span>{question.options?.min ?? 0}</span>
                                    <span>{question.options?.max ?? 100}</span>
                                </div>
                            </div>
                        )}

                        {/* Date Preview */}
                        {question.type === 'date' && (
                            <div className="bg-background rounded-lg p-4">
                                <p className="text-sm text-text-secondary mb-2">Date Input Preview:</p>
                                <input type="date" disabled className="px-3 py-2 border border-border rounded-lg bg-surface text-text-primary" />
                            </div>
                        )}

                        {/* File Upload Preview */}
                        {question.type === 'file_upload' && (
                            <div className="bg-background rounded-lg p-4 text-center border-2 border-dashed border-border">
                                <p className="text-text-muted text-sm">📎 Drag & drop or click to upload</p>
                            </div>
                        )}

                        {/* Skip Logic Section */}
                        {supportsLogicRules(question.type) && (
                            <div className="border-t border-border pt-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-text-primary">Skip Logic (Optional)</h3>
                                    <span className="text-xs text-text-muted">Control survey flow based on answers</span>
                                </div>
                                <LogicRuleEditor
                                    questionType={question.type}
                                    questionOptions={{ choices: localChoices }}
                                    availableTargets={availableTargets.filter((t) => t.id !== question.id)}
                                    rules={localLogicRules}
                                    onRulesChange={setLocalLogicRules}
                                />
                            </div>
                        )}

                        {/* Required Toggle */}
                        {!['html', 'panel', 'panel_dynamic'].includes(question.type) ? (
                            <div className="flex items-center justify-between pt-2 border-t border-border mt-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localRequired}
                                        onChange={(e) => setLocalRequired(e.target.checked)}
                                        className="w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-text-secondary">Required question</span>
                                </label>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleSave(); onDeactivate(); }}
                                    className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between pt-2 border-t border-border mt-4">
                                <span className="text-xs text-text-muted flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Explanatory block / Section structural element
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleSave(); onDeactivate(); }}
                                    className="px-4 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    question.type === 'html' ? (
                        <div
                            className="prose prose-sm dark:prose-invert max-w-none pointer-events-none"
                            dangerouslySetInnerHTML={{ __html: question.options?.html || question.content || '<em class="text-text-muted">Empty HTML Block</em>' }}
                        />
                    ) : (
                        <p className="text-text-primary font-medium">
                            {question.content || <span className="text-text-muted italic">Untitled question</span>}
                        </p>
                    )
                )}
            </div>
        </div>
    );
};

export default QuestionCard;
