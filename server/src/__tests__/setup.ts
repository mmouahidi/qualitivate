import { Request, Response, NextFunction } from 'express';

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
