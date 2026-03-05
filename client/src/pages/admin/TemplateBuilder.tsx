import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import templateService from '../../services/template.service';
import { companyService } from '../../services/organization.service';
import { useAuth } from '../../contexts/AuthContext';
import QuestionCard from '../../components/survey/builder/QuestionCard';
import EnhancedToolbox from '../../components/survey/builder/EnhancedToolbox';
import ConfigurationPanel from '../../components/survey/builder/ConfigurationPanel';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { QuestionType, ExtendedQuestionType } from '../../types';

const ALL_ROLES = [
    { value: 'company_admin', label: 'Company Admin' },
    { value: 'site_admin', label: 'Site Admin' },
    { value: 'department_admin', label: 'Department Admin' },
    { value: 'employee', label: 'Employee' },
];

const TemplateBuilder: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();

    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [toolboxCollapsed, setToolboxCollapsed] = useState(false);
    const [configCollapsed, setConfigCollapsed] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [localTitle, setLocalTitle] = useState('');
    const [localDescription, setLocalDescription] = useState('');
    const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
    const [showSettingsPanel, setShowSettingsPanel] = useState(false);

    const isSuperAdmin = currentUser?.role === 'super_admin';

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Fetch template data
    const { data: template, isLoading } = useQuery({
        queryKey: ['template', id],
        queryFn: () => templateService.get(id!),
        enabled: !!id,
    });

    const { data: companiesData } = useQuery({
        queryKey: ['companies-all'],
        queryFn: () => companyService.listAll(),
        enabled: isSuperAdmin,
    });

    const allCompanies = companiesData?.data || [];

    React.useEffect(() => {
        if (template) {
            setLocalTitle(template.name);
            setLocalDescription(template.description || '');
        }
    }, [template]);

    // Mutations
    const updateTemplateMutation = useMutation({
        mutationFn: (data: any) => templateService.update(id!, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['template', id] }),
    });

    const createQuestionMutation = useMutation({
        mutationFn: (data: any) => templateService.addQuestion(id!, data),
        onSuccess: (question) => {
            queryClient.invalidateQueries({ queryKey: ['template', id] });
            if (question?.id) {
                setActiveQuestionId(question.id);
            }
        },
    });

    const updateQuestionMutation = useMutation({
        mutationFn: ({ questionId, data }: { questionId: string; data: any }) =>
            templateService.updateQuestion(id!, questionId, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['template', id] }),
    });

    const deleteQuestionMutation = useMutation({
        mutationFn: (questionId: string) => templateService.deleteQuestion(id!, questionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['template', id] });
            setQuestionToDelete(null);
        },
    });

    const reorderMutation = useMutation({
        mutationFn: (questionIds: string[]) => templateService.reorderQuestions(id!, questionIds),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['template', id] }),
    });

    // Handlers
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const questions = template?.questions || [];
            const oldIndex = questions.findIndex((q: any) => q.id === active.id);
            const newIndex = questions.findIndex((q: any) => q.id === over.id);
            const newOrder = arrayMove(questions, oldIndex, newIndex);
            reorderMutation.mutate(newOrder.map((q: any) => q.id));
        }
    };

    const handleAddQuestion = (type: ExtendedQuestionType, defaultOptions?: Record<string, any>) => {
        const defaultOptionsMap: Record<string, any> = {
            multiple_choice: { choices: ['Option 1', 'Option 2'] },
            rating_scale: { min: 1, max: 5 },
            matrix: { rows: ['Row 1', 'Row 2'], columns: ['Column 1', 'Column 2'] },
            checkbox: { choices: ['Option 1', 'Option 2', 'Option 3'] },
            dropdown: { choices: ['Option 1', 'Option 2', 'Option 3'] },
            multiselect_dropdown: { choices: ['Option 1', 'Option 2', 'Option 3'] },
            boolean: { labelTrue: 'Yes', labelFalse: 'No' },
            slider: { min: 0, max: 100, step: 1 },
            ranking: { choices: ['Item 1', 'Item 2', 'Item 3'] },
            ...defaultOptions,
        };
        const defaultContentMap: Record<string, string> = {
            text_short: 'Short answer question',
            text_long: 'Long answer question',
            multiple_choice: 'Multiple choice question',
            nps: 'How likely are you to recommend us to a friend?',
            rating_scale: 'Please rate your experience',
            matrix: 'Please rate each item',
            yes_no: 'Yes or No question',
            dropdown: 'Select from the dropdown',
            date: 'Select a date',
            file_upload: 'Upload a file',
            ranking: 'Rank the following items',
            slider: 'Slide to select a value',
            image_choice: 'Select an image',
            checkbox: 'Select all that apply',
            boolean: 'Yes or No',
            multiselect_dropdown: 'Select multiple options',
            html: 'HTML Content',
            expression: 'Calculated Field',
            image: 'Image',
            signature_pad: 'Please sign below',
            panel: 'Panel',
            panel_dynamic: 'Dynamic Panel',
            matrix_dropdown: 'Matrix with dropdowns',
            matrix_dynamic: 'Dynamic Matrix',
            multiple_textboxes: 'Multiple text fields',
            image_picker: 'Select an image',
        };
        createQuestionMutation.mutate({
            type: type as QuestionType,
            content: defaultContentMap[type] || 'New question',
            isRequired: false,
            options: defaultOptions || defaultOptionsMap[type] || {},
        });
    };

    const handleUpdateQuestion = (questionId: string, data: any) => {
        updateQuestionMutation.mutate({ questionId, data });
    };

    const handleDeleteQuestion = (questionId: string) => {
        setQuestionToDelete(questionId);
    };

    const handleDuplicateQuestion = (question: any) => {
        createQuestionMutation.mutate({
            type: question.type,
            content: question.content + ' (copy)',
            isRequired: question.isRequired ?? question.is_required ?? false,
            options: question.options,
        });
    };

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        if (localTitle !== template?.name || localDescription !== template?.description) {
            updateTemplateMutation.mutate({ name: localTitle, description: localDescription });
        }
    };

    const handleTargetingUpdate = (targetCompanies: string[], targetRoles: string[]) => {
        updateTemplateMutation.mutate({ targetCompanies, targetRoles });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    const availableTargets = (template?.questions || []).map((q: any, index: number) => ({
        id: q.id,
        content: q.content || `Question ${index + 1}`,
        orderIndex: q.order_index ?? q.orderIndex ?? index
    }));

    const selectedQuestion = activeQuestionId
        ? template?.questions?.find((q: any) => q.id === activeQuestionId)
        : null;

    const handleConfigPanelUpdate = (updates: Record<string, any>) => {
        if (activeQuestionId) {
            handleUpdateQuestion(activeQuestionId, updates);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header */}
            <header className="flex-shrink-0 bg-surface border-b border-border">
                <div className="flex items-center justify-between px-4 h-14">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/templates')}
                            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
                            title="Back to Templates"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>

                        <div className="cursor-pointer" onClick={() => setIsEditingTitle(true)}>
                            {isEditingTitle ? (
                                <input
                                    type="text"
                                    value={localTitle}
                                    onChange={(e) => setLocalTitle(e.target.value)}
                                    onBlur={handleTitleBlur}
                                    onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                                    className="text-sm font-semibold bg-transparent border-b border-primary-500 focus:outline-none"
                                    autoFocus
                                />
                            ) : (
                                <span className="text-sm font-semibold text-text-primary hover:text-primary-600 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                    </svg>
                                    {template?.name || 'Untitled Template'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Settings button (super_admin + global template) */}
                    {isSuperAdmin && template?.isGlobal && (
                        <button
                            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
                            className={`p-2 rounded transition-colors ${
                                showSettingsPanel
                                    ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/30'
                                    : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
                            }`}
                            title="Template Targeting Settings"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    )}
                </div>
            </header>

            {/* Targeting Settings Panel */}
            {showSettingsPanel && isSuperAdmin && template?.isGlobal && (
                <TargetingPanel
                    targetCompanies={template.targetCompanies || []}
                    targetRoles={template.targetRoles || []}
                    companies={allCompanies}
                    onSave={handleTargetingUpdate}
                    onClose={() => setShowSettingsPanel(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Toolbox */}
                <EnhancedToolbox
                    onSelect={handleAddQuestion}
                    collapsed={toolboxCollapsed}
                    onToggleCollapse={() => setToolboxCollapsed(!toolboxCollapsed)}
                    className="flex-shrink-0 h-full border-r border-border"
                />

                {/* Designer Canvas */}
                <div className="flex-1 overflow-auto bg-background p-6">
                    <div className="max-w-4xl mx-auto space-y-4">
                        {/* Title Card */}
                        <div className="bg-surface rounded-xl border-2 border-border p-6">
                            <div className="border-l-4 border-primary-500 pl-4">
                                {isEditingTitle ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={localTitle}
                                            onChange={(e) => setLocalTitle(e.target.value)}
                                            className="w-full text-2xl font-bold text-text-primary bg-transparent border-b border-border focus:border-primary-500 focus:outline-none pb-1"
                                            placeholder="Template Name"
                                        />
                                        <textarea
                                            value={localDescription}
                                            onChange={(e) => setLocalDescription(e.target.value)}
                                            onBlur={handleTitleBlur}
                                            className="w-full text-text-secondary bg-transparent border-b border-border focus:border-primary-500 focus:outline-none resize-none"
                                            placeholder="Template description (optional)"
                                            rows={2}
                                        />
                                    </div>
                                ) : (
                                    <div onClick={() => setIsEditingTitle(true)} className="cursor-pointer">
                                        <h2 className="text-2xl font-bold text-text-primary hover:text-primary-600">
                                            {template?.name || 'Untitled Template'}
                                        </h2>
                                        <p className="text-text-muted mt-1">
                                            {template?.description || 'Click to add a description...'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Questions List */}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext
                                items={template?.questions?.map((q: any) => q.id) || []}
                                strategy={verticalListSortingStrategy}
                            >
                                {template?.questions?.map((question: any) => (
                                    <QuestionCard
                                        key={question.id}
                                        question={question}
                                        isActive={activeQuestionId === question.id}
                                        onActivate={() => setActiveQuestionId(question.id)}
                                        onDeactivate={() => setActiveQuestionId(null)}
                                        onUpdate={(data) => handleUpdateQuestion(question.id, data)}
                                        onDelete={() => handleDeleteQuestion(question.id)}
                                        onDuplicate={() => handleDuplicateQuestion(question)}
                                        availableTargets={availableTargets}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {/* Empty State */}
                        {(!template?.questions || template.questions.length === 0) && (
                            <div className="bg-surface rounded-xl border-2 border-dashed border-border p-12 text-center mt-8">
                                <div className="w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                                    <svg className="w-32 h-32 text-text-muted/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                        <line x1="3" y1="9" x2="21" y2="9" />
                                        <line x1="9" y1="21" x2="9" y2="9" />
                                        <circle cx="15" cy="15" r="2" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-text-primary mb-2">Your template is empty</h3>
                                <p className="text-text-secondary mb-6">Drag an element from the toolbox to start building your template.</p>
                                <button
                                    onClick={() => handleAddQuestion('text_short')}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                                >
                                    Add Question
                                    <span className="text-primary-200">⋯</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Configuration Panel */}
                <ConfigurationPanel
                    question={selectedQuestion}
                    onUpdate={handleConfigPanelUpdate}
                    collapsed={configCollapsed}
                    onToggleCollapse={() => setConfigCollapsed(!configCollapsed)}
                    className="flex-shrink-0 h-full border-l border-border"
                />
            </main>

            {/* Delete Question Confirmation Modal */}
            <ConfirmModal
                isOpen={!!questionToDelete}
                onClose={() => setQuestionToDelete(null)}
                onConfirm={() => {
                    if (questionToDelete) {
                        deleteQuestionMutation.mutate(questionToDelete);
                    }
                }}
                title="Delete Question"
                message="Are you sure you want to delete this question? This action cannot be undone."
                confirmLabel="Delete Question"
                cancelLabel="Cancel"
                variant="danger"
                icon="delete"
                isLoading={deleteQuestionMutation.isPending}
            />
        </div>
    );
};

// Inline targeting panel for the template builder
const TargetingPanel: React.FC<{
    targetCompanies: string[];
    targetRoles: string[];
    companies: Array<{ id: string; name: string }>;
    onSave: (companies: string[], roles: string[]) => void;
    onClose: () => void;
}> = ({ targetCompanies, targetRoles, companies, onSave, onClose }) => {
    const [localCompanies, setLocalCompanies] = useState<string[]>(targetCompanies);
    const [localRoles, setLocalRoles] = useState<string[]>(targetRoles);

    React.useEffect(() => {
        setLocalCompanies(targetCompanies);
        setLocalRoles(targetRoles);
    }, [targetCompanies, targetRoles]);

    const toggleCompany = (id: string) => {
        setLocalCompanies(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };

    const toggleRole = (role: string) => {
        setLocalRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
    };

    const hasChanges =
        JSON.stringify(localCompanies.sort()) !== JSON.stringify([...targetCompanies].sort()) ||
        JSON.stringify(localRoles.sort()) !== JSON.stringify([...targetRoles].sort());

    return (
        <div className="flex-shrink-0 bg-surface border-b border-border px-4 py-3">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Template Targeting
                    </h3>
                    <div className="flex items-center gap-2">
                        {hasChanges && (
                            <button
                                onClick={() => { onSave(localCompanies, localRoles); onClose(); }}
                                className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                            >
                                Save Changes
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1 text-text-muted hover:text-text-primary rounded transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <p className="text-xs text-text-muted mb-3">
                    Leave empty to make available to all companies and roles.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Companies */}
                    <div>
                        <label className="text-xs font-medium text-text-secondary mb-1 block">Target Companies</label>
                        <div className="max-h-32 overflow-y-auto border border-border rounded-lg p-1.5 space-y-0.5">
                            {companies.length === 0 ? (
                                <p className="text-xs text-text-muted p-1">No companies</p>
                            ) : (
                                companies.map(company => (
                                    <label key={company.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface-hover cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={localCompanies.includes(company.id)}
                                            onChange={() => toggleCompany(company.id)}
                                            className="checkbox-soft"
                                        />
                                        <span className="text-xs text-text-primary truncate">{company.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                        {localCompanies.length > 0 && (
                            <p className="text-xs text-primary-600 mt-1">
                                {localCompanies.length} selected
                            </p>
                        )}
                    </div>
                    {/* Roles */}
                    <div>
                        <label className="text-xs font-medium text-text-secondary mb-1 block">Target User Roles</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {ALL_ROLES.map(role => {
                                const selected = localRoles.includes(role.value);
                                return (
                                    <button
                                        key={role.value}
                                        type="button"
                                        onClick={() => toggleRole(role.value)}
                                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                            selected
                                                ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                                                : 'border-border text-text-secondary hover:border-primary-300'
                                        }`}
                                    >
                                        {role.label}
                                    </button>
                                );
                            })}
                        </div>
                        {localRoles.length > 0 && (
                            <p className="text-xs text-primary-600 mt-1">
                                {localRoles.length} selected
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateBuilder;
