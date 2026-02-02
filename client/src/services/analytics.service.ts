import api from './api';

export interface SurveyAnalytics {
  survey: {
    id: string;
    title: string;
    type: string;
    status: string;
    startsAt: string | null;
    endsAt: string | null;
  };
  overview: {
    totalResponses: number;
    completedResponses: number;
    inProgressResponses: number;
    abandonedResponses: number;
    completionRate: number;
    avgCompletionTimeSeconds: number;
    firstResponseAt: string | null;
    lastResponseAt: string | null;
  };
  nps: {
    score: number;
    promoters: { count: number; percentage: number };
    passives: { count: number; percentage: number };
    detractors: { count: number; percentage: number };
    totalResponses: number;
  } | null;
  trend: Array<{
    date: string;
    count: number;
    completed: number;
  }>;
  questionCount: number;
}

export interface QuestionAnalytics {
  surveyId: string;
  questions: Array<{
    questionId: string;
    questionText: string;
    type: string;
    required: boolean;
    totalAnswers: number;
    distribution: Record<string, number | Record<string, number>>;
    stats: {
      average?: number;
      min?: number;
      max?: number;
      count?: number;
      avgLength?: number;
    };
    options: any;
  }>;
}

export interface ResponseListItem {
  id: string;
  status: string;
  respondentEmail: string;
  startedAt: string;
  completedAt: string | null;
  answeredQuestions: number;
  totalQuestions: number;
  completionPercentage: number;
  metadata: any;
}

export interface PaginatedResponses {
  responses: ResponseListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ResponseDetails {
  id: string;
  surveyId: string;
  surveyTitle: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  respondent: {
    email?: string;
    sentAt?: string;
    openedAt?: string;
    anonymous?: boolean;
  } | null;
  metadata: any;
  answers: Array<{
    answerId: string;
    questionId: string;
    questionText: string;
    questionType: string;
    questionOptions: any;
    answer: any;
    answeredAt: string;
  }>;
}

export interface CompanyAnalytics {
  surveys: {
    total: number;
    draft: number;
    active: number;
    closed: number;
  };
  responses: {
    total: number;
    completed: number;
    completionRate: number;
  };
  overallNps: number | null;
  topSurveys: Array<{
    id: string;
    title: string;
    type: string;
    responseCount: number;
    completedCount: number;
  }>;
  trend: Array<{
    date: string;
    count: number;
  }>;
}

// Role-specific dashboard types
export interface RoleDashboardData {
  role: string;
  stats: Record<string, number | null>;
  companyLeaderboard?: Array<{
    id: string;
    name: string;
    surveyCount: number;
    responseCount: number;
  }>;
  platformTrend?: Array<{
    date: string;
    responses: number;
  }>;
  siteBreakdown?: Array<{
    id: string;
    name: string;
    userCount: number;
  }>;
  topSurveys?: Array<{
    id: string;
    title: string;
    type?: string;
    responseCount: number;
    completedCount?: number;
  }>;
  responseTrend?: Array<{
    date: string;
    responses: number;
    completed: number;
  }>;
}

class AnalyticsService {
  /**
   * Get role-specific dashboard analytics
   */
  async getRoleDashboard(startDate?: string, endDate?: string): Promise<RoleDashboardData> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get<RoleDashboardData>('/analytics/my-dashboard', { params });
    return response.data;
  }

  /**
   * Get company-wide analytics dashboard
   */
  async getCompanyAnalytics(startDate?: string, endDate?: string): Promise<CompanyAnalytics> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get<CompanyAnalytics>('/analytics/company', { params });
    return response.data;
  }

  /**
   * Get analytics for a specific survey
   */
  async getSurveyAnalytics(surveyId: string): Promise<SurveyAnalytics> {
    const response = await api.get<SurveyAnalytics>(`/analytics/surveys/${surveyId}`);
    return response.data;
  }

  /**
   * Get question-level analytics for a survey
   */
  async getQuestionAnalytics(surveyId: string): Promise<QuestionAnalytics> {
    const response = await api.get<QuestionAnalytics>(`/analytics/surveys/${surveyId}/questions`);
    return response.data;
  }

  /**
   * Get paginated list of responses for a survey
   */
  async getResponses(
    surveyId: string,
    options?: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<PaginatedResponses> {
    const response = await api.get<PaginatedResponses>(
      `/analytics/surveys/${surveyId}/responses`,
      { params: options }
    );
    return response.data;
  }

  /**
   * Get details of a single response
   */
  async getResponseDetails(responseId: string): Promise<ResponseDetails> {
    const response = await api.get<ResponseDetails>(`/analytics/responses/${responseId}`);
    return response.data;
  }

  /**
   * Export responses as CSV or JSON
   */
  async exportResponses(surveyId: string, format: 'csv' | 'json' = 'csv'): Promise<Blob | any> {
    if (format === 'csv') {
      const response = await api.get(`/analytics/surveys/${surveyId}/export`, {
        params: { format: 'csv' },
        responseType: 'blob'
      });
      return response.data;
    } else {
      const response = await api.get(`/analytics/surveys/${surveyId}/export`, {
        params: { format: 'json' }
      });
      return response.data;
    }
  }

  /**
   * Export analytics as PDF report
   */
  async exportPDFReport(surveyId: string): Promise<Blob> {
    const response = await api.get(`/analytics/surveys/${surveyId}/export/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }

  /**
   * Download CSV file
   */
  downloadCSV(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Download PDF file
   */
  downloadPDF(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
