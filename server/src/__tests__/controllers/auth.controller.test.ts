/**
 * Auth Controller Tests
 * Testing validation and API behavior
 */

// IMPORTANT: Mock database FIRST before any imports
const mockDbFn = jest.fn();
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: mockDbFn,
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-123'),
}));

import { Response } from 'express';
import bcrypt from 'bcrypt';

// Set environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Mock response helper
const createMockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res as Response;
};

// Mock request helper - using any to allow custom properties like 'user'
const createMockRequest = (overrides: any = {}): any => ({
  params: {},
  query: {},
  body: {},
  ...overrides,
});

describe('Auth Controller - Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDbFn.mockReset();
  });

  describe('register', () => {
    it('should return 400 if email is missing', async () => {
      // Mock db to return no existing user
      mockDbFn.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
        insert: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 1, uuid: 'mock-uuid-123' }]),
      }));

      const { register } = require('../../controllers/auth.controller');
      
      const req = createMockRequest({
        body: {
          password: 'password123',
          name: 'Test User',
        },
      });
      const res = createMockResponse();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
    });

    it('should return 400 if password is missing', async () => {
      mockDbFn.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      const { register } = require('../../controllers/auth.controller');
      
      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          name: 'Test User',
        },
      });
      const res = createMockResponse();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
    });

    it('should return 409 if email already exists', async () => {
      // Mock db to return existing user
      mockDbFn.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ 
          id: 1, 
          email: 'existing@example.com' 
        }),
      }));

      const { register } = require('../../controllers/auth.controller');
      
      const req = createMockRequest({
        body: {
          email: 'existing@example.com',
          password: 'password123',
          name: 'Test User',
        },
      });
      const res = createMockResponse();

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email already exists' });
    });

    it('should hash password before storing', async () => {
      // First call returns no existing user, second is for insert
      let callCount = 0;
      mockDbFn.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call - check for existing user
          return {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null),
          };
        }
        // Subsequent calls - for insert
        return {
          insert: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([{ 
            id: 1, 
            uuid: 'mock-uuid-123',
            email: 'newuser@example.com',
            name: 'New User',
            role: 'user'
          }]),
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({
            id: 1,
            uuid: 'mock-uuid-123',
            email: 'newuser@example.com',
            name: 'New User',
            role: 'user'
          }),
        };
      });

      const { register } = require('../../controllers/auth.controller');
      
      const req = createMockRequest({
        body: {
          email: 'newuser@example.com',
          password: 'plainpassword',
          name: 'New User',
        },
      });
      const res = createMockResponse();

      await register(req, res);

      // Should have called bcrypt.hash with the plain password
      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', expect.any(Number));
    });
  });

  describe('login', () => {
    it('should return 400 if email is missing', async () => {
      mockDbFn.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      const { login } = require('../../controllers/auth.controller');
      
      const req = createMockRequest({
        body: {
          password: 'password123',
        },
      });
      const res = createMockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
    });

    it('should return 400 if password is missing', async () => {
      mockDbFn.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      const { login } = require('../../controllers/auth.controller');
      
      const req = createMockRequest({
        body: {
          email: 'test@example.com',
        },
      });
      const res = createMockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Email and password are required' });
    });

    it('should return 401 for invalid email', async () => {
      // Mock db to return no user
      mockDbFn.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      const { login } = require('../../controllers/auth.controller');
      
      const req = createMockRequest({
        body: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      });
      const res = createMockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
    });

    it('should return 401 for invalid password', async () => {
      // Mock db to return a user
      mockDbFn.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 1,
          uuid: 'user-uuid-123',
          email: 'test@example.com',
          password: 'hashed_password',
          name: 'Test User',
        }),
      }));

      // Mock bcrypt.compare to return false (invalid password)
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const { login } = require('../../controllers/auth.controller');
      
      const req = createMockRequest({
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      });
      const res = createMockResponse();

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid email or password' });
    });
  });

  describe('refreshAccessToken', () => {
    it('should return 401 if refresh token not provided', async () => {
      const { refreshAccessToken } = require('../../controllers/auth.controller');
      
      const req = createMockRequest({
        body: {},
      });
      const res = createMockResponse();

      await refreshAccessToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Refresh token required' });
    });
  });

  describe('logout', () => {
    it('should succeed even without refresh token', async () => {
      const { logout } = require('../../controllers/auth.controller');
      
      const req = createMockRequest({
        body: {},
      });
      const res = createMockResponse();

      await logout(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });

    it('should succeed with refresh token', async () => {
      // Mock db to delete token
      mockDbFn.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        delete: jest.fn().mockResolvedValue(1),
      }));

      const { logout } = require('../../controllers/auth.controller');
      
      const req = createMockRequest({
        body: {
          refreshToken: 'some-refresh-token',
        },
      });
      const res = createMockResponse();

      await logout(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });

  describe('me', () => {
    it('should return 401 if user not in request', async () => {
      const { me } = require('../../controllers/auth.controller');
      
      const req = createMockRequest({
        // No user property
      });
      const res = createMockResponse();

      await me(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    });

    it('should return 404 if user not found in database', async () => {
      // Mock db to return no user
      mockDbFn.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      const { me } = require('../../controllers/auth.controller');
      
      const req = createMockRequest({
        user: { id: 'deleted-user-id' },
      });
      const res = createMockResponse();

      await me(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });
  });
});
