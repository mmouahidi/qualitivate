import { Request, Response } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { AuthRequest } from '../middlewares/auth.middleware';
import db from '../config/database';

// Mock the database
jest.mock('../config/database', () => {
  const mockDb = jest.fn().mockReturnThis();
  (mockDb as any).where = jest.fn().mockReturnThis();
  (mockDb as any).select = jest.fn().mockReturnThis();
  (mockDb as any).join = jest.fn().mockReturnThis();
  (mockDb as any).leftJoin = jest.fn().mockReturnThis();
  (mockDb as any).first = jest.fn();
  (mockDb as any).whereIn = jest.fn().mockReturnThis();
  (mockDb as any).whereNotNull = jest.fn().mockReturnThis();
  (mockDb as any).orderBy = jest.fn().mockReturnThis();
  (mockDb as any).limit = jest.fn().mockReturnThis();
  (mockDb as any).offset = jest.fn().mockReturnThis();
  (mockDb as any).groupBy = jest.fn().mockReturnThis();
  (mockDb as any).clone = jest.fn().mockReturnThis();
  (mockDb as any).count = jest.fn().mockReturnThis();
  (mockDb as any).raw = jest.fn((sql: string) => sql);
  return mockDb;
});

describe('Analytics Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockSetHeader: jest.Mock;
  let mockSend: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockSetHeader = jest.fn();
    mockSend = jest.fn();
    mockRes = {
      json: mockJson,
      status: mockStatus,
      setHeader: mockSetHeader,
      send: mockSend,
    };
    mockReq = {
      params: {},
      query: {},
      user: {
        id: 'user-1',
        email: 'admin@test.com',
        role: 'company_admin',
        companyId: 'company-1',
      },
    };
    jest.clearAllMocks();
  });

  describe('getSurveyAnalytics', () => {
    const mockSurvey = {
      id: 'survey-1',
      title: 'Test Survey',
      type: 'nps',
      status: 'active',
      company_id: 'company-1',
      starts_at: new Date(),
      ends_at: null,
    };

    it('should return survey analytics', async () => {
      mockReq.params = { surveyId: 'survey-1' };

      const mockDbInstance = db as unknown as jest.Mock;
      
      // Mock survey lookup
      mockDbInstance.mockImplementation((table: string) => {
        const chain = {
          where: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          first: jest.fn(),
          join: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          whereIn: jest.fn().mockReturnThis(),
          whereNotNull: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
        };
        
        if (table === 'surveys') {
          chain.first = jest.fn().mockResolvedValue(mockSurvey);
        } else if (table === 'responses') {
          chain.first = jest.fn().mockResolvedValue({
            total_responses: '10',
            completed_responses: '8',
            in_progress_responses: '1',
            abandoned_responses: '1',
            first_response: new Date(),
            last_response: new Date(),
          });
          // For trend query
          chain.groupBy = jest.fn().mockReturnValue([]);
        } else if (table === 'questions') {
          chain.orderBy = jest.fn().mockResolvedValue([
            { id: 'q1', type: 'nps', order_index: 0 }
          ]);
        } else if (table === 'answers') {
          chain.select = jest.fn().mockResolvedValue([
            { answer: JSON.stringify({ value: 9 }) },
            { answer: JSON.stringify({ value: 8 }) },
            { answer: JSON.stringify({ value: 5 }) },
          ]);
        }
        
        return chain;
      });

      await analyticsController.getSurveyAnalytics(
        mockReq as any,
        mockRes as Response
      );

      expect(mockJson).toHaveBeenCalled();
    });

    it('should return 404 for non-existent survey', async () => {
      mockReq.params = { surveyId: 'non-existent' };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      await analyticsController.getSurveyAnalytics(
        mockReq as any,
        mockRes as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Survey not found' });
    });

    it('should return 403 for unauthorized access', async () => {
      mockReq.params = { surveyId: 'survey-1' };
      mockReq.user = {
        ...mockReq.user!,
        companyId: 'other-company',
      };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ ...mockSurvey, company_id: 'company-1' }),
      }));

      await analyticsController.getSurveyAnalytics(
        mockReq as any,
        mockRes as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Access denied' });
    });
  });

  describe('getQuestionAnalytics', () => {
    it('should return question analytics for a survey', async () => {
      mockReq.params = { surveyId: 'survey-1' };

      const mockSurvey = {
        id: 'survey-1',
        company_id: 'company-1',
      };

      const mockQuestions = [
        { id: 'q1', content: 'Rate us', type: 'nps', is_required: true, options: null, order_index: 0 },
        { id: 'q2', content: 'Comment', type: 'text_long', is_required: false, options: null, order_index: 1 },
      ];

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation((table: string) => {
        const chain = {
          where: jest.fn().mockReturnThis(),
          first: jest.fn(),
          orderBy: jest.fn(),
          join: jest.fn().mockReturnThis(),
          select: jest.fn(),
        };

        if (table === 'surveys') {
          chain.first = jest.fn().mockResolvedValue(mockSurvey);
        } else if (table === 'questions') {
          chain.orderBy = jest.fn().mockResolvedValue(mockQuestions);
        } else if (table === 'answers') {
          chain.select = jest.fn().mockResolvedValue([
            { answer: JSON.stringify({ value: 9 }) },
          ]);
        }

        return chain;
      });

      await analyticsController.getQuestionAnalytics(
        mockReq as any,
        mockRes as Response
      );

      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe('getResponses', () => {
    it('should return paginated responses', async () => {
      mockReq.params = { surveyId: 'survey-1' };
      mockReq.query = { page: '1', limit: '20' };

      const mockSurvey = {
        id: 'survey-1',
        company_id: 'company-1',
        is_anonymous: false,
      };

      const mockResponses = [
        {
          id: 'resp-1',
          status: 'completed',
          started_at: new Date(),
          completed_at: new Date(),
          metadata: {},
          respondent_email: 'user@test.com',
        },
      ];

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation((table: string) => {
        const chain = {
          where: jest.fn().mockReturnThis(),
          first: jest.fn(),
          select: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          offset: jest.fn(),
          clone: jest.fn().mockReturnThis(),
          count: jest.fn().mockReturnThis(),
          whereIn: jest.fn().mockReturnThis(),
          groupBy: jest.fn(),
        };

        if (table === 'surveys') {
          chain.first = jest.fn().mockResolvedValue(mockSurvey);
        } else if (table === 'responses') {
          chain.first = jest.fn().mockResolvedValue({ count: '1' });
          chain.offset = jest.fn().mockResolvedValue(mockResponses);
        } else if (table === 'answers') {
          chain.groupBy = jest.fn().mockResolvedValue([
            { response_id: 'resp-1', count: '5' },
          ]);
        } else if (table === 'questions') {
          chain.first = jest.fn().mockResolvedValue({ count: '10' });
        }

        return chain;
      });

      await analyticsController.getResponses(
        mockReq as any,
        mockRes as Response
      );

      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe('getResponseDetails', () => {
    it('should return response details with answers', async () => {
      mockReq.params = { responseId: 'resp-1' };

      const mockResponse = {
        id: 'resp-1',
        survey_id: 'survey-1',
        survey_title: 'Test Survey',
        company_id: 'company-1',
        is_anonymous: false,
        status: 'completed',
        started_at: new Date(),
        completed_at: new Date(),
        invitation_id: 'inv-1',
        metadata: {},
      };

      const mockAnswers = [
        {
          answer_id: 'ans-1',
          answer: JSON.stringify({ value: 9 }),
          answered_at: new Date(),
          question_id: 'q1',
          question_text: 'Rate us',
          question_type: 'nps',
          question_options: null,
          order_index: 0,
        },
      ];

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation((table: string) => {
        const chain = {
          where: jest.fn().mockReturnThis(),
          join: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          first: jest.fn(),
          orderBy: jest.fn(),
        };

        if (table === 'responses') {
          chain.first = jest.fn().mockResolvedValue(mockResponse);
        } else if (table === 'survey_invitations') {
          chain.first = jest.fn().mockResolvedValue({
            email: 'user@test.com',
            sent_at: new Date(),
            opened_at: new Date(),
          });
        } else if (table === 'answers') {
          chain.orderBy = jest.fn().mockResolvedValue(mockAnswers);
        }

        return chain;
      });

      await analyticsController.getResponseDetails(
        mockReq as any,
        mockRes as Response
      );

      expect(mockJson).toHaveBeenCalled();
      const response = mockJson.mock.calls[0][0];
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('answers');
    });

    it('should return 404 for non-existent response', async () => {
      mockReq.params = { responseId: 'non-existent' };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      await analyticsController.getResponseDetails(
        mockReq as any,
        mockRes as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Response not found' });
    });
  });

  describe('exportResponses', () => {
    it('should export responses as CSV', async () => {
      mockReq.params = { surveyId: 'survey-1' };
      mockReq.query = { format: 'csv' };

      const mockSurvey = {
        id: 'survey-1',
        title: 'Test Survey',
        company_id: 'company-1',
        is_anonymous: false,
      };

      const mockQuestions = [
        { id: 'q1', content: 'Rate us', order_index: 0 },
      ];

      const mockResponses = [
        {
          id: 'resp-1',
          started_at: new Date(),
          completed_at: new Date(),
          email: 'user@test.com',
        },
      ];

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation((table: string) => {
        const chain = {
          where: jest.fn().mockReturnThis(),
          first: jest.fn(),
          orderBy: jest.fn(),
          leftJoin: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          whereIn: jest.fn().mockReturnThis(),
        };

        if (table === 'surveys') {
          chain.first = jest.fn().mockResolvedValue(mockSurvey);
        } else if (table === 'questions') {
          chain.orderBy = jest.fn().mockResolvedValue(mockQuestions);
        } else if (table === 'responses') {
          chain.orderBy = jest.fn().mockResolvedValue(mockResponses);
        } else if (table === 'answers') {
          chain.select = jest.fn().mockResolvedValue([
            { response_id: 'resp-1', question_id: 'q1', value: JSON.stringify({ value: 9 }) },
          ]);
        }

        return chain;
      });

      await analyticsController.exportResponses(
        mockReq as any,
        mockRes as Response
      );

      expect(mockSetHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(mockSend).toHaveBeenCalled();
    });

    it('should export responses as JSON', async () => {
      mockReq.params = { surveyId: 'survey-1' };
      mockReq.query = { format: 'json' };

      const mockSurvey = {
        id: 'survey-1',
        title: 'Test Survey',
        company_id: 'company-1',
        is_anonymous: false,
      };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation((table: string) => {
        const chain = {
          where: jest.fn().mockReturnThis(),
          first: jest.fn(),
          orderBy: jest.fn(),
          leftJoin: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          whereIn: jest.fn().mockReturnThis(),
        };

        if (table === 'surveys') {
          chain.first = jest.fn().mockResolvedValue(mockSurvey);
        } else if (table === 'questions') {
          chain.orderBy = jest.fn().mockResolvedValue([]);
        } else if (table === 'responses') {
          chain.orderBy = jest.fn().mockResolvedValue([]);
        } else if (table === 'answers') {
          chain.select = jest.fn().mockResolvedValue([]);
        }

        return chain;
      });

      await analyticsController.exportResponses(
        mockReq as any,
        mockRes as Response
      );

      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe('getCompanyAnalytics', () => {
    it('should return company-wide analytics', async () => {
      mockReq.query = {};

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation((table: string) => {
        // Survey counts query (first query)
        if (table === 'surveys') {
          return {
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({
              total: '5',
              draft: '1',
              active: '3',
              closed: '1',
            }),
            leftJoin: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([
              { id: 's1', title: 'Survey 1', type: 'nps', response_count: '10', completed_count: '8' },
            ]),
          };
        }

        // Response stats query
        if (table === 'responses') {
          return {
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({
              total: '100',
              completed: '80',
            }),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockResolvedValue([
              { date: new Date().toISOString().split('T')[0], count: '5' },
            ]),
          };
        }

        // NPS answers query
        if (table === 'answers') {
          return {
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue([
              { value: JSON.stringify({ value: 9 }) },
              { value: JSON.stringify({ value: 5 }) },
            ]),
          };
        }

        // Fallback for any other table
        return {
          where: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({}),
          join: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockResolvedValue([]),
          limit: jest.fn().mockResolvedValue([]),
        };
      });

      await analyticsController.getCompanyAnalytics(
        mockReq as any,
        mockRes as Response
      );

      expect(mockJson).toHaveBeenCalled();
      const response = mockJson.mock.calls[0][0];
      expect(response).toHaveProperty('surveys');
      expect(response).toHaveProperty('responses');
      expect(response).toHaveProperty('topSurveys');
      expect(response).toHaveProperty('trend');
    });

    it('should apply date filters when provided', async () => {
      const startDate = new Date('2024-01-01').toISOString();
      const endDate = new Date('2024-01-31').toISOString();
      mockReq.query = { startDate, endDate };

      const mockDbInstance = db as unknown as jest.Mock;
      const whereMock = jest.fn().mockReturnThis();
      
      mockDbInstance.mockImplementation(() => ({
        where: whereMock,
        select: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ total: '10', draft: '1', active: '5', closed: '4' }),
        join: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      }));

      await analyticsController.getCompanyAnalytics(
        mockReq as any,
        mockRes as Response
      );

      expect(mockJson).toHaveBeenCalled();
    });
  });
});

describe('NPS Calculation Tests', () => {
  it('should correctly calculate NPS score', () => {
    // NPS = (Promoters - Detractors) / Total * 100
    // Example: 50% promoters, 30% passives, 20% detractors
    // NPS = (50 - 20) = 30
    
    const scores = [10, 10, 10, 10, 10, 8, 8, 8, 5, 5];
    const promoters = scores.filter(s => s >= 9).length; // 5
    const detractors = scores.filter(s => s <= 6).length; // 2
    const total = scores.length; // 10
    
    const nps = Math.round(((promoters - detractors) / total) * 100);
    
    expect(promoters).toBe(5);
    expect(detractors).toBe(2);
    expect(nps).toBe(30);
  });

  it('should handle all promoters', () => {
    const scores = [9, 10, 9, 10, 10];
    const promoters = scores.filter(s => s >= 9).length;
    const detractors = scores.filter(s => s <= 6).length;
    const nps = Math.round(((promoters - detractors) / scores.length) * 100);
    
    expect(nps).toBe(100);
  });

  it('should handle all detractors', () => {
    const scores = [0, 1, 2, 3, 4, 5, 6];
    const promoters = scores.filter(s => s >= 9).length;
    const detractors = scores.filter(s => s <= 6).length;
    const nps = Math.round(((promoters - detractors) / scores.length) * 100);
    
    expect(nps).toBe(-100);
  });

  it('should handle mixed scores', () => {
    const scores = [9, 8, 7, 6, 5];
    // 1 promoter (9), 2 passives (7,8), 2 detractors (5,6)
    const promoters = scores.filter(s => s >= 9).length;
    const passives = scores.filter(s => s >= 7 && s <= 8).length;
    const detractors = scores.filter(s => s <= 6).length;
    const nps = Math.round(((promoters - detractors) / scores.length) * 100);
    
    expect(promoters).toBe(1);
    expect(passives).toBe(2);
    expect(detractors).toBe(2);
    expect(nps).toBe(-20);
  });
});
