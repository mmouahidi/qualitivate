import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { surveyService } from '../../services/survey.service';
import templateService, { Template } from '../../services/template.service';
import { companyService, siteService } from '../../services/organization.service';
import TemplatePickerModal from '../../components/survey/TemplatePickerModal';
import { DashboardLayout } from '../../components/layout';
import { useAuth } from '../../contexts/AuthContext';

const Surveys: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hideExpired, setHideExpired] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTemplatePickerOpen, setIsTemplatePickerOpen] = useState(false);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'custom' as 'nps' | 'custom',
    isPublic: false,
    isAnonymous: false,
    startsAt: '',
    endsAt: '',
    companyId: '',
    siteId: ''
  });
  
  // Fetch companies for super_admin
  const { data: companiesData } = useQuery({
    queryKey: ['companies-list'],
    queryFn: () => companyService.listAll(),
    enabled: isSuperAdmin,
  });

  // Fetch sites for selected company
  const { data: sitesData } = useQuery({
    queryKey: ['sites-list', formData.companyId],
    queryFn: () => siteService.listByCompany(formData.companyId),
    enabled: isSuperAdmin && !!formData.companyId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['surveys', search, statusFilter, selectedCompanyFilter],
    queryFn: () => surveyService.list({ 
      search, 
      status: statusFilter,
      companyId: isSuperAdmin ? selectedCompanyFilter : undefined
    })
  });

  const createMutation = useMutation({
    mutationFn: surveyService.create,
    onSuccess: (newSurvey) => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      setIsCreateModalOpen(false);
      setFormData({ title: '', description: '', type: 'custom', isPublic: false, isAnonymous: false, startsAt: '', endsAt: '', companyId: '', siteId: '' });
      navigate(`/surveys/${newSurvey.id}/edit`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: surveyService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: surveyService.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    }
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: any }) =>
      templateService.createSurveyFromTemplate(templateId, data),
    onSuccess: (newSurvey) => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      setIsTemplatePickerOpen(false);
      navigate(`/surveys/${newSurvey.id}/edit`);
    }
  });

  const handleTemplateSelect = async (template: Template, companyId?: string) => {
    createFromTemplateMutation.mutate({
      templateId: template.id,
      data: {
        title: `${template.name} - ${new Date().toLocaleDateString()}`,
        companyId: companyId,
      }
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      isPublic: formData.isPublic,
      isAnonymous: formData.isAnonymous,
      startsAt: formData.startsAt || undefined,
      endsAt: formData.endsAt || undefined,
    };
    
    // Super admin can specify company
    if (isSuperAdmin && formData.companyId) {
      payload.companyId = formData.companyId;
    }
    
    createMutation.mutate(payload);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      closed: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // Filter expired surveys if toggle is enabled
  const filteredSurveys = (data?.data || []).filter((survey: any) => {
    if (!hideExpired) return true;
    if (!survey.ends_at) return true;
    return new Date(survey.ends_at) >= new Date();
  });

  return (
    <DashboardLayout
      title={t('surveys.title')}
      subtitle={t('surveys.subtitle')}
      headerActions={
        <div className="flex gap-2">
          <button
            onClick={() => setIsTemplatePickerOpen(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('surveys.useTemplate')}
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('surveys.createBlank')}
          </button>
        </div>
      }
    >
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <input
          type="text"
          placeholder={t('surveys.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-soft flex-1"
        />
        {isSuperAdmin && (
          <select
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value)}
            className="select-soft sm:w-48"
          >
            <option value="">{t('surveys.allSurveys')}</option>
            <option value="general">🌐 {t('surveys.generalSurvey')}</option>
            {companiesData?.data?.map((company: any) => (
              <option key={company.id} value={company.id}>🏢 {company.name}</option>
            ))}
          </select>
        )}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="select-soft sm:w-40"
        >
          <option value="">{t('surveys.allStatus')}</option>
          <option value="draft">{t('surveys.draft')}</option>
          <option value="active">{t('surveys.active')}</option>
          <option value="closed">{t('surveys.closed')}</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-text-secondary whitespace-nowrap cursor-pointer">
          <input
            type="checkbox"
            checked={hideExpired}
            onChange={(e) => setHideExpired(e.target.checked)}
            className="checkbox-soft"
          />
          {t('surveys.hideExpired')}
        </label>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner spinner-lg border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredSurveys?.map((survey: any) => (
            <div key={survey.id} className="card-soft hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-text-primary mb-1">{survey.title}</h3>
                  <p className="text-sm text-text-secondary line-clamp-2">{survey.description || t('surveys.noDescription')}</p>
                  {isSuperAdmin && (
                    <p className="text-xs text-primary-600 mt-1 flex items-center gap-1">
                      {survey.companyName ? (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {survey.companyName}
                        </>
                      ) : (
                        <>
                          <span>🌐</span>
                          {t('surveys.generalSurvey')}
                        </>
                      )}
                    </p>
                  )}
                </div>
                <span className={`badge-${survey.status === 'active' ? 'success' : survey.status === 'closed' ? 'danger' : 'neutral'} ml-2`}>
                  {survey.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
                <span className="badge-primary">{survey.type}</span>
                {survey.is_public && <span className="badge-purple">Public</span>}
                {survey.is_anonymous && <span className="badge-warning">Anonymous</span>}
                {survey.ends_at && (
                  <span className={`flex items-center gap-1 text-xs ${new Date(survey.ends_at) < new Date() ? 'text-red-600' : 'text-text-muted'}`}>
                    ⏰ {new Date(survey.ends_at) < new Date() ? 'Expired' : `Due ${new Date(survey.ends_at).toLocaleDateString()}`}
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/surveys/${survey.id}/builder`)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    {t('surveys.edit')}
                  </button>
                  <button
                    onClick={() => navigate(`/surveys/${survey.id}/distribute`)}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    {t('surveys.distribute')}
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => duplicateMutation.mutate(survey.id)}
                    className="text-text-secondary hover:text-text-primary text-sm"
                  >
                    {t('surveys.duplicate')}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(t('surveys.deleteConfirm'))) {
                        deleteMutation.mutate(survey.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    {t('surveys.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(!filteredSurveys || filteredSurveys.length === 0) && (
            <div className="col-span-full text-center py-12 text-text-secondary">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p>{t('surveys.noSurveys')}</p>
              <p className="text-sm mt-1">{t('surveys.noSurveysDesc')}</p>
            </div>
          )}
        </div>
      )}

      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create Survey</h2>
            <form onSubmit={handleCreate}>
              {isSuperAdmin && (
                <div className="mb-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
                  <label className="label-soft text-primary-700">Survey Scope</label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value, siteId: '' })}
                    className="select-soft"
                  >
                    <option value="">🌐 General (All Users)</option>
                    {companiesData?.data?.map((company: any) => (
                      <option key={company.id} value={company.id}>🏢 {company.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-primary-600 mt-1">
                    {formData.companyId 
                      ? 'Survey belongs to selected company' 
                      : 'General survey accessible to all users'}
                  </p>
                  
                  {formData.companyId && sitesData?.data && sitesData.data.length > 0 && (
                    <div className="mt-3">
                      <label className="label-soft text-primary-700">Site (optional)</label>
                      <select
                        value={formData.siteId}
                        onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                        className="select-soft"
                      >
                        <option value="">All sites in company</option>
                        {sitesData.data.map((site: any) => (
                          <option key={site.id} value={site.id}>{site.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
              <div className="mb-4">
                <label className="label-soft">Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-soft"
                />
              </div>
              <div className="mb-4">
                <label className="label-soft">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="input-soft"
                />
              </div>
              <div className="mb-4">
                <label className="label-soft">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="select-soft"
                >
                  <option value="custom">Custom Survey</option>
                  <option value="nps">NPS Survey</option>
                </select>
              </div>
              <div className="mb-4 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-text-secondary">Public survey</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isAnonymous}
                    onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-text-secondary">Anonymous responses</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="label-soft">Starts At (optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="input-soft"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-text-muted mt-1">Schedule for later</p>
                </div>
                <div>
                  <label className="label-soft">Deadline (optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                    className="input-soft"
                    min={formData.startsAt || new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-text-muted mt-1">Due date for responses</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
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
                  {createMutation.isPending ? 'Creating...' : 'Create & Edit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Picker Modal */}
      <TemplatePickerModal
        isOpen={isTemplatePickerOpen}
        onClose={() => setIsTemplatePickerOpen(false)}
        onSelect={handleTemplateSelect}
      />
    </DashboardLayout>
  );
};

export default Surveys;
