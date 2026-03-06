import api from './api';

export interface Industry {
  id: string;
  name: string;
  slug: string;
  orderIndex: number;
}

export interface JobPosition {
  id: string;
  department: string;
  position: string;
  orderIndex: number;
}

export const referenceService = {
  async getIndustries(): Promise<{ data: Industry[] }> {
    const response = await api.get<{ data: Industry[] }>('/reference/industries');
    return response.data;
  },

  async getJobPositions(): Promise<{ data: JobPosition[] }> {
    const response = await api.get<{ data: JobPosition[] }>('/reference/job-positions');
    return response.data;
  },
};
