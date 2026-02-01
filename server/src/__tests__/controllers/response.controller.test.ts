/**
 * Response Controller Tests
 * Testing validation and API behavior
 */
import { Request, Response } from 'express';

// Mock response helper
const createMockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

// Mock request helper
const createMockRequest = (overrides: Partial<Request> = {}): Partial<Request> => ({
  params: {},
  query: {},
  body: {},
  ...overrides,
});

describe('Response Controller - Validation Tests', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('getPublicSurvey', () => {
    it('should return 404 if survey not found', async () => {
      jest.mock('../../config/database', () => ({
        __esModule: true,
        default: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null),
        })),
      }));

      const { getPublicSurvey } = require('../../controllers/response.controller');
      
      const req = createMockRequest({
        params: { surveyId: '999' },
        query: {},
      });
      const res = createMockResponse();

      await getPublicSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Survey not found or not active' });
    });

    it('should return 400 if survey has not started yet', async () => {
      const futureDate = new Date(Date.now() + 86400000); // tomorrow
      
      jest.mock('../../config/database', () => ({
        __esModule: true,
        default: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({
            id: 1,
            title: 'Test Survey',
            status: 'active',
            starts_at: futureDate,
            ends_at: null,
          }),
        })),
      }));

      const { getPublicSurvey } = require('../../controllers/response.controller');
      
      const req = createMockRequest({
        params: { surveyId: '1' },
        query: {},
      });
      const res = createMockResponse();

      await getPublicSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Survey has not started yet' });
    });

    it('should return 400 if survey has ended', async () => {
      const pastDate = new Date(Date.now() - 86400000); // yesterday
      
      jest.mock('../../config/database', () => ({
        __esModule: true,
        default: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({
            id: 1,
            title: 'Test Survey',
            status: 'active',
            starts_at: null,
            ends_at: pastDate,
          }),
        })),
      }));

      const { getPublicSurvey } = require('../../controllers/response.controller');
      
      const req = createMockRequest({
        params: { surveyId: '1' },
        query: {},
      });
      const res = createMockResponse();

      await getPublicSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Survey has ended' });
    });
  });

  describe('startResponse', () => {
    it('should return 404 if survey not active', async () => {
      jest.mock('../../config/database', () => ({
        __esModule: true,
        default: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null),
        })),
      }));

      const { startResponse } = require('../../controllers/response.controller');
      
      const req = createMockRequest({
        params: { surveyId: '1' },
        body: {},
      });
      const res = createMockResponse();

      await startResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Survey not found or not active' });
    });
  });

  describe('saveAnswer', () => {
    it('should return 404 if response not found', async () => {
      jest.mock('../../config/database', () => ({
        __esModule: true,
        default: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          whereIn: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null),
        })),
      }));

      const { saveAnswer } = require('../../controllers/response.controller');
      
      const req = createMockRequest({
        params: { responseId: 'invalid-id' },
        body: { questionId: 1, value: 'test' },
      });
      const res = createMockResponse();

      await saveAnswer(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Response not found or already completed' });
    });
  });

  describe('submitAnswers', () => {
    it('should return 404 if response not found', async () => {
      jest.mock('../../config/database', () => ({
        __esModule: true,
        default: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          whereIn: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null),
        })),
      }));

      const { submitAnswers } = require('../../controllers/response.controller');
      
      const req = createMockRequest({
        params: { responseId: 'invalid-id' },
        body: { answers: [] },
      });
      const res = createMockResponse();

      await submitAnswers(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Response not found or already completed' });
    });
  });

  describe('completeResponse', () => {
    it('should return 404 if response not started', async () => {
      jest.mock('../../config/database', () => ({
        __esModule: true,
        default: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null),
        })),
      }));

      const { completeResponse } = require('../../controllers/response.controller');
      
      const req = createMockRequest({
        params: { responseId: 'invalid-id' },
      });
      const res = createMockResponse();

      await completeResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Response not found or already completed' });
    });
  });

  describe('getSurveyLanguages', () => {
    it('should return 404 if survey not found', async () => {
      jest.mock('../../config/database', () => ({
        __esModule: true,
        default: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null),
        })),
      }));

      const { getSurveyLanguages } = require('../../controllers/response.controller');
      
      const req = createMockRequest({
        params: { surveyId: '999' },
      });
      const res = createMockResponse();

      await getSurveyLanguages(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Survey not found' });
    });
  });
});
