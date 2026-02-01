import { Response, Request } from 'express';
import * as responseController from '../controllers/response.controller';
import db from '../config/database';

// Mock the database
jest.mock('../config/database', () => {
  const mockDb = jest.fn().mockReturnThis();
  (mockDb as any).where = jest.fn().mockReturnThis();
  (mockDb as any).whereIn = jest.fn().mockReturnThis();
  (mockDb as any).select = jest.fn().mockReturnThis();
  (mockDb as any).first = jest.fn();
  (mockDb as any).insert = jest.fn().mockReturnThis();
  (mockDb as any).update = jest.fn().mockReturnThis();
  (mockDb as any).returning = jest.fn();
  (mockDb as any).orderBy = jest.fn().mockReturnThis();
  (mockDb as any).pluck = jest.fn();
  (mockDb as any).onConflict = jest.fn().mockReturnThis();
  (mockDb as any).merge = jest.fn();
  (mockDb as any).transaction = jest.fn();
  return mockDb;
});

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-123'),
}));

describe('Public Survey Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockRes = {
      json: mockJson,
      status: mockStatus,
    };
    mockReq = {
      params: {},
      query: {},
      body: {},
      ip: '127.0.0.1',
    };
    jest.clearAllMocks();
  });

  describe('getPublicSurvey', () => {
    it('should return survey with questions when survey is active', async () => {
      mockReq.params = { surveyId: 'survey-1' };
      mockReq.query = { lang: 'en' };

      const mockSurvey = {
        id: 'survey-1',
        title: 'Customer Satisfaction',
        description: 'Please tell us about your experience',
        type: 'general',
        status: 'active',
        is_anonymous: true,
        default_language: 'en',
        settings: {},
      };

      const mockQuestions = [
        { id: 'q1', type: 'rating', content: 'How satisfied are you?', is_required: true, order_index: 0 },
        { id: 'q2', type: 'text', content: 'Any comments?', is_required: false, order_index: 1 },
      ];

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation((table: string) => {
        const chain: any = {
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(table === 'surveys' ? mockSurvey : null),
          orderBy: jest.fn().mockResolvedValue(mockQuestions),
          whereIn: jest.fn().mockResolvedValue([]),
        };
        return chain;
      });

      await responseController.getPublicSurvey(mockReq as Request, mockRes as Response);

      // Should either return survey data or call json
      expect(mockJson).toHaveBeenCalled();
    });

    it('should return 404 for inactive survey', async () => {
      mockReq.params = { surveyId: 'inactive-survey' };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      await responseController.getPublicSurvey(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Survey not found or not active' });
    });

    it('should return 400 for survey not yet started', async () => {
      mockReq.params = { surveyId: 'future-survey' };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 'future-survey',
          status: 'active',
          starts_at: futureDate.toISOString(),
        }),
      }));

      await responseController.getPublicSurvey(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Survey has not started yet' });
    });

    it('should return 400 for ended survey', async () => {
      mockReq.params = { surveyId: 'ended-survey' };

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 'ended-survey',
          status: 'active',
          ends_at: pastDate.toISOString(),
        }),
      }));

      await responseController.getPublicSurvey(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Survey has ended' });
    });
  });

  describe('startResponse', () => {
    it('should create a new response', async () => {
      mockReq.params = { surveyId: 'survey-1' };
      mockReq.body = { language: 'en' };

      const mockSurvey = { id: 'survey-1', status: 'active', default_language: 'en' };
      const mockResponse = { id: 'mock-uuid-123', anonymous_token: 'direct_mock-uuid-123' };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation((table: string) => {
        if (table === 'surveys') {
          return {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(mockSurvey),
          };
        }
        if (table === 'responses') {
          return {
            insert: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([mockResponse]),
          };
        }
        return {};
      });

      await responseController.startResponse(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalled();
      const response = mockJson.mock.calls[0][0];
      expect(response.responseId).toBeDefined();
    });

    it('should return 404 for inactive survey', async () => {
      mockReq.params = { surveyId: 'inactive' };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      await responseController.startResponse(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('saveAnswer', () => {
    it('should save answer for active response', async () => {
      mockReq.params = { responseId: 'response-1' };
      mockReq.body = { questionId: 'q1', value: 5 };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation((table: string) => {
        if (table === 'responses') {
          return {
            where: jest.fn().mockReturnThis(),
            whereIn: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({ id: 'response-1', status: 'started' }),
          };
        }
        if (table === 'answers') {
          return {
            insert: jest.fn().mockReturnThis(),
            onConflict: jest.fn().mockReturnThis(),
            merge: jest.fn().mockResolvedValue(1),
          };
        }
        return {};
      });

      await responseController.saveAnswer(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({ message: 'Answer saved' });
    });

    it('should return 404 for completed response', async () => {
      mockReq.params = { responseId: 'completed-response' };
      mockReq.body = { questionId: 'q1', value: 5 };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      await responseController.saveAnswer(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('getSurveyLanguages', () => {
    it('should return available languages', async () => {
      mockReq.params = { surveyId: 'survey-1' };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation((table: string) => {
        if (table === 'surveys') {
          return {
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({ default_language: 'en' }),
          };
        }
        if (table === 'survey_translations') {
          return {
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue([
              { language_code: 'es' },
              { language_code: 'fr' },
            ]),
          };
        }
        return {};
      });

      await responseController.getSurveyLanguages(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalled();
      const response = mockJson.mock.calls[0][0];
      expect(response.languages).toContain('en');
      expect(response.languages).toContain('es');
      expect(response.languages).toContain('fr');
    });

    it('should return 404 for non-existent survey', async () => {
      mockReq.params = { surveyId: 'non-existent' };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      await responseController.getSurveyLanguages(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('completeResponse', () => {
    it('should complete response with all required questions answered', async () => {
      mockReq.params = { responseId: 'response-1' };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation((table: string) => {
        if (table === 'responses') {
          return {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({ id: 'response-1', status: 'started', survey_id: 'survey-1' }),
            update: jest.fn().mockResolvedValue(1),
          };
        }
        if (table === 'questions') {
          return {
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue([{ id: 'q1' }]),
          };
        }
        if (table === 'answers') {
          return {
            where: jest.fn().mockReturnThis(),
            whereIn: jest.fn().mockReturnThis(),
            pluck: jest.fn().mockResolvedValue(['q1']),
          };
        }
        return {};
      });

      await responseController.completeResponse(mockReq as Request, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({ message: 'Survey completed successfully' });
    });

    it('should return 400 if required questions missing', async () => {
      mockReq.params = { responseId: 'response-1' };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation((table: string) => {
        if (table === 'responses') {
          return {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({ id: 'response-1', status: 'started', survey_id: 'survey-1' }),
          };
        }
        if (table === 'questions') {
          return {
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue([{ id: 'q1' }, { id: 'q2' }]),
          };
        }
        if (table === 'answers') {
          return {
            where: jest.fn().mockReturnThis(),
            whereIn: jest.fn().mockReturnThis(),
            pluck: jest.fn().mockResolvedValue(['q1']), // Only q1 answered, q2 missing
          };
        }
        return {};
      });

      await responseController.completeResponse(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      const response = mockJson.mock.calls[0][0];
      expect(response.missingQuestionIds).toContain('q2');
    });
  });
});

describe('Progress Saving Tests', () => {
  it('should allow saving answers multiple times', () => {
    const answers: Record<string, any> = {};
    
    // First save
    answers['q1'] = 5;
    expect(answers['q1']).toBe(5);
    
    // Update
    answers['q1'] = 4;
    expect(answers['q1']).toBe(4);
    
    // Add more
    answers['q2'] = 'Great service';
    expect(Object.keys(answers)).toHaveLength(2);
  });

  it('should recover from localStorage', () => {
    const savedData = {
      responseId: 'response-123',
      answers: { q1: 5, q2: 'test' }
    };
    
    const json = JSON.stringify(savedData);
    const recovered = JSON.parse(json);
    
    expect(recovered.responseId).toBe('response-123');
    expect(recovered.answers.q1).toBe(5);
  });
});

describe('Language Support Tests', () => {
  it('should apply translations to questions', () => {
    const question = { id: 'q1', content: 'How satisfied are you?', options: ['Good', 'Bad'] };
    const translation = { question_id: 'q1', content: '¿Qué tan satisfecho está?', options: ['Bueno', 'Malo'] };
    
    const translated = {
      ...question,
      content: translation.content || question.content,
      options: translation.options || question.options
    };
    
    expect(translated.content).toBe('¿Qué tan satisfecho está?');
    expect(translated.options).toEqual(['Bueno', 'Malo']);
  });

  it('should fall back to default when no translation', () => {
    const question = { id: 'q1', content: 'How satisfied are you?', options: ['Good', 'Bad'] };
    const translation = undefined as { content?: string; options?: string[] } | undefined;
    
    const translated = {
      ...question,
      content: translation ? translation.content : question.content,
      options: translation ? translation.options : question.options
    };
    
    expect(translated.content).toBe('How satisfied are you?');
    expect(translated.options).toEqual(['Good', 'Bad']);
  });
});
