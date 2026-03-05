import { Request, Response, NextFunction } from 'express';

process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-chars-long';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-at-least-32-chars';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'testpass';
process.env.SMTP_FROM = 'noreply@test.com';

// Test utilities
export const mockRequest = (overrides: any = {}): any => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: undefined,
  ...overrides,
});

export const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    type: jest.fn().mockReturnThis(),
  };
  return res;
};

export const mockNext: NextFunction = jest.fn();

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Console spy to suppress logs during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
