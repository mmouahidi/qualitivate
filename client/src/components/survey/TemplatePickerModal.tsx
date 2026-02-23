import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import templateService, { Template, TemplateWithQuestions } from '../../services/template.service';
import { companyService } from '../../services/organization.service';
import { useAuth } from '../../contexts/AuthContext';

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template, companyId?: string) => void;
}

const TemplatePickerModal: React.FC<TemplatePickerModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateService.list(),
    enabled: isOpen,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['template-categories'],
    queryFn: () => templateService.getCategories(),
    enabled: isOpen,
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies-for-template'],
    queryFn: () => companyService.listAll(),
    enabled: isOpen && isSuperAdmin,
  });

  // Fetch full template details (with questions) when a template is selected
  const { data: templateDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['template-details', selectedTemplate?.id],
    queryFn: () => templateService.get(selectedTemplate!.id),
    enabled: !!selectedTemplate,
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedTemplate(null);
    setSelectedCompanyId('');
    setSearchTerm('');
    setSelectedCategory('');
    onClose();
  };

  const handleTemplateClick = (template: Template) => {
    // For all users, show preview/accept step first
    setSelectedTemplate(template);
    setSelectedCompanyId('');
  };

  const handleConfirmCreate = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate, isSuperAdmin ? (selectedCompanyId || undefined) : undefined);
    }
  };

  const handleBack = () => {
    setSelectedTemplate(null);
    setSelectedCompanyId('');
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    const matchesSearch = !searchTerm ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedTemplates = {
    global: filteredTemplates.filter((t) => t.isGlobal),
    company: filteredTemplates.filter((t) => !t.isGlobal),
  };

  // Show template preview/accept step when a template is selected
  if (selectedTemplate) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Review Template</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Template Info */}
          <div className="mb-4 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <h3 className="text-lg font-semibold text-primary-800">{selectedTemplate.name}</h3>
            {selectedTemplate.description && (
              <p className="text-sm text-primary-600 mt-1">{selectedTemplate.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-primary-500">
              <span>{selectedTemplate.questionCount || 0} questions</span>
              {selectedTemplate.category && (
                <span className="px-2 py-0.5 bg-primary-100 rounded">{selectedTemplate.category}</span>
              )}
              <span className="px-2 py-0.5 bg-primary-100 rounded uppercase">{selectedTemplate.type}</span>
            </div>
          </div>

          {/* Questions Preview */}
          <div className="flex-1 overflow-y-auto mb-4">
            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">Questions</h4>
            {isLoadingDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-sm text-gray-500">Loading questions...</span>
              </div>
            ) : templateDetails?.questions && templateDetails.questions.length > 0 ? (
              <div className="space-y-2">
                {templateDetails.questions
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((question, index) => (
                    <div key={question.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">{question.content}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded">
                              {question.type.replace('_', ' ')}
                            </span>
                            {question.isRequired && (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">Required</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No questions in this template.</p>
            )}
          </div>

          {/* Company Selector (Super Admin only) */}
          {isSuperAdmin && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Survey Scope
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">🌐 General (All Users)</option>
                {companiesData?.data?.map((company: any) => (
                  <option key={company.id} value={company.id}>🏢 {company.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {selectedCompanyId
                  ? 'Survey belongs to selected company'
                  : 'General survey accessible to all users'}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Templates
            </button>
            <button
              onClick={handleConfirmCreate}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Accept & Create Survey
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Choose a Template</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search templates..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No templates found.</p>
              <p className="text-sm mt-2">Try adjusting your search or category filter.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Global Templates */}
              {groupedTemplates.global.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs">✨</span>
                    System Templates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedTemplates.global.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onSelect={() => handleTemplateClick(template)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Company Templates */}
              {groupedTemplates.company.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs">🏢</span>
                    Company Templates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedTemplates.company.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onSelect={() => handleTemplateClick(template)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

interface TemplateCardProps {
  template: Template;
  onSelect: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className="text-left w-full p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 group-hover:text-primary-600">
            {template.name}
          </h4>
          {template.category && (
            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              {template.category}
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-1 rounded ${template.type === 'nps'
          ? 'bg-green-100 text-green-700'
          : 'bg-blue-100 text-blue-700'
          }`}>
          {template.type.toUpperCase()}
        </span>
      </div>

      {template.description && (
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {template.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {template.questionCount || 0} questions
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Used {template.useCount} times
        </span>
      </div>
    </button>
  );
};

export default TemplatePickerModal;
