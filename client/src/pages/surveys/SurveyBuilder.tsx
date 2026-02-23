import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { surveyService, questionService } from '../../services/survey.service';
import QuestionCard from '../../components/survey/builder/QuestionCard';
import QuestionTypeSelector from '../../components/survey/builder/QuestionTypeSelector';
import LivePreview from '../../components/survey/builder/LivePreview';
import { QuestionType } from '../../types';

const SurveyBuilder: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(true);
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [localTitle, setLocalTitle] = useState('');
    const [localDescription, setLocalDescription] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Fetch survey data
    const { data: survey, isLoading } = useQuery({
        queryKey: ['survey', id],
        queryFn: () => surveyService.get(id!),
        enabled: !!id,
    });

    // Initialize local state when survey loads
    React.useEffect(() => {
        if (survey) {
            setLocalTitle(survey.title);
            setLocalDescription(survey.description || '');
        }
    }, [survey]);

    // Mutations
    const updateSurveyMutation = useMutation({
        mutationFn: (data: any) => surveyService.update(id!, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['survey', id] }),
    });

    const createQuestionMutation = useMutation({
        mutationFn: (data: any) => questionService.create(id!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['survey', id] });
            setShowTypeSelector(false);
        },
    });

    const updateQuestionMutation = useMutation({
        mutationFn: ({ questionId, data }: { questionId: string; data: any }) =>
            questionService.update(questionId, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['survey', id] }),
    });

    const deleteQuestionMutation = useMutation({
        mutationFn: (questionId: string) => questionService.delete(questionId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['survey', id] }),
    });

    const reorderMutation = useMutation({
        mutationFn: (questionIds: string[]) => questionService.reorder(id!, questionIds),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['survey', id] }),
    });

    // Handlers
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const questions = survey?.questions || [];
            const oldIndex = questions.findIndex((q: any) => q.id === active.id);
            const newIndex = questions.findIndex((q: any) => q.id === over.id);
            const newOrder = arrayMove(questions, oldIndex, newIndex);
            reorderMutation.mutate(newOrder.map((q: any) => q.id));
        }
    };

    const handleAddQuestion = (type: QuestionType) => {
        const defaultOptions: Record<string, any> = {
            multiple_choice: { choices: ['Option 1', 'Option 2'] },
            dropdown: { choices: ['Option 1', 'Option 2', 'Option 3'] },
            yes_no: { choices: ['Yes', 'No'] },
            ranking: { choices: ['Item 1', 'Item 2', 'Item 3'] },
            slider: { min: 0, max: 100 },
            image_choice: { choices: ['Image 1', 'Image 2'] },
            date: {},
            file_upload: {},
        };
        createQuestionMutation.mutate({
            type,
            content: '',
            isRequired: false,
            options: defaultOptions[type] || {},
        });
    };

    const handleUpdateQuestion = (questionId: string, data: any) => {
        updateQuestionMutation.mutate({ questionId, data });
    };

    const handleDeleteQuestion = (questionId: string) => {
        if (confirm('Delete this question?')) {
            deleteQuestionMutation.mutate(questionId);
        }
    };

    const handleDuplicateQuestion = (question: any) => {
        createQuestionMutation.mutate({
            type: question.type,
            content: question.content + ' (copy)',
            isRequired: question.is_required,
            options: question.options,
        });
    };

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        if (localTitle !== survey?.title || localDescription !== survey?.description) {
            updateSurveyMutation.mutate({ title: localTitle, description: localDescription });
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Top Navigation */}
            <header className="bg-surface border-b border-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/surveys')}
                            className="text-text-secondary hover:text-text-primary flex items-center gap-1"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span className="hidden sm:inline">Surveys</span>
                        </button>
                        <div className="h-6 w-px bg-border" />
                        <div
                            className="cursor-pointer"
                            onClick={() => setIsEditingTitle(true)}
                        >
                            {isEditingTitle ? (
                                <input
                                    type="text"
                                    value={localTitle}
                                    onChange={(e) => setLocalTitle(e.target.value)}
                                    onBlur={handleTitleBlur}
                                    onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                                    className="text-lg font-semibold bg-transparent border-b border-primary-500 focus:outline-none"
                                    autoFocus
                                />
                            ) : (
                                <h1 className="text-lg font-semibold text-text-primary hover:text-primary-600">
                                    {survey?.title || 'Untitled Survey'}
                                </h1>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Status Badge */}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${survey?.status === 'active'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : survey?.status === 'closed'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                            {survey?.status === 'active' ? '🟢 Active' : survey?.status === 'closed' ? '🔴 Closed' : '📝 Draft'}
                        </span>

                        {/* Activate/Deactivate Button */}
                        {survey?.status === 'draft' && (
                            <button
                                onClick={() => {
                                    if (confirm('Activate this survey? It will become available for responses.')) {
                                        updateSurveyMutation.mutate({ status: 'active' });
                                    }
                                }}
                                disabled={updateSurveyMutation.isPending}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1.5"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Activate
                            </button>
                        )}
                        {survey?.status === 'active' && (
                            <button
                                onClick={() => {
                                    if (confirm('Close this survey? It will stop accepting responses.')) {
                                        updateSurveyMutation.mutate({ status: 'closed' });
                                    }
                                }}
                                disabled={updateSurveyMutation.isPending}
                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-1.5"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Close
                            </button>
                        )}
                        {survey?.status === 'closed' && (
                            <button
                                onClick={() => {
                                    if (confirm('Reactivate this survey?')) {
                                        updateSurveyMutation.mutate({ status: 'active' });
                                    }
                                }}
                                disabled={updateSurveyMutation.isPending}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-1.5"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Reactivate
                            </button>
                        )}

                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors
                ${showPreview
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'bg-background text-text-secondary hover:bg-surface-hover'
                                }
              `}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Preview
                        </button>
                        <button
                            onClick={() => navigate(`/surveys/${id}/distribute`)}
                            className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                        >
                            Distribute
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="grid grid-cols-12 gap-6">
                    {/* Toolbox */}
                    <aside className="col-span-12 lg:col-span-3 hidden lg:block">
                        <div className="sticky top-24">
                            <QuestionTypeSelector
                                onSelect={handleAddQuestion}
                                columns={1}
                                title="Toolbox"
                                className="shadow-soft"
                            />
                        </div>
                    </aside>

                    {/* Builder Panel */}
                    <div className={`col-span-12 ${showPreview ? 'lg:col-span-6' : 'lg:col-span-9'} space-y-4`}>
                        {/* Survey Header Card */}
                        <div className="bg-surface rounded-xl border-2 border-border p-6">
                            <div className="border-l-4 border-primary-500 pl-4">
                                {isEditingTitle ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={localTitle}
                                            onChange={(e) => setLocalTitle(e.target.value)}
                                            className="w-full text-2xl font-bold text-text-primary bg-transparent border-b border-border focus:border-primary-500 focus:outline-none pb-1"
                                            placeholder="Survey Title"
                                        />
                                        <textarea
                                            value={localDescription}
                                            onChange={(e) => setLocalDescription(e.target.value)}
                                            onBlur={handleTitleBlur}
                                            className="w-full text-text-secondary bg-transparent border-b border-border focus:border-primary-500 focus:outline-none resize-none"
                                            placeholder="Survey description (optional)"
                                            rows={2}
                                        />
                                    </div>
                                ) : (
                                    <div onClick={() => setIsEditingTitle(true)} className="cursor-pointer">
                                        <h2 className="text-2xl font-bold text-text-primary hover:text-primary-600">
                                            {survey?.title || 'Untitled Survey'}
                                        </h2>
                                        <p className="text-text-muted mt-1">
                                            {survey?.description || 'Click to add a description...'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Questions List */}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext
                                items={survey?.questions?.map((q: any) => q.id) || []}
                                strategy={verticalListSortingStrategy}
                            >
                                {survey?.questions?.map((question: any) => (
                                    <QuestionCard
                                        key={question.id}
                                        question={question}
                                        isActive={activeQuestionId === question.id}
                                        onActivate={() => setActiveQuestionId(question.id)}
                                        onDeactivate={() => setActiveQuestionId(null)}
                                        onUpdate={(data) => handleUpdateQuestion(question.id, data)}
                                        onDelete={() => handleDeleteQuestion(question.id)}
                                        onDuplicate={() => handleDuplicateQuestion(question)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>

                        {/* Empty State */}
                        {(!survey?.questions || survey.questions.length === 0) && (
                            <div className="bg-surface rounded-xl border-2 border-dashed border-border p-12 text-center">
                                <img
                                    src="/images/survey-builder-illustration.png"
                                    alt="Start Building"
                                    className="w-48 h-auto mx-auto mb-6 opacity-90"
                                />
                                <h3 className="text-lg font-medium text-text-primary mb-1">No questions yet</h3>
                                <p className="text-text-secondary mb-6">Get started by adding your first question to build your survey.</p>
                                <button
                                    onClick={() => setShowTypeSelector(true)}
                                    className="btn-primary"
                                >
                                    Add Question
                                </button>
                            </div>
                        )}

                        {/* Add Question Button (Mobile) */}
                        {survey?.questions && survey.questions.length > 0 && (
                            <div className="flex justify-center lg:hidden">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowTypeSelector(!showTypeSelector)}
                                        className="px-6 py-3 bg-surface border-2 border-dashed border-border rounded-xl text-text-secondary font-medium hover:border-primary-400 hover:text-primary-600 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Question
                                    </button>

                                    {/* Type Selector Dropdown */}
                                    {showTypeSelector && (
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10">
                                            <QuestionTypeSelector onSelect={handleAddQuestion} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Floating Type Selector for Empty State (Mobile) */}
                        {showTypeSelector && (!survey?.questions || survey.questions.length === 0) && (
                            <div className="flex justify-center lg:hidden">
                                <QuestionTypeSelector onSelect={handleAddQuestion} />
                            </div>
                        )}
                    </div>

                    {/* Preview Panel */}
                    {showPreview && (
                        <aside className="col-span-12 lg:col-span-3">
                            <div className="sticky top-24 h-[calc(100vh-8rem)]">
                                <div className="bg-background rounded-xl border border-border h-full p-4 overflow-auto">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-medium text-text-muted">Live Preview</h3>
                                        <div className="flex gap-1">
                                            <button className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">Desktop</button>
                                            <button className="px-2 py-1 text-xs text-text-muted hover:bg-surface-hover rounded">Mobile</button>
                                        </div>
                                    </div>
                                    <LivePreview survey={survey || null} />
                                </div>
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SurveyBuilder;

