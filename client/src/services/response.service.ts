import api from './api';

export interface PublicSurvey {
  survey: {
    id: string;
    title: string;
    description?: string;
    type: string;
    isAnonymous: boolean;
    defaultLanguage: string;
    settings?: Record<string, any>;
  };
  questions: Question[];
  distributionId?: string;
}

export interface Question {
  id: string;
  type: 'text' | 'textarea' | 'single_choice' | 'multiple_choice' | 'rating' | 'nps' | 'date' | 'number' | 'text_short' | 'text_long' | 'rating_scale' | 'matrix';
  content: string;
  options?: string[] | Record<string, any>;
  isRequired: boolean;
  orderIndex: number;
}

export interface StartResponseResult {
  responseId: string;
  anonymousToken: string;
}

export interface Answer {
  questionId: string;
  value: any;
}

export interface ResponseProgress {
  responseId: string;
  surveyId: string;
  status: 'started' | 'completed' | 'abandoned';
  anonymousToken: string;
  answers: Record<string, any>;
  startedAt: string;
}

export interface SurveySettings {
  surveyId: string;
  title: string;
  settings: {
    welcomeMessage?: string;
    thankYouTitle?: string;
    thankYouMessage?: string;
  };
}

const responseService = {
  // Get public survey for taking
  async getPublicSurvey(surveyId: string, params?: { dist?: string; lang?: string }): Promise<PublicSurvey> {
    const response = await api.get(`/responses/survey/${surveyId}/public`, { params });
    return response.data;
  },

  // Get available languages for a survey
  async getSurveyLanguages(surveyId: string): Promise<{ languages: string[] }> {
    const response = await api.get(`/responses/survey/${surveyId}/languages`);
    return response.data;
  },

  // Get survey settings (for thank you page)
  async getSurveySettings(surveyId: string): Promise<SurveySettings> {
    const response = await api.get(`/responses/survey/${surveyId}/settings`);
    return response.data;
  },

  // Start a survey response
  async startResponse(surveyId: string, data?: { distributionId?: string; email?: string; language?: string }): Promise<StartResponseResult> {
    const response = await api.post(`/responses/survey/${surveyId}/start`, data);
    return response.data;
  },

  // Get response progress (for resuming surveys)
  async getResponseProgress(responseId: string): Promise<ResponseProgress> {
    const response = await api.get(`/responses/${responseId}/progress`);
    return response.data;
  },

  // Save a single answer (for progress saving)
  async saveAnswer(responseId: string, questionId: string, value: any): Promise<void> {
    await api.post(`/responses/${responseId}/answer`, { questionId, value });
  },

  // Submit all answers at once
  async submitAnswers(responseId: string, answers: Answer[]): Promise<void> {
    await api.post(`/responses/${responseId}/submit`, { answers });
  },

  // Complete the response
  async completeResponse(responseId: string): Promise<void> {
    await api.post(`/responses/${responseId}/complete`);
  },

  // Get language display name
  getLanguageDisplayName(code: string): string {
    const languageNames: Record<string, string> = {
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      pt: 'Português',
      nl: 'Nederlands',
      pl: 'Polski',
      ru: 'Русский',
      zh: '中文',
      ja: '日本語',
      ko: '한국어',
      ar: 'العربية',
      hi: 'हिन्दी',
    };
    return languageNames[code] || code.toUpperCase();
  },

  // Get user's survey completion status
  async getUserSurveyStatus(): Promise<{ completedSurveyIds: string[]; completions: Array<{ surveyId: string; completedAt: string }> }> {
    const response = await api.get('/responses/user/status');
    return response.data;
  },

  // Get user's completed surveys with details
  async getUserCompletedSurveys(): Promise<{ data: any[]; total: number }> {
    const response = await api.get('/responses/user/completed');
    return response.data;
  }
};

export default responseService;
