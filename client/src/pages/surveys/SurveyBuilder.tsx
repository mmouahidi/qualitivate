import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { surveyService, questionService } from '../../services/survey.service';
import { companyService } from '../../services/organization.service';
import templateService from '../../services/template.service';
import QuestionCard from '../../components/survey/builder/QuestionCard';
import SurveyBuilderLayout from '../../components/survey/builder/SurveyBuilderLayout';
import LivePreview from '../../components/survey/builder/LivePreview';
import LogicRuleEditor from '../../components/survey/LogicRuleEditor';
import { QuestionType, ExtendedQuestionType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const SurveyBuilder: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';
    const canSaveTemplate = user?.role === 'super_admin' || user?.role === 'company_admin';

    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(true);
    const [showTypeSelector, setShowTypeSelector] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [localTitle, setLocalTitle] = useState('');
    const [localDescription, setLocalDescription] = useState('');
    const [isSaveAsTemplateOpen, setIsSaveAsTemplateOpen] = useState(false);
    const [templateFormData, setTemplateFormData] = useState({
        name: '',
        description: '',
        category: '',
        isGlobal: false
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [surveySettings, setSurveySettings] = useState({
        welcomeMessage: '',
        thankYouTitle: '',
        thankYouMessage: ''
    });
    const [localIsAnonymous, setLocalIsAnonymous] = useState(false);
    const [localIsPublic, setLocalIsPublic] = useState(false);
    const [localCompanyId, setLocalCompanyId] = useState('');

    // Fetch companies for targeting (super_admin only)
    const { data: companiesData } = useQuery({
        queryKey: ['companies-list'],
        queryFn: () => companyService.listAll(),
        enabled: isSuperAdmin,
    });

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

    React.useEffect(() => {
        if (survey?.settings) {
            setSurveySettings({
                welcomeMessage: survey.settings.welcomeMessage || '',
                thankYouTitle: survey.settings.thankYouTitle || '',
                thankYouMessage: survey.settings.thankYouMessage || ''
            });
        }
        if (survey) {
            setLocalIsAnonymous(survey.isAnonymous ?? false);
            setLocalIsPublic(survey.isPublic ?? false);
            setLocalCompanyId(survey.companyId || '');
        }
    }, [survey?.settings, survey?.isAnonymous, survey?.isPublic, survey?.companyId]);

    // Mutations
    const updateSurveyMutation = useMutation({
        mutationFn: (data: any) => surveyService.update(id!, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['survey', id] }),
    });

    const saveAsTemplateMutation = useMutation({
        mutationFn: (data: any) => templateService.saveAsTemplate(id!, data),
        onSuccess: () => {
            setIsSaveAsTemplateOpen(false);
            setTemplateFormData({ name: '', description: '', category: '', isGlobal: false });
            alert('Survey saved as template successfully!');
        }
    });

    const createQuestionMutation = useMutation({
        mutationFn: (data: any) => questionService.create(id!, data),
        onSuccess: (question) => {
            queryClient.invalidateQueries({ queryKey: ['survey', id] });
            setShowTypeSelector(false);
            if (question?.id) {
                setActiveQuestionId(question.id);
            }
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
        if (confirm('Delete this question?')) {
            deleteQuestionMutation.mutate(questionId);
        }
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
        if (localTitle !== survey?.title || localDescription !== survey?.description) {
            updateSurveyMutation.mutate({ title: localTitle, description: localDescription });
        }
    };

    const handleSaveSettings = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: any = {
            settings: surveySettings,
            isAnonymous: localIsAnonymous,
            isPublic: localIsPublic,
        };
        if (isSuperAdmin) {
            payload.companyId = localCompanyId || null;
        }
        updateSurveyMutation.mutate(
            payload,
            {
                onSuccess: () => {
                    setIsSettingsOpen(false);
                    alert('Survey settings saved!');
                }
            }
        );
    };

    const handleSaveAsTemplate = (e: React.FormEvent) => {
        e.preventDefault();
        saveAsTemplateMutation.mutate(templateFormData);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    const availableTargets = (survey?.questions || []).map((q: any, index: number) => ({
        id: q.id,
        content: q.content || `Question ${index + 1}`,
        orderIndex: q.order_index ?? q.orderIndex ?? index
    }));

    // Get selected question for configuration panel
    const selectedQuestion = activeQuestionId
        ? survey?.questions?.find((q: any) => q.id === activeQuestionId)
        : null;

    // Handler for question updates from configuration panel
    const handleConfigPanelUpdate = (updates: Record<string, any>) => {
        if (activeQuestionId) {
            handleUpdateQuestion(activeQuestionId, updates);
        }
    };

    // Designer content (canvas area)
    const designerContent = (
        <div className="p-6 space-y-4">
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
                            availableTargets={availableTargets}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            {/* Empty State */}
            {(!survey?.questions || survey.questions.length === 0) && (
                <div className="bg-surface rounded-xl border-2 border-dashed border-border p-12 text-center">
                    <div className="w-48 h-48 mx-auto mb-6 flex items-center justify-center">
                        <svg className="w-32 h-32 text-text-muted/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <line x1="3" y1="9" x2="21" y2="9" />
                            <line x1="9" y1="21" x2="9" y2="9" />
                            <circle cx="15" cy="15" r="2" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2">Your form is empty</h3>
                    <p className="text-text-secondary mb-6">Drag an element from the toolbox or click the button below.</p>
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
    );

    // Preview content
    const previewContent = <LivePreview survey={survey || null} />;

    // Logic content
    const logicContent = (
        <div className="max-w-4xl mx-auto">
            <div className="bg-surface rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold text-text-primary mb-4">Survey Logic Rules</h2>
                {selectedQuestion ? (
                    <LogicRuleEditor
                        questionType={selectedQuestion.type}
                        questionOptions={selectedQuestion.options}
                        availableTargets={availableTargets}
                        rules={selectedQuestion.options?.logicRules || []}
                        onRulesChange={(rules) => handleUpdateQuestion(selectedQuestion.id, {
                            options: { ...selectedQuestion.options, logicRules: rules }
                        })}
                    />
                ) : (
                    <p className="text-text-muted">Select a question in the Designer tab to configure its logic rules.</p>
                )}
            </div>
        </div>
    );

    // Header actions
    const headerActions = (
        <>
            {/* Back button */}
            <button
                onClick={() => navigate('/surveys')}
                className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
                title="Back to Surveys"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>

            {/* Title */}
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
                    <span className="text-sm font-semibold text-text-primary hover:text-primary-600">
                        {survey?.title || 'Untitled Survey'}
                    </span>
                )}
            </div>

            {/* Status Badge */}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${survey?.status === 'active'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : survey?.status === 'closed'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                {survey?.status === 'active' ? 'Active' : survey?.status === 'closed' ? 'Closed' : 'Draft'}
            </span>

            <div className="w-px h-6 bg-border" />

            {/* Save as Template */}
            {canSaveTemplate && (
                <button
                    onClick={() => {
                        setTemplateFormData({
                            name: `${survey?.title || ''} Template`,
                            description: survey?.description || '',
                            category: '',
                            isGlobal: false
                        });
                        setIsSaveAsTemplateOpen(true);
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
                >
                    Save as Template
                </button>
            )}

            {/* Activate/Close buttons */}
            {survey?.status === 'draft' && (
                <button
                    onClick={() => {
                        if (confirm('Activate this survey?')) {
                            updateSurveyMutation.mutate({ status: 'active' });
                        }
                    }}
                    disabled={updateSurveyMutation.isPending}
                    className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                >
                    Activate
                </button>
            )}
            {survey?.status === 'active' && (
                <button
                    onClick={() => {
                        if (confirm('Close this survey?')) {
                            updateSurveyMutation.mutate({ status: 'closed' });
                        }
                    }}
                    disabled={updateSurveyMutation.isPending}
                    className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                >
                    Close
                </button>
            )}

            {/* Distribute button */}
            <button
                onClick={() => navigate(`/surveys/${id}/distribute`)}
                className="px-4 py-1.5 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700"
            >
                Distribute
            </button>
        </>
    );

    return (
        <>
            <SurveyBuilderLayout
                survey={survey}
                selectedQuestion={selectedQuestion}
                onAddQuestion={handleAddQuestion}
                onUpdateQuestion={handleConfigPanelUpdate}
                onUpdateSurvey={(updates) => updateSurveyMutation.mutate(updates)}
                onOpenSettings={() => setIsSettingsOpen(true)}
                designerContent={designerContent}
                previewContent={previewContent}
                logicContent={logicContent}
                headerActions={headerActions}
            />

            {/* Save as Template Modal */}
            {isSaveAsTemplateOpen && (
                <div className="modal-overlay" onClick={() => setIsSaveAsTemplateOpen(false)}>
                    <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Save as Template</h2>
                        <form onSubmit={handleSaveAsTemplate}>
                            <div className="mb-4">
                                <label className="label-soft">Template Name</label>
                                <input
                                    type="text"
                                    required
                                    value={templateFormData.name}
                                    onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                                    className="input-soft"
                                    placeholder="My Survey Template"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label-soft">Description</label>
                                <textarea
                                    value={templateFormData.description}
                                    onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                                    rows={3}
                                    className="textarea-soft"
                                    placeholder="Describe this template..."
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label-soft">Category</label>
                                <select
                                    value={templateFormData.category}
                                    onChange={(e) => setTemplateFormData({ ...templateFormData, category: e.target.value })}
                                    className="select-soft"
                                >
                                    <option value="">Select a category</option>
                                    <option value="NPS">NPS</option>
                                    <option value="Customer Satisfaction">Customer Satisfaction</option>
                                    <option value="Employee Feedback">Employee Feedback</option>
                                    <option value="Product Feedback">Product Feedback</option>
                                    <option value="Event Feedback">Event Feedback</option>
                                    <option value="Market Research">Market Research</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            {isSuperAdmin && (
                                <label className="flex items-center gap-2 cursor-pointer mb-4">
                                    <input
                                        type="checkbox"
                                        checked={templateFormData.isGlobal}
                                        onChange={(e) => setTemplateFormData({ ...templateFormData, isGlobal: e.target.checked })}
                                        className="checkbox-soft"
                                    />
                                    <span className="text-sm text-text-secondary">Global template</span>
                                </label>
                            )}
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsSaveAsTemplateOpen(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saveAsTemplateMutation.isPending}
                                    className="btn-primary"
                                >
                                    {saveAsTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Survey Settings Modal */}
            {isSettingsOpen && (
                <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)}>
                    <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Survey Settings</h2>
                        <p className="text-sm text-text-secondary mb-4">
                            Configure survey behavior, targeting, and messages.
                        </p>
                        <form onSubmit={handleSaveSettings}>
                            {/* Survey Behavior */}
                            <div className="mb-6 p-4 bg-surface rounded-lg border border-border">
                                <h3 className="text-sm font-semibold text-text-primary mb-3">Survey Behavior</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={localIsAnonymous}
                                            onChange={(e) => setLocalIsAnonymous(e.target.checked)}
                                            className="checkbox-soft"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-text-primary">Anonymous responses</span>
                                            <p className="text-xs text-text-muted">Respondent identity will not be recorded</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={localIsPublic}
                                            onChange={(e) => setLocalIsPublic(e.target.checked)}
                                            className="checkbox-soft"
                                        />
                                        <div>
                                            <span className="text-sm font-medium text-text-primary">Public survey</span>
                                            <p className="text-xs text-text-muted">Anyone with the link can respond (no login required)</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Targeting (super_admin only) */}
                            {isSuperAdmin && (
                                <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
                                    <h3 className="text-sm font-semibold text-primary-700 dark:text-primary-300 mb-3">Target Audience</h3>
                                    <select
                                        value={localCompanyId}
                                        onChange={(e) => setLocalCompanyId(e.target.value)}
                                        className="select-soft"
                                    >
                                        <option value="">🌐 General (All Users)</option>
                                        {companiesData?.data?.map((company: any) => (
                                            <option key={company.id} value={company.id}>🏢 {company.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                                        {localCompanyId ? 'Only users in this company can see the survey' : 'All users can see this survey'}
                                    </p>
                                </div>
                            )}

                            {/* Messages */}
                            <div className="mb-4">
                                <label className="label-soft">Welcome Message (Optional)</label>
                                <textarea
                                    value={surveySettings.welcomeMessage}
                                    onChange={(e) => setSurveySettings({ ...surveySettings, welcomeMessage: e.target.value })}
                                    rows={3}
                                    className="textarea-soft"
                                    placeholder="Custom message shown before respondents start..."
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label-soft">Thank You Title</label>
                                <input
                                    type="text"
                                    value={surveySettings.thankYouTitle}
                                    onChange={(e) => setSurveySettings({ ...surveySettings, thankYouTitle: e.target.value })}
                                    className="input-soft"
                                    placeholder="Thank You!"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="label-soft">Thank You Message</label>
                                <textarea
                                    value={surveySettings.thankYouMessage}
                                    onChange={(e) => setSurveySettings({ ...surveySettings, thankYouMessage: e.target.value })}
                                    rows={3}
                                    className="textarea-soft"
                                    placeholder="Your response has been submitted successfully."
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateSurveyMutation.isPending}
                                    className="btn-primary"
                                >
                                    {updateSurveyMutation.isPending ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default SurveyBuilder;

