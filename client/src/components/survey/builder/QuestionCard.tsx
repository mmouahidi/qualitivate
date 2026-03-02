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

    const renderPreview = () => {
        const type = question.type;
        const opts = question.options || {};

        switch (type) {
            case 'text_short':
                return <input type="text" disabled className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-muted cursor-not-allowed opacity-70" placeholder="Short answer text..." />;

            case 'text_long':
                return <textarea disabled className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-muted resize-none cursor-not-allowed opacity-70" rows={3} placeholder="Long paragraph text..."></textarea>;

            case 'multiple_textboxes':
                const items = opts.items || [{ title: 'Item 1' }, { title: 'Item 2' }];
                return (
                    <div className="space-y-2">
                        {items.slice(0, 3).map((item: any, i: number) => (
                            <div key={i} className="flex flex-col gap-1">
                                <span className="text-xs text-text-secondary">{item.title || `Item ${i + 1}`}</span>
                                <input type="text" disabled className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-muted cursor-not-allowed opacity-70" placeholder="Short answer..." />
                            </div>
                        ))}
                        {items.length > 3 && <div className="text-xs text-text-muted italic">...and {items.length - 3} more</div>}
                    </div>
                );

            case 'multiple_choice':
                return (
                    <div className="space-y-2">
                        {(opts.choices || localChoices || ['Option 1', 'Option 2', 'Option 3']).map((c: string, i: number) => (
                            <label key={i} className="flex items-center gap-2 opacity-70">
                                <input type="radio" disabled className="w-4 h-4 text-primary-600" />
                                <span className="text-sm text-text-secondary">{c}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'checkbox':
                return (
                    <div className="space-y-2">
                        {(opts.choices || localChoices || ['Option 1', 'Option 2', 'Option 3']).map((c: string, i: number) => (
                            <label key={i} className="flex items-center gap-2 opacity-70">
                                <input type="checkbox" disabled className="w-4 h-4 rounded text-primary-600" />
                                <span className="text-sm text-text-secondary">{c}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'dropdown':
            case 'multiselect_dropdown':
                return (
                    <div className="relative opacity-70">
                        <select disabled className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-muted appearance-none cursor-not-allowed">
                            <option>Select {type === 'multiselect_dropdown' ? 'options...' : 'an option...'}</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                );

            case 'boolean':
                return (
                    <div className="flex gap-4 opacity-80">
                        <button disabled className="px-6 py-2 border border-border rounded-lg bg-surface text-text-secondary hover:bg-surface-hover transition-colors font-medium cursor-not-allowed">
                            {opts.labelTrue || 'Yes'}
                        </button>
                        <button disabled className="px-6 py-2 border border-border rounded-lg bg-surface text-text-secondary hover:bg-surface-hover transition-colors font-medium cursor-not-allowed">
                            {opts.labelFalse || 'No'}
                        </button>
                    </div>
                );

            case 'image_picker':
                return (
                    <div className="grid grid-cols-3 gap-4 opacity-70">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="aspect-square bg-surface border border-border rounded-lg flex flex-col items-center justify-center text-text-muted">
                                <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <span className="text-xs">Image {i}</span>
                            </div>
                        ))}
                    </div>
                );

            case 'rating_scale':
                const rateType = opts.rateType || 'stars';
                const maxRate = Math.min(opts.rateMax || 5, 10);
                return (
                    <div className="flex gap-2 items-center opacity-80">
                        {Array.from({ length: maxRate }).map((_, i) => (
                            <div key={i} className={`w-10 h-10 flex items-center justify-center rounded-lg ${rateType === 'stars' ? 'text-yellow-400' : 'bg-surface border border-border text-text-secondary'} cursor-not-allowed`}>
                                {rateType === 'stars' ? (
                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                ) : (
                                    <span className="font-medium">{i + 1}</span>
                                )}
                            </div>
                        ))}
                    </div>
                );

            case 'nps':
                return (
                    <div className="flex flex-col gap-2 opacity-80">
                        <div className="flex gap-1 w-full overflow-x-auto pb-2">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                <div key={n} className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded border font-medium cursor-not-allowed
                                    ${n <= 6 ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30' :
                                        n <= 8 ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/10 dark:text-yellow-400 dark:border-yellow-900/30' :
                                            'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30'}`}
                                >
                                    {n}
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-text-muted px-1">
                            <span>Not likely</span>
                            <span>Very likely</span>
                        </div>
                    </div>
                );

            case 'slider':
                return (
                    <div className="py-4 opacity-80">
                        <input type="range" min={opts.min || 0} max={opts.max || 100} disabled className="w-full accent-primary-500 cursor-not-allowed" />
                        <div className="flex justify-between text-xs text-text-muted mt-2">
                            <span>{opts.min || 0}</span>
                            <span>{opts.max || 100}</span>
                        </div>
                    </div>
                );

            case 'ranking':
                return (
                    <div className="space-y-2 opacity-80">
                        {(opts.choices || localChoices || ['Item 1', 'Item 2', 'Item 3']).map((c: string, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-surface border border-border rounded-lg">
                                <svg className="w-5 h-5 text-text-muted opacity-50 cursor-grab" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                <span className="font-medium text-text-secondary w-5 text-center">{i + 1}.</span>
                                <span className="text-sm text-text-primary">{c}</span>
                            </div>
                        ))}
                    </div>
                );

            case 'matrix':
            case 'matrix_dropdown':
            case 'matrix_dynamic':
                const rows = opts.rows || ['Row 1', 'Row 2'];
                const cols = opts.columns || ['Col 1', 'Col 2', 'Col 3'];
                return (
                    <div className="w-full overflow-x-auto opacity-80 border border-border rounded-lg">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-text-muted uppercase bg-surface border-b border-border">
                                <tr>
                                    <th className="px-4 py-3 font-medium"></th>
                                    {cols.map((c: any, i: number) => (
                                        <th key={i} className="px-4 py-3 font-medium text-center">{typeof c === 'object' ? c.title || c.name : c}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r: any, rId: number) => (
                                    <tr key={rId} className="bg-background border-b border-border last:border-b-0">
                                        <th className="px-4 py-3 font-medium text-text-secondary whitespace-nowrap bg-surface/50 border-r border-border">
                                            {typeof r === 'object' ? r.text || r.value : r}
                                        </th>
                                        {cols.map((_, cId: number) => (
                                            <td key={cId} className="px-4 py-3 text-center">
                                                {type === 'matrix_dropdown' ? (
                                                    <select disabled className="w-20 px-1 py-1 text-xs border border-border rounded bg-surface text-text-muted"><option>...</option></select>
                                                ) : (
                                                    <input type={type === 'matrix' ? 'radio' : 'checkbox'} disabled className="w-4 h-4 text-primary-600" />
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {type === 'matrix_dynamic' && (
                            <div className="p-3 bg-surface/30 border-t border-border flex justify-center">
                                <button disabled className="text-xs font-medium text-primary-600 border border-primary-200 bg-primary-50 px-3 py-1.5 rounded-md flex items-center gap-1">
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> Add Row
                                </button>
                            </div>
                        )}
                    </div>
                );

            case 'expression':
                return (
                    <div className="flex items-center gap-3 p-3 bg-fuchsia-50 dark:bg-fuchsia-900/10 border border-fuchsia-200 dark:border-fuchsia-900/30 rounded-lg opacity-80">
                        <span className="font-mono font-bold text-fuchsia-600 dark:text-fuchsia-400">fx</span>
                        <div className="flex-1 font-mono text-sm text-text-muted bg-background px-3 py-1.5 rounded border border-border">
                            {opts.expression || 'computed_value = (empty)'}
                        </div>
                    </div>
                );

            case 'image':
                return (
                    <div className="w-full flex justify-center py-4 opacity-80">
                        <div className="w-64 h-32 bg-surface border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-text-muted">
                            <svg className="w-6 h-6 mb-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                            <span className="text-xs mt-2">Static Image Display</span>
                        </div>
                    </div>
                );

            case 'signature_pad':
                return (
                    <div className="w-full max-w-[400px] h-[200px] bg-surface border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-text-muted opacity-80">
                        <svg className="w-10 h-10 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        <span className="text-sm font-medium">Draw Signature Here</span>
                        <div className="w-64 border-b-2 border-border mt-8"></div>
                    </div>
                );

            case 'file_upload':
                return (
                    <div className="w-full p-8 bg-surface border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-text-muted opacity-80 cursor-not-allowed">
                        <svg className="w-10 h-10 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <span className="text-sm font-medium text-text-secondary mb-1">Drag & drop files here</span>
                        <span className="text-xs">or click to browse {opts.maxSize ? `(Max: ${opts.maxSize / (1024 * 1024)}MB)` : ''}</span>
                    </div>
                );

            case 'panel':
            case 'panel_dynamic':
                return (
                    <div className="border border-border rounded-lg bg-surface/50 p-4 opacity-80">
                        <div className="border border-dashed border-border bg-background rounded p-6 flex items-center justify-center text-text-muted">
                            <span className="text-sm font-medium flex items-center gap-2">
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
                                {type === 'panel_dynamic' ? 'Dynamic Repeating Array Block' : 'Grouped Questions Panel'}
                            </span>
                        </div>
                    </div>
                );

            case 'date':
                return <input type="date" disabled className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text-muted cursor-not-allowed opacity-70" />;

            default:
                return <div className="p-3 border border-dashed border-border rounded text-text-muted text-sm italic opacity-50">Preview not available for {type}</div>;
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
                                {question.type === 'html' ? 'Title' : 'Question'}
                            </label>
                            <textarea
                                value={localContent}
                                onChange={(e) => setLocalContent(e.target.value)}
                                className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-text-primary"
                                rows={2}
                                placeholder={question.type === 'html' ? "Enter section title..." : "Enter your question..."}
                                autoFocus
                            />
                        </div>

                        {question.type === 'html' && (
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-1 mt-4">
                                    Description / Policy Text
                                </label>
                                <textarea
                                    value={question.options?.description || ''}
                                    onChange={(e) => onUpdate({ options: { ...question.options, description: e.target.value } })}
                                    className="w-full px-3 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none text-text-primary"
                                    rows={4}
                                    placeholder="Enter instructions, descriptions, or policy details..."
                                />
                            </div>
                        )}

                        {/* Shared Unified Tool Preview Layer */}
                        <div className="mt-4 mb-2 pointer-events-none">
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Build Preview</p>
                            {renderPreview()}
                        </div>

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
                    <div className="pointer-events-none">
                        {['html', 'panel', 'panel_dynamic'].includes(question.type) ? (
                            <div className="mb-4">
                                {question.content && <h2 className="text-lg font-bold text-text-primary mb-2">{question.content}</h2>}
                                {question.options?.description && <p className="text-text-secondary whitespace-pre-wrap">{question.options.description}</p>}
                                {question.type === 'html' && !question.content && !question.options?.description && (
                                    <em className="text-text-muted">Empty HTML/Informational Block</em>
                                )}
                            </div>
                        ) : (
                            <p className="text-text-primary font-medium mb-4 flex items-start gap-2">
                                <span className="text-text-muted text-sm mt-0.5">
                                    {(question as any).order_index !== undefined ? (question as any).order_index + 1 : Number(question.id.split('-').pop()) || 1}.
                                </span>
                                <span>{question.content || <span className="text-text-muted italic">Untitled question</span>}</span>
                            </p>
                        )}

                        {/* Always show the beautiful preview even when inactive */}
                        {(!['html'].includes(question.type)) && (
                            <div className="pointer-events-none w-full">
                                {renderPreview()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionCard;
