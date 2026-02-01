import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import templateService, { Template, CreateTemplateData } from '../../services/template.service';
import { DashboardLayout } from '../../components/layout';

const Templates: React.FC = () => {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState<CreateTemplateData>({
        name: '',
        description: '',
        category: '',
        type: 'custom',
        isGlobal: false,
        isAnonymous: true
    });
    const [error, setError] = useState<string | null>(null);

    const { data: templates, isLoading } = useQuery({
        queryKey: ['templates', selectedCategory],
        queryFn: () => templateService.list({
            category: selectedCategory || undefined,
            includeGlobal: true
        })
    });

    const { data: categories } = useQuery({
        queryKey: ['template-categories'],
        queryFn: () => templateService.getCategories()
    });

    const createMutation = useMutation({
        mutationFn: templateService.create,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            setIsCreateModalOpen(false);
            setFormData({
                name: '',
                description: '',
                category: '',
                type: 'custom',
                isGlobal: false,
                isAnonymous: true
            });
            setError(null);
            // Navigate to edit the template to add questions
            navigate(`/templates/${data.id}/edit`);
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to create template');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: templateService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['templates'] });
            setError(null);
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to delete template');
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this template?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleCreateSurvey = async (templateId: string) => {
        try {
            const survey = await templateService.createSurveyFromTemplate(templateId, {});
            navigate(`/surveys/${survey.id}/edit`);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create survey from template');
        }
    };

    const getCategoryBadgeClass = (category?: string) => {
        switch (category?.toLowerCase()) {
            case 'employee engagement': return 'badge-primary';
            case 'customer satisfaction': return 'badge-success';
            case 'product feedback': return 'badge-warning';
            case 'market research': return 'badge-info';
            default: return 'badge-neutral';
        }
    };

    const filteredTemplates = (templates || []).filter((template: Template) =>
        template.name.toLowerCase().includes(search.toLowerCase()) ||
        template.description?.toLowerCase().includes(search.toLowerCase())
    );

    // Only super_admin and company_admin can manage templates
    if (currentUser?.role !== 'super_admin' && currentUser?.role !== 'company_admin') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="card-soft max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LockIcon className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-text-primary mb-2">Access Denied</h2>
                    <p className="text-text-secondary mb-6">
                        This page is only accessible to administrators.
                    </p>
                    <Link to="/dashboard" className="btn-primary">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            title="Templates"
            subtitle="Manage survey templates for your organization"
            headerActions={
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Create Template
                </button>
            }
        >
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-soft pl-10"
                    />
                </div>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="select-soft w-48"
                >
                    <option value="">All Categories</option>
                    {categories?.map((cat: string) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert-error mb-6">
                    <AlertIcon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                        <p>{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="btn-icon text-red-600 hover:bg-red-100">
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Templates Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="spinner spinner-lg border-primary-600"></div>
                </div>
            ) : filteredTemplates.length === 0 ? (
                <div className="card-soft text-center py-12">
                    <TemplateIcon className="w-12 h-12 mx-auto text-text-muted mb-4" />
                    <h3 className="text-lg font-medium text-text-primary mb-2">No templates found</h3>
                    <p className="text-text-secondary mb-4">
                        {search ? 'Try a different search term' : 'Create your first template to get started'}
                    </p>
                    {!search && (
                        <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary">
                            Create Template
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {filteredTemplates.map((template: Template) => (
                        <div key={template.id} className="card-soft hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-text-primary truncate">{template.name}</h3>
                                    {template.category && (
                                        <span className={`${getCategoryBadgeClass(template.category)} mt-1`}>
                                            {template.category}
                                        </span>
                                    )}
                                </div>
                                {template.isGlobal && (
                                    <span className="badge-info ml-2 flex-shrink-0">
                                        <GlobeIcon className="w-3 h-3 mr-1" />
                                        Global
                                    </span>
                                )}
                            </div>

                            {template.description && (
                                <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                                    {template.description}
                                </p>
                            )}

                            <div className="flex items-center gap-4 text-sm text-text-muted mb-4">
                                <span className="flex items-center gap-1">
                                    <QuestionIcon className="w-4 h-4" />
                                    {template.questionCount || 0} questions
                                </span>
                                <span className="flex items-center gap-1">
                                    <ChartIcon className="w-4 h-4" />
                                    {template.useCount || 0} uses
                                </span>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-border">
                                <button
                                    onClick={() => handleCreateSurvey(template.id)}
                                    className="btn-primary flex-1 text-sm"
                                >
                                    Use Template
                                </button>
                                {/* Only allow editing/deleting company templates, not global ones unless super_admin */}
                                {(!template.isGlobal || currentUser?.role === 'super_admin') && (
                                    <>
                                        <Link
                                            to={`/templates/${template.id}/edit`}
                                            className="btn-secondary text-sm px-3"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(template.id)}
                                            className="btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 text-sm px-3"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Template Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Create Template</h2>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="label-soft">Template Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="input-soft"
                                        placeholder="e.g., Customer Satisfaction Survey"
                                    />
                                </div>
                                <div>
                                    <label className="label-soft">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="input-soft resize-none"
                                        rows={3}
                                        placeholder="Brief description of this template"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label-soft">Category</label>
                                        <select
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                            className="select-soft"
                                        >
                                            <option value="">Select category</option>
                                            <option value="Employee Engagement">Employee Engagement</option>
                                            <option value="Customer Satisfaction">Customer Satisfaction</option>
                                            <option value="Product Feedback">Product Feedback</option>
                                            <option value="Market Research">Market Research</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label-soft">Type</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as 'nps' | 'custom' })}
                                            className="select-soft"
                                        >
                                            <option value="custom">Custom</option>
                                            <option value="nps">NPS</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {currentUser?.role === 'super_admin' && (
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.isGlobal}
                                                onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                                                className="checkbox-soft"
                                            />
                                            <span className="text-sm text-text-secondary">Global template</span>
                                        </label>
                                    )}
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isAnonymous}
                                            onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                                            className="checkbox-soft"
                                        />
                                        <span className="text-sm text-text-secondary">Anonymous responses</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="btn-primary"
                                >
                                    {createMutation.isPending ? (
                                        <>
                                            <span className="spinner spinner-sm mr-2"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Template'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

// Icon Components
const PlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

const TemplateIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
);

const GlobeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const QuestionIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ChartIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const EditIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export default Templates;
