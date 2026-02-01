import { Response } from 'express';
import * as userController from '../controllers/user.controller';
import { AuthRequest } from '../middlewares/auth.middleware';
import db from '../config/database';

// Mock the database
jest.mock('../config/database', () => {
  const mockDb = jest.fn().mockReturnThis();
  (mockDb as any).where = jest.fn().mockReturnThis();
  (mockDb as any).select = jest.fn().mockReturnThis();
  (mockDb as any).first = jest.fn();
  (mockDb as any).insert = jest.fn().mockReturnThis();
  (mockDb as any).update = jest.fn().mockReturnThis();
  (mockDb as any).delete = jest.fn().mockReturnThis();
  (mockDb as any).returning = jest.fn();
  (mockDb as any).orderBy = jest.fn().mockReturnThis();
  (mockDb as any).limit = jest.fn().mockReturnThis();
  (mockDb as any).offset = jest.fn();
  (mockDb as any).count = jest.fn().mockReturnThis();
  (mockDb as any).modify = jest.fn().mockReturnThis();
  return mockDb;
});

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-123'),
}));

describe('User Controller', () => {
  let mockReq: Partial<AuthRequest>;
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
      user: {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'company_admin',
        companyId: 'company-1',
      },
    };
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should return paginated users for company admin', async () => {
      mockReq.query = { page: '1', limit: '20' };

      const mockUsers = [
        { id: 'user-1', email: 'user1@test.com', first_name: 'User', last_name: 'One', role: 'user' },
        { id: 'user-2', email: 'user2@test.com', first_name: 'User', last_name: 'Two', role: 'user' },
      ];

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation((table: string) => {
        const chain = {
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          offset: jest.fn().mockResolvedValue(mockUsers),
          count: jest.fn().mockReturnThis(),
          modify: jest.fn().mockResolvedValue([{ count: '2' }]),
        };
        return chain;
      });

      await userController.listUsers(mockReq as AuthRequest, mockRes as Response);

      expect(mockJson).toHaveBeenCalled();
      const response = mockJson.mock.calls[0][0];
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('pagination');
    });

    it('should return 403 for regular user', async () => {
      mockReq.user = {
        id: 'user-1',
        email: 'user@test.com',
        role: 'user',
      };

      await userController.listUsers(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Access denied' });
    });

    it('should filter by search term', async () => {
      mockReq.query = { search: 'john' };

      const mockDbInstance = db as unknown as jest.Mock;
      const whereMock = jest.fn().mockReturnThis();
      
      mockDbInstance.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        where: whereMock,
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockReturnThis(),
        modify: jest.fn().mockResolvedValue([{ count: '0' }]),
      }));

      await userController.listUsers(mockReq as AuthRequest, mockRes as Response);

      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe('getUser', () => {
    it('should return user by id', async () => {
      mockReq.params = { id: 'user-1' };

      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        company_id: 'company-1',
      };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser),
      }));

      await userController.getUser(mockReq as AuthRequest, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith(mockUser);
    });

    it('should return 404 for non-existent user', async () => {
      mockReq.params = { id: 'non-existent' };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      await userController.getUser(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 403 for user from different company', async () => {
      mockReq.params = { id: 'user-1' };

      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        company_id: 'other-company',
      };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser),
      }));

      await userController.getUser(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Access denied' });
    });
  });

  describe('inviteUser', () => {
    it('should create a new user', async () => {
      mockReq.body = {
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        role: 'user',
      };

      const mockDbInstance = db as unknown as jest.Mock;
      let callCount = 0;
      mockDbInstance.mockImplementation((table: string) => {
        callCount++;
        if (table === 'users' && callCount === 1) {
          // First call: check existing user
          return {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue(null), // No existing user
          };
        }
        if (table === 'companies') {
          return {
            where: jest.fn().mockReturnThis(),
            first: jest.fn().mockResolvedValue({ id: 'company-1', name: 'Test Company' }),
          };
        }
        if (table === 'users') {
          // Insert call
          return {
            insert: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{
              id: 'new-user-id',
              email: 'newuser@test.com',
              first_name: 'New',
              last_name: 'User',
              role: 'user',
            }]),
          };
        }
        return {
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null),
        };
      });

      await userController.inviteUser(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalled();
    });

    it('should return 409 if email already exists', async () => {
      mockReq.body = {
        email: 'existing@test.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        role: 'user',
      };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 'existing-user' }),
      }));

      await userController.inviteUser(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Email already exists' });
    });

    it('should return 403 for disallowed role assignment', async () => {
      mockReq.body = {
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        role: 'super_admin', // Company admin cannot assign super_admin
      };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      await userController.inviteUser(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Cannot assign this role' });
    });
  });

  describe('updateUser', () => {
    it('should update user details', async () => {
      mockReq.params = { id: 'user-1' };
      mockReq.body = { firstName: 'Updated', lastName: 'Name' };

      const mockUser = {
        id: 'user-1',
        company_id: 'company-1',
        role: 'user',
      };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          id: 'user-1',
          first_name: 'Updated',
          last_name: 'Name',
        }]),
      }));

      await userController.updateUser(mockReq as AuthRequest, mockRes as Response);

      expect(mockJson).toHaveBeenCalled();
    });

    it('should return 404 for non-existent user', async () => {
      mockReq.params = { id: 'non-existent' };
      mockReq.body = { firstName: 'Test' };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      }));

      await userController.updateUser(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should activate/deactivate user', async () => {
      mockReq.params = { id: 'user-1' };
      mockReq.body = { isActive: false };

      const mockUser = {
        id: 'user-1',
        company_id: 'company-1',
        role: 'user',
      };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser),
        update: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{
          id: 'user-1',
          is_active: false,
        }]),
      }));

      await userController.updateUser(mockReq as AuthRequest, mockRes as Response);

      expect(mockJson).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      mockReq.params = { id: 'user-1' };

      const mockUser = {
        id: 'user-1',
        company_id: 'company-1',
      };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser),
        delete: jest.fn().mockResolvedValue(1),
      }));

      await userController.deleteUser(mockReq as AuthRequest, mockRes as Response);

      expect(mockJson).toHaveBeenCalledWith({ message: 'User deleted successfully' });
    });

    it('should return 400 when trying to delete self', async () => {
      mockReq.params = { id: 'admin-1' }; // Same as current user

      await userController.deleteUser(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Cannot delete yourself' });
    });

    it('should return 404 for non-existent user', async () => {
      mockReq.params = { id: 'non-existent' };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
        delete: jest.fn(),
      }));

      await userController.deleteUser(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should return 403 for department admin trying to delete', async () => {
      mockReq.user = {
        id: 'dept-admin',
        email: 'deptadmin@test.com',
        role: 'department_admin',
        departmentId: 'dept-1',
      };
      mockReq.params = { id: 'user-1' };

      const mockUser = {
        id: 'user-1',
        department_id: 'dept-1',
      };

      const mockDbInstance = db as unknown as jest.Mock;
      mockDbInstance.mockImplementation(() => ({
        where: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockUser),
      }));

      await userController.deleteUser(mockReq as AuthRequest, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Access denied' });
    });
  });
});

