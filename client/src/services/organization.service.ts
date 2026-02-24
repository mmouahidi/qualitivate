import api from './api';
import type { Company, Site, Department, User } from '../types';

// Response types for paginated list endpoints
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CompanyWithStats extends Company {
  stats?: {
    sites: number;
    users: number;
  };
}

export interface SiteWithStats extends Site {
  companyName?: string;
  stats?: {
    departments: number;
    users: number;
  };
}

export interface DepartmentWithStats extends Department {
  siteName?: string;
  stats?: {
    users: number;
  };
}

export const companyService = {
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Company>> {
    const response = await api.get('/companies', { params });
    return response.data;
  },

  async listAll(search?: string): Promise<PaginatedResponse<Company>> {
    // Fetch all companies for dropdown selectors (high limit)
    const response = await api.get('/companies', { params: { limit: 1000, search } });
    return response.data;
  },

  async get(id: string): Promise<CompanyWithStats> {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  async create(data: {
    name: string;
    slug: string;
    activity?: string;
    address?: string;
    city?: string;
    sitesCount?: number;
    employeesCount?: number;
    settings?: Record<string, any>
  }): Promise<Company> {
    const response = await api.post('/companies', data);
    return response.data;
  },

  async update(id: string, data: Partial<Company>): Promise<Company> {
    const response = await api.put(`/companies/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/companies/${id}`);
    return response.data;
  }
};

export const siteService = {
  async list(params?: { page?: number; limit?: number; search?: string; companyId?: string }): Promise<PaginatedResponse<SiteWithStats>> {
    const response = await api.get('/sites', { params });
    return response.data;
  },

  async listByCompany(companyId: string): Promise<PaginatedResponse<SiteWithStats>> {
    const response = await api.get('/sites', { params: { companyId, limit: 1000 } });
    return response.data;
  },

  async get(id: string): Promise<SiteWithStats> {
    const response = await api.get(`/sites/${id}`);
    return response.data;
  },

  async create(data: { name: string; location?: string; companyId: string }): Promise<Site> {
    const response = await api.post('/sites', data);
    return response.data;
  },

  async update(id: string, data: Partial<Site>): Promise<Site> {
    const response = await api.put(`/sites/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/sites/${id}`);
    return response.data;
  }
};

export const departmentService = {
  async list(params?: { page?: number; limit?: number; search?: string; siteId?: string }): Promise<PaginatedResponse<DepartmentWithStats>> {
    const response = await api.get('/departments', { params });
    return response.data;
  },

  async get(id: string): Promise<DepartmentWithStats> {
    const response = await api.get(`/departments/${id}`);
    return response.data;
  },

  async create(data: { name: string; siteId: string }): Promise<Department> {
    const response = await api.post('/departments', data);
    return response.data;
  },

  async update(id: string, data: Partial<Department>): Promise<Department> {
    const response = await api.put(`/departments/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/departments/${id}`);
    return response.data;
  }
};

export const userService = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    companyId?: string;
    siteId?: string;
    departmentId?: string;
  }): Promise<PaginatedResponse<User>> {
    const response = await api.get('/users', { params });
    return response.data;
  },

  async get(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  async invite(data: {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    role: string;
    companyId?: string;
    siteId?: string;
    departmentId?: string;
  }): Promise<User> {
    const response = await api.post('/users/invite', data);
    return response.data;
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  async bulkCreate(data: {
    users: Array<{
      email: string;
      firstName: string;
      lastName: string;
      password: string;
      role: string;
      companyId?: string;
      siteId?: string;
      departmentId?: string;
    }>;
  }): Promise<{ created: number; failed: { email: string; error: string }[] }> {
    const response = await api.post('/users/bulk', data);
    return response.data;
  }
};
