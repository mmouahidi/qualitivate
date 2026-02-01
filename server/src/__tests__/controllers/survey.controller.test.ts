/**
 * Survey Controller Tests
 * Testing validation and API behavior
 */

// IMPORTANT: Mock database FIRST before any imports
// This creates a mock function that can be configured per test
const mockDbFn = jest.fn();
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: mockDbFn,
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-123'),
}));

import { Response } from 'express';

// Mock response helper
const createMockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

// Mock request helper
interface MockUser {
  userId: number;
  id?: string;
  email: string;
  role: string;
  companyId?: number;
}

const createMockRequest = (overrides: any = {}): any => ({
  params: {},
  query: {},
  body: {},
  ...overrides,
});

describe('Survey Controller - Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation
    mockDbFn.mockReset();
  });

  const mockUser: MockUser = {
    userId: 1,
    id: 'user-uuid-123',
    email: 'admin@test.com',
    role: 'company_admin',
    companyId: 1,
  };

  describe('createSurvey', () => {
    // Set up mock for createSurvey tests
    beforeEach(() => {
      // Mock a successful insert chain for when validation passes
      mockDbFn.mockImplementation((table: string) => ({
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 'new-survey-id' }]),
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 'new-survey-id', title: 'Test Survey' }),
      }));
    });

    it('should return 400 if title is missing', async () => {
      const { createSurvey } = require('../../controllers/survey.controller');
      
      const req = createMockRequest({
        body: {
          description: 'A survey without title',
          type: 'nps',
        },
        user: mockUser,
      });
      const res = createMockResponse();

      await createSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Title is required' });
    });

    it('should return 400 if title is empty string', async () => {
      const { createSurvey } = require('../../controllers/survey.controller');
      
      const req = createMockRequest({
        body: {
          title: '',
          type: 'nps',
        },
        user: mockUser,
      });
      const res = createMockResponse();

      await createSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Title is required' });
    });

    it('should return 400 if type is invalid', async () => {
      const { createSurvey } = require('../../controllers/survey.controller');
      
      const req = createMockRequest({
        body: {
          title: 'Test Survey',
          type: 'invalid_type',
        },
        user: mockUser,
      });
      const res = createMockResponse();

      await createSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Invalid survey type'),
        })
      );
    });

    it('should return 400 if type is missing', async () => {
      const { createSurvey } = require('../../controllers/survey.controller');
      
      const req = createMockRequest({
        body: {
          title: 'Test Survey',
        },
        user: mockUser,
      });
      const res = createMockResponse();

      await createSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Invalid survey type'),
        })
      );
    });

    it('should return 400 if isPublic is not boolean', async () => {
      const { createSurvey } = require('../../controllers/survey.controller');
      
      const req = createMockRequest({
        body: {
          title: 'Test Survey',
          type: 'nps',
          isPublic: 'yes',
        },
        user: mockUser,
      });
      const res = createMockResponse();

      await createSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'isPublic must be a boolean' });
    });

    it('should return 400 if isAnonymous is not boolean', async () => {
      const { createSurvey } = require('../../controllers/survey.controller');
      
      const req = createMockRequest({
        body: {
          title: 'Test Survey',
          type: 'nps',
          isPublic: true,
          isAnonymous: 'no',
        },
        user: mockUser,
      });
      const res = createMockResponse();

      await createSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'isAnonymous must be a boolean' });
    });

    it('should return 400 if date range is invalid', async () => {
      const { createSurvey } = require('../../controllers/survey.controller');
      
      const req = createMockRequest({
        body: {
          title: 'Test Survey',
          type: 'nps',
          isPublic: false,
          isAnonymous: false,
          startsAt: '2025-12-31',
          endsAt: '2025-01-01',
        },
        user: mockUser,
      });
      const res = createMockResponse();

      await createSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'startsAt must be before or equal to endsAt' });
    });
  });

  describe('listSurveys', () => {
    it('should deny access for regular users', async () => {
      mockDbFn.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
      }));

      const { listSurveys } = require('../../controllers/survey.controller');
      
      const req = createMockRequest({
        user: { ...mockUser, role: 'user' },
        query: {},
      });
      const res = createMockResponse();

      await listSurveys(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });
  });

  describe('getSurvey', () => {
    it('should return 404 if survey not found', async () => {
      mockDbFn.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      const { getSurvey } = require('../../controllers/survey.controller');
      
      const req = createMockRequest({
        params: { id: 'nonexistent-id' },
        user: mockUser,
      });
      const res = createMockResponse();

      await getSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Survey not found' });
    });

    it('should deny access for wrong company', async () => {
      mockDbFn.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 'survey-uuid-123',
          company_id: 999, // Different company
          title: 'Test Survey',
        }),
      }));

      const { getSurvey } = require('../../controllers/survey.controller');
      
      const req = createMockRequest({
        params: { id: 'survey-uuid-123' },
        user: mockUser, // companyId is 1
      });
      const res = createMockResponse();

      await getSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    });
  });

  describe('updateSurvey', () => {
    it('should return 404 if survey not found', async () => {
      mockDbFn.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      const { updateSurvey } = require('../../controllers/survey.controller');
      
      const req = createMockRequest({
        params: { id: 'nonexistent-id' },
        body: { title: 'Updated' },
        user: mockUser,
      });
      const res = createMockResponse();

      await updateSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Survey not found' });
    });

    it('should return 400 if title is empty', async () => {
      mockDbFn.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 'survey-uuid-123',
          company_id: 1,
          title: 'Original Title',
        }),
      }));

      const { updateSurvey } = require('../../controllers/survey.controller');
      
      const req = createMockRequest({
        params: { id: 'survey-uuid-123' },
        body: { title: '' },
        user: mockUser,
      });
      const res = createMockResponse();

      await updateSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Title cannot be empty' });
    });

    it('should return 400 if status is invalid', async () => {
      mockDbFn.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 'survey-uuid-123',
          company_id: 1,
          title: 'Test Survey',
          status: 'draft',
        }),
      }));

      const { updateSurvey } = require('../../controllers/survey.controller');
      
      const req = createMockRequest({
        params: { id: 'survey-uuid-123' },
        body: { status: 'invalid_status' },
        user: mockUser,
      });
      const res = createMockResponse();

      await updateSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Invalid status'),
        })
      );
    });
  });

  describe('deleteSurvey', () => {
    it('should return 404 if survey not found', async () => {
      mockDbFn.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      const { deleteSurvey } = require('../../controllers/survey.controller');
      
      const req = createMockRequest({
        params: { id: 'nonexistent-id' },
        user: mockUser,
      });
      const res = createMockResponse();

      await deleteSurvey(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Survey not found' });
    });
  });
});
