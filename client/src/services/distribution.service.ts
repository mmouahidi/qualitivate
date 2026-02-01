import api from './api';

export interface Distribution {
  id: string;
  surveyId: string;
  channel: 'email' | 'link' | 'qr_code' | 'embed';
  targetUrl: string;
  qrCodeUrl?: string;
  emailList?: any;
  sentAt?: string;
  createdAt: string;
}

export interface DistributionStats {
  distribution: Distribution;
  stats: {
    totalResponses: number;
    completedResponses: number;
    startedResponses: number;
  };
}

export const distributionService = {
  // List distributions for a survey
  async list(surveyId: string): Promise<Distribution[]> {
    const response = await api.get(`/distributions/survey/${surveyId}`);
    return response.data.data;
  },

  // Create link distribution
  async createLink(surveyId: string): Promise<Distribution> {
    const response = await api.post(`/distributions/survey/${surveyId}/link`);
    return response.data.data;
  },

  // Create QR code distribution
  async createQR(surveyId: string): Promise<Distribution> {
    const response = await api.post(`/distributions/survey/${surveyId}/qr`);
    return response.data.data;
  },

  // Create embed distribution
  async createEmbed(surveyId: string, options?: { width?: string; height?: string }): Promise<Distribution & { embedCode: string }> {
    const response = await api.post(`/distributions/survey/${surveyId}/embed`, options);
    return response.data.data;
  },

  // Send email invitations
  async sendEmails(surveyId: string, data: { emails: string[]; subject?: string; message?: string }): Promise<{ distribution: Distribution; results: Array<{ email: string; status: string }> }> {
    const response = await api.post(`/distributions/survey/${surveyId}/email`, data);
    return response.data;
  },

  // Send to group (department/site/company)
  async sendToGroup(surveyId: string, data: { departmentId?: string; siteId?: string; companyId?: string; subject?: string; message?: string }): Promise<{ distribution: Distribution; results: Array<{ email: string; status: string }> }> {
    const response = await api.post(`/distributions/survey/${surveyId}/group`, data);
    return response.data;
  },

  // Get distribution stats
  async getStats(distributionId: string): Promise<DistributionStats> {
    const response = await api.get(`/distributions/${distributionId}/stats`);
    return response.data.data;
  },

  // Delete distribution
  async delete(distributionId: string): Promise<void> {
    await api.delete(`/distributions/${distributionId}`);
  }
};

// Public survey response service (no auth)
export const publicSurveyService = {
  // Get survey for responding
  async getSurvey(surveyId: string, options?: { dist?: string; lang?: string }): Promise<any> {
    const params = new URLSearchParams();
    if (options?.dist) params.append('dist', options.dist);
    if (options?.lang) params.append('lang', options.lang);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await api.get(`/responses/survey/${surveyId}/public${query}`);
    return response.data;
  },

  // Get available languages
  async getLanguages(surveyId: string): Promise<string[]> {
    const response = await api.get(`/responses/survey/${surveyId}/languages`);
    return response.data.languages;
  },

  // Start a response
  async startResponse(surveyId: string, data?: { distributionId?: string; language?: string }): Promise<{ responseId: string; anonymousToken: string }> {
    const response = await api.post(`/responses/survey/${surveyId}/start`, data);
    return response.data;
  },

  // Save individual answer
  async saveAnswer(responseId: string, questionId: string, value: any): Promise<void> {
    await api.post(`/responses/${responseId}/answer`, { questionId, value });
  },

  // Submit all answers
  async submitAnswers(responseId: string, answers: Array<{ questionId: string; value: any }>): Promise<void> {
    await api.post(`/responses/${responseId}/submit`, { answers });
  },

  // Complete response
  async completeResponse(responseId: string): Promise<void> {
    await api.post(`/responses/${responseId}/complete`);
  }
};
