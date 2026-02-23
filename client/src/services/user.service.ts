import api from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'company_admin' | 'site_admin' | 'department_admin' | 'user';
  companyId: string | null;
  siteId: string | null;
  departmentId: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PaginatedUsers {
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InviteUserData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  companyId?: string;
  siteId?: string;
  departmentId?: string;
}

export interface UpdateUserData {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive?: boolean;
  siteId?: string | null;
  departmentId?: string | null;
}

class UserService {
  /**
   * Get paginated list of users
   */
  async getUsers(options?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    companyId?: string;
    siteId?: string;
    departmentId?: string;
  }): Promise<PaginatedUsers> {
    const response = await api.get<PaginatedUsers>('/users', { params: options });
    return response.data;
  }

  /**
   * Get a single user by ID
   */
  async getUser(id: string): Promise<User> {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  }

  /**
   * Invite a new user
   */
  async inviteUser(data: InviteUserData): Promise<User> {
    const response = await api.post<User>('/users/invite', data);
    return response.data;
  }

  /**
   * Update a user
   */
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const response = await api.put<User>(`/users/${id}`, data);
    return response.data;
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  }

  /**
   * Get role display name
   */
  getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      super_admin: 'Super Admin',
      company_admin: 'Company Admin',
      site_admin: 'Site Admin',
      department_admin: 'Department Admin',
      user: 'User',
    };
    return roleNames[role] || role;
  }

  /**
   * Get roles that the current user can assign
   */
  getAssignableRoles(currentUserRole: string): string[] {
    const roles: Record<string, string[]> = {
      super_admin: ['super_admin', 'company_admin', 'site_admin', 'department_admin', 'user'],
      company_admin: ['company_admin', 'site_admin', 'department_admin', 'user'],
      site_admin: ['site_admin', 'department_admin', 'user'],
      department_admin: ['department_admin', 'user'],
      user: ['user'],
    };
    return roles[currentUserRole] || ['user'];
  }

  /**
   * Bulk create users
   */
  async bulkCreateUsers(users: InviteUserData[]): Promise<{ created: number; failed: { email: string; error: string }[] }> {
    const response = await api.post<{ created: number; failed: { email: string; error: string }[] }>('/users/bulk', { users });
    return response.data;
  }
}

export const userService = new UserService();
export default userService;
