/**
 * Distribution Controller Tests
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

describe('Distribution Controller - Validation Tests', () => {
  describe('createEmailDistribution', () => {
    // Import fresh for each test to get clean state
    let createEmailDistribution: any;
    
    beforeEach(() => {
      jest.resetModules();
      jest.mock('../../config/database', () => ({
        __esModule: true,
        default: jest.fn(() => ({
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null),
        })),
      }));
    });

    it('should return 400 if emails array is empty', async () => {
      const { createEmailDistribution } = require('../../controllers/distribution.controller');
      
      const req = createMockRequest({
        params: { surveyId: '1' },
        body: { emails: [] },
      });
      const res = createMockResponse();

      await createEmailDistribution(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email list is required' });
    });

    it('should return 400 if emails is not provided', async () => {
      const { createEmailDistribution } = require('../../controllers/distribution.controller');
      
      const req = createMockRequest({
        params: { surveyId: '1' },
        body: {},
      });
      const res = createMockResponse();

      await createEmailDistribution(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email list is required' });
    });

    it('should return 400 if emails is not an array', async () => {
      const { createEmailDistribution } = require('../../controllers/distribution.controller');
      
      const req = createMockRequest({
        params: { surveyId: '1' },
        body: { emails: 'not-an-array' },
      });
      const res = createMockResponse();

      await createEmailDistribution(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email list is required' });
    });
  });

  describe('sendToGroup', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should return 400 if no group specified', async () => {
      jest.mock('../../config/database', () => ({
        __esModule: true,
        default: jest.fn((table: string) => {
          if (table === 'surveys') {
            return {
              where: jest.fn().mockReturnThis(),
              first: jest.fn().mockResolvedValue({ id: 1, title: 'Test' }),
            };
          }
          return {
            where: jest.fn().mockReturnThis(),
            select: jest.fn().mockResolvedValue([]),
          };
        }),
      }));

      const { sendToGroup } = require('../../controllers/distribution.controller');
      
      const req = createMockRequest({
        params: { surveyId: '1' },
        body: {},
      });
      const res = createMockResponse();

      await sendToGroup(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Must specify departmentId, siteId, or companyId' 
      });
    });
  });
});
