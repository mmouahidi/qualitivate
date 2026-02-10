import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { surveyService, questionService } from '../../services/survey.service';
import templateService from '../../services/template.service';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SurveyPreviewModal from '../../components/survey/SurveyPreviewModal';
import LogicRuleEditor from '../../components/survey/LogicRuleEditor';
import { QuestionType, LogicRule, QuestionOptions } from '../../types';
import { DashboardLayout } from '../../components/layout';

const QuestionTypes = [
  { value: 'nps', label: 'NPS (0-10 Scale)' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'text_short', label: 'Short Text' },
  { value: 'text_long', label: 'Long Text' },
  { value: 'rating_scale', label: 'Rating Scale' },
  { value: 'matrix', label: 'Matrix' }
];

interface SortableQuestionProps {
  question: any;
  onEdit: (q: any) => void;
  onDelete: (id: string) => void;
}

const SortableQuestion: React.FC<SortableQuestionProps> = ({ question, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-surface border border-border rounded-soft p-4 mb-3 hover:shadow-soft-sm transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <button {...attributes} {...listeners} className="cursor-move text-text-muted hover:text-text-secondary">
              ☰
            </button>
            <span className="text-xs font-medium text-text-secondary uppercase">{question.type.replace('_', ' ')}</span>
            {question.is_required && <span className="badge-danger">Required</span>}
            {question.options?.logicRules?.length > 0 && (
              <span className="badge-purple">🔀 Has Logic</span>
            )}
          </div>
          <p className="text-text-primary">{question.content}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(question)} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Edit
          </button>
          <button onClick={() => onDelete(question.id)} className="text-red-600 hover:text-red-700 text-sm font-medium">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const SurveyEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaveAsTemplateOpen, setIsSaveAsTemplateOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    description: '',
    category: '',
    isGlobal: false
  });
  const [surveySettings, setSurveySettings] = useState({
    welcomeMessage: '',
    thankYouTitle: '',
    thankYouMessage: ''
  });
  const [questionForm, setQuestionForm] = useState<{
    type: string;
    content: string;
    isRequired: boolean;
    options: QuestionOptions;
  }>({
    type: 'text_short',
    content: '',
    isRequired: false,
    options: { choices: [''], logicRules: [] }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: survey } = useQuery({
    queryKey: ['survey', id],
    queryFn: () => surveyService.get(id!)
  });

  // Load survey settings when survey data loads
  React.useEffect(() => {
    if (survey?.settings) {
      setSurveySettings({
        welcomeMessage: survey.settings.welcomeMessage || '',
        thankYouTitle: survey.settings.thankYouTitle || '',
        thankYouMessage: survey.settings.thankYouMessage || ''
      });
    }
  }, [survey]);

  const updateSurveyMutation = useMutation({
    mutationFn: (data: any) => surveyService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      setIsSettingsOpen(false);
      alert('Survey settings saved!');
    }
  });

  const createQuestionMutation = useMutation({
    mutationFn: (data: any) => questionService.create(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      setIsAddingQuestion(false);
      setQuestionForm({ type: 'text_short', content: '', isRequired: false, options: { choices: [''] } });
    }
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ questionId, data }: any) => questionService.update(questionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
      setEditingQuestion(null);
    }
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: questionService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
    }
  });

  const reorderMutation = useMutation({
    mutationFn: (questionIds: string[]) => questionService.reorder(id!, questionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey', id] });
    }
  });

  const saveAsTemplateMutation = useMutation({
    mutationFn: (data: any) => templateService.saveAsTemplate(id!, data),
    onSuccess: () => {
      setIsSaveAsTemplateOpen(false);
      setTemplateFormData({ name: '', description: '', category: '', isGlobal: false });
      alert('Survey saved as template successfully!');
    }
  });

  const handleSaveAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    saveAsTemplateMutation.mutate(templateFormData);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSurveyMutation.mutate({
      settings: surveySettings
    });
  };

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

  const handleSaveQuestion = () => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({
        questionId: editingQuestion.id,
        data: questionForm
      });
    } else {
      createQuestionMutation.mutate(questionForm);
    }
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    setQuestionForm({
      type: question.type,
      content: question.content || '',
      isRequired: question.is_required || false,
      options: question.options || { choices: [''] }
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <button onClick={() => navigate('/surveys')} className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-1">
            ← Back to Surveys
          </button>
          <div className="flex justify-between items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">{survey?.title}</h1>
              <p className="text-text-secondary mt-1">{survey?.description}</p>
            </div>
            <div className="flex gap-2">
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
                className="btn-secondary text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save as Template
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="btn-secondary text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
            </div>
          </div>
        </div>

        <div className="card-soft mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Questions</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="btn-secondary"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
              <button
                onClick={() => setIsAddingQuestion(true)}
                className="btn-primary"
              >
                Add Question
              </button>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={survey?.questions?.map((q: any) => q.id) || []} strategy={verticalListSortingStrategy}>
              {survey?.questions?.map((question: any) => (
                <SortableQuestion
                  key={question.id}
                  question={question}
                  onEdit={handleEditQuestion}
                  onDelete={(qid) => {
                    if (confirm('Delete this question?')) deleteQuestionMutation.mutate(qid);
                  }}
                />
              ))}
            </SortableContext>
          </DndContext>

          {survey?.questions?.length === 0 && (
            <div className="text-center py-12 text-text-secondary">
              No questions yet. Click "Add Question" to get started.
            </div>
          )}
        </div>

        {(isAddingQuestion || editingQuestion) && (
          <div className="modal-overlay">
            <div className="bg-surface rounded-soft-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-soft-lg">
              <h2 className="text-xl font-bold text-text-primary mb-4">{editingQuestion ? 'Edit Question' : 'Add Question'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="label-soft">Question Type</label>
                  <select
                    value={questionForm.type}
                    onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })}
                    className="select-soft"
                  >
                    {QuestionTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-soft">Question Text</label>
                  <textarea
                    value={questionForm.content}
                    onChange={(e) => setQuestionForm({ ...questionForm, content: e.target.value })}
                    rows={3}
                    className="textarea-soft"
                    placeholder="Enter your question..."
                  />
                </div>
                {questionForm.type === 'multiple_choice' && (
                  <div>
                    <label className="label-soft">Choices</label>
                    {(questionForm.options.choices || []).map((choice: string, index: number) => (
                      <input
                        key={index}
                        type="text"
                        value={choice}
                        onChange={(e) => {
                          const newChoices = [...(questionForm.options.choices || [])];
                          newChoices[index] = e.target.value;
                          setQuestionForm({ ...questionForm, options: { ...questionForm.options, choices: newChoices } });
                        }}
                        className="input-soft mb-2"
                        placeholder={`Choice ${index + 1}`}
                      />
                    ))}
                    <button
                      onClick={() => setQuestionForm({
                        ...questionForm,
                        options: { ...questionForm.options, choices: [...(questionForm.options.choices || []), ''] }
                      })}
                      className="text-primary-600 text-sm font-medium hover:text-primary-700"
                    >
                      + Add Choice
                    </button>
                  </div>
                )}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={questionForm.isRequired}
                    onChange={(e) => setQuestionForm({ ...questionForm, isRequired: e.target.checked })}
                    className="mr-2 rounded border-border text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-text-secondary">Required question</span>
                </label>

                {/* Skip Logic Section */}
                {['nps', 'multiple_choice', 'rating_scale', 'text_short', 'text_long'].includes(questionForm.type) && (
                  <div className="border-t border-border pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-text-primary">Skip Logic (Optional)</h3>
                      <span className="text-xs text-text-muted">Control survey flow based on answers</span>
                    </div>
                    <LogicRuleEditor
                      questionType={questionForm.type as QuestionType}
                      questionOptions={questionForm.options}
                      availableTargets={(survey?.questions || [])
                        .filter((q: any) => q.id !== editingQuestion?.id)
                        .map((q: any) => ({
                          id: q.id,
                          content: q.content,
                          orderIndex: q.order_index || q.orderIndex || 0
                        }))}
                      rules={questionForm.options?.logicRules || []}
                      onRulesChange={(rules: LogicRule[]) => setQuestionForm({
                        ...questionForm,
                        options: { ...questionForm.options, logicRules: rules }
                      })}
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsAddingQuestion(false);
                    setEditingQuestion(null);
                    setQuestionForm({ type: 'text_short', content: '', isRequired: false, options: { choices: [''] } });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuestion}
                  disabled={!questionForm.content}
                  className="btn-primary"
                >
                  {editingQuestion ? 'Update' : 'Add'} Question
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Survey Preview Modal */}
        {survey && (
          <SurveyPreviewModal
            survey={survey}
            isOpen={isPreviewOpen}
            onClose={() => setIsPreviewOpen(false)}
          />
        )}

        {/* Save as Template Modal */}
        {isSaveAsTemplateOpen && (
          <div className="modal-overlay">
            <div className="bg-surface rounded-soft-lg p-6 w-full max-w-md shadow-soft-lg">
              <h2 className="text-xl font-bold text-text-primary mb-4">Save as Template</h2>
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
                <div className="flex justify-end space-x-3 mt-6">
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
          <div className="modal-overlay">
            <div className="bg-surface rounded-soft-lg p-6 w-full max-w-lg shadow-soft-lg">
              <h2 className="text-xl font-bold text-text-primary mb-4">Survey Settings</h2>
              <p className="text-sm text-text-secondary mb-4">Customize the welcome and thank you messages respondents will see.</p>
              <form onSubmit={handleSaveSettings}>
                <div className="mb-4">
                  <label className="label-soft">Welcome Message (Optional)</label>
                  <textarea
                    value={surveySettings.welcomeMessage}
                    onChange={(e) => setSurveySettings({ ...surveySettings, welcomeMessage: e.target.value })}
                    rows={3}
                    className="textarea-soft"
                    placeholder="Custom message shown on the welcome screen before respondents start the survey..."
                  />
                  <p className="text-xs text-text-muted mt-1">Leave blank to show the survey description</p>
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
                <div className="flex justify-end space-x-3 mt-6">
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
      </div>
    </DashboardLayout>
  );
};

export default SurveyEditor;