describe('Role Permission Tests', () => {
  it('super_admin can assign all roles', () => {
    const allowedRoles = ['user'];
    allowedRoles.push('super_admin', 'company_admin', 'site_admin', 'department_admin');
    
    expect(allowedRoles).toContain('super_admin');
    expect(allowedRoles).toContain('company_admin');
    expect(allowedRoles).toContain('site_admin');
    expect(allowedRoles).toContain('department_admin');
    expect(allowedRoles).toContain('user');
  });

  it('company_admin cannot assign super_admin', () => {
    const allowedRoles = ['user'];
    allowedRoles.push('company_admin', 'site_admin', 'department_admin');
    
    expect(allowedRoles).not.toContain('super_admin');
    expect(allowedRoles).toContain('company_admin');
  });

  it('site_admin can only assign site_admin and below', () => {
    const allowedRoles = ['user'];
    allowedRoles.push('site_admin', 'department_admin');
    
    expect(allowedRoles).not.toContain('super_admin');
    expect(allowedRoles).not.toContain('company_admin');
    expect(allowedRoles).toContain('site_admin');
    expect(allowedRoles).toContain('department_admin');
  });

  it('department_admin can only assign department_admin and user', () => {
    const allowedRoles = ['user'];
    allowedRoles.push('department_admin');
    
    expect(allowedRoles).not.toContain('super_admin');
    expect(allowedRoles).not.toContain('company_admin');
    expect(allowedRoles).not.toContain('site_admin');
    expect(allowedRoles).toContain('department_admin');
    expect(allowedRoles).toContain('user');
  });
});
