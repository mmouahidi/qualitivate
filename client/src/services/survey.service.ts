import api from './api';
import type { Survey, Question, QuestionTranslation } from '../types';

// Response types for paginated list endpoints
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SurveyWithStats extends Survey {
  creatorFirstName?: string;
  creatorLastName?: string;
  questions?: Question[];
  stats?: {
    responses: number;
  };
}

export const surveyService = {
  async list(params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    type?: string;
    status?: string;
    companyId?: string;
  }): Promise<PaginatedResponse<SurveyWithStats>> {
    const response = await api.get('/surveys', { params });
    return response.data;
  },

  async get(id: string): Promise<SurveyWithStats> {
    const response = await api.get(`/surveys/${id}`);
    return response.data;
  },

  async create(data: {
    title: string;
    description?: string;
    type: 'nps' | 'custom';
    isPublic?: boolean;
    isAnonymous?: boolean;
    defaultLanguage?: string;
    settings?: Record<string, any>;
    startsAt?: string;
    endsAt?: string;
    companyId?: string;
  }): Promise<Survey> {
    const response = await api.post('/surveys', data);
    return response.data;
  },

  async update(id: string, data: Partial<Survey>): Promise<Survey> {
    const response = await api.put(`/surveys/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/surveys/${id}`);
    return response.data;
  },

  async duplicate(id: string): Promise<Survey> {
    const response = await api.post(`/surveys/${id}/duplicate`);
    return response.data;
  }
};

export const questionService = {
  async list(surveyId: string): Promise<{ data: Question[] }> {
    const response = await api.get(`/questions/survey/${surveyId}`);
    return response.data;
  },

  async create(surveyId: string, data: {
    type: 'nps' | 'multiple_choice' | 'text_short' | 'text_long' | 'rating_scale' | 'matrix';
    content: string;
    options?: Record<string, any>;
    isRequired?: boolean;
  }): Promise<Question> {
    const response = await api.post(`/questions/survey/${surveyId}`, data);
    return response.data;
  },

  async update(id: string, data: Partial<Question>): Promise<Question> {
    const response = await api.put(`/questions/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/questions/${id}`);
    return response.data;
  },

  async reorder(surveyId: string, questionIds: string[]): Promise<{ data: Question[] }> {
    const response = await api.post(`/questions/survey/${surveyId}/reorder`, { questionIds });
    return response.data;
  },

  async getTranslations(questionId: string): Promise<{ data: QuestionTranslation[] }> {
    const response = await api.get(`/questions/${questionId}/translations`);
    return response.data;
  },

  async createTranslation(questionId: string, data: {
    languageCode: string;
    content: string;
    options?: Record<string, any>;
  }): Promise<QuestionTranslation> {
    const response = await api.post(`/questions/${questionId}/translations`, data);
    return response.data;
  }
};
