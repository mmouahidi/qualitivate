import api from './api';

export interface Template {
  id: string;
  companyId?: string;
  createdBy?: string;
  name: string;
  description?: string;
  category?: string;
  type: 'nps' | 'custom';
  isGlobal: boolean;
  isAnonymous: boolean;
  defaultSettings: Record<string, any>;
  useCount: number;
  targetCompanies: string[];
  targetRoles: string[];
  createdAt: string;
  updatedAt: string;
  creatorFirstName?: string;
  creatorLastName?: string;
  questionCount?: number;
}

export interface TemplateQuestion {
  id: string;
  templateId: string;
  type: string;
  content: string;
  options: Record<string, any>;
  isRequired: boolean;
  orderIndex: number;
}

export interface TemplateWithQuestions extends Template {
  questions: TemplateQuestion[];
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  category?: string;
  type?: 'nps' | 'custom';
  isGlobal?: boolean;
  isAnonymous?: boolean;
  targetCompanies?: string[];
  targetRoles?: string[];
  questions?: Array<{
    type: string;
    content: string;
    options?: Record<string, any>;
    isRequired?: boolean;
  }>;
}

export interface CreateSurveyFromTemplateData {
  title?: string;
  description?: string;
  companyId?: string;
}

export interface SaveAsTemplateData {
  name?: string;
  description?: string;
  category?: string;
  isGlobal?: boolean;
}

const templateService = {
  // List all accessible templates
  async list(params?: { category?: string; includeGlobal?: boolean }): Promise<Template[]> {
    const response = await api.get('/templates', { params });
    return response.data;
  },

  // Get template with questions
  async get(id: string): Promise<TemplateWithQuestions> {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  // Get available categories
  async getCategories(): Promise<string[]> {
    const response = await api.get('/templates/categories');
    return response.data;
  },

  // Create a new template
  async create(data: CreateTemplateData): Promise<TemplateWithQuestions> {
    const response = await api.post('/templates', data);
    return response.data;
  },

  // Update template
  async update(id: string, data: Partial<CreateTemplateData>): Promise<Template> {
    const response = await api.put(`/templates/${id}`, data);
    return response.data;
  },

  // Delete template
  async delete(id: string): Promise<void> {
    await api.delete(`/templates/${id}`);
  },

  // Create survey from template
  async createSurveyFromTemplate(templateId: string, data: CreateSurveyFromTemplateData): Promise<any> {
    const response = await api.post(`/templates/${templateId}/create-survey`, data);
    return response.data;
  },

  // Save existing survey as template
  async saveAsTemplate(surveyId: string, data: SaveAsTemplateData): Promise<TemplateWithQuestions> {
    const response = await api.post(`/surveys/${surveyId}/save-as-template`, data);
    return response.data;
  },

  // Add question to template
  async addQuestion(templateId: string, data: Partial<TemplateQuestion>): Promise<TemplateQuestion> {
    const response = await api.post(`/templates/${templateId}/questions`, data);
    return response.data;
  },

  // Update template question
  async updateQuestion(templateId: string, questionId: string, data: Partial<TemplateQuestion>): Promise<TemplateQuestion> {
    const response = await api.put(`/templates/${templateId}/questions/${questionId}`, data);
    return response.data;
  },

  // Delete template question
  async deleteQuestion(templateId: string, questionId: string): Promise<void> {
    await api.delete(`/templates/${templateId}/questions/${questionId}`);
  },

  // Reorder template questions
  async reorderQuestions(templateId: string, questionIds: string[]): Promise<TemplateQuestion[]> {
    const response = await api.put(`/templates/${templateId}/questions/reorder`, { questionIds });
    return response.data;
  },
};

export default templateService;
