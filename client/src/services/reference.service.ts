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

/** Fallback industry list when API is unavailable (e.g. migration not run yet) */
export const FALLBACK_INDUSTRIES: Industry[] = [
  'Agriculture and fisheries', 'Mining and quarrying', 'Food products, beverage, and tobacco',
  'Textiles and textile products', 'Leather and leather products', 'Wood and wood products',
  'Pulp, paper, and paper products', 'Publishing companies', 'Printing companies',
  'Manufacture of coke and refined petroleum products', 'Nuclear fuel',
  'Chemicals, chemical products, and fibers', 'Pharmaceuticals', 'Rubber and plastic products',
  'Non-metallic mineral products (Glass, ceramics, stone)', 'Concrete, cement, lime, plaster, etc.',
  'Metal production', 'Metal work and supply of metal products', 'Machinery and equipment',
  'Electrical and optical equipment', 'Shipbuilding', 'Aerospace', 'Other transport equipment',
  'Manufacturing not elsewhere classified (Jewelry, furniture, toys)', 'Recycling',
  'Electricity supply', 'Gas supply', 'Water supply', 'Construction',
  'Wholesale and retail trade', 'Maintenance and repair of motor vehicles and goods',
  'Hotels and restaurants', 'Transport, storage, and communication', 'Postage and Telecommunications',
  'Real Estate', 'Renting, Credit, and Insurance services', 'Information technology',
  'Design and Development', 'Architecture and Engineering services', 'Professional services for companies',
  'Public administration', 'Education', 'Health, veterinary, and social work',
  'Other public and private services',
].map((name, i) => ({
  id: `fallback-${i}`,
  name,
  slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  orderIndex: i + 1,
}));

export const referenceService = {
  async getIndustries(): Promise<{ data: Industry[] }> {
    try {
      const response = await api.get<{ data: Industry[] }>('/reference/industries');
      return response.data;
    } catch {
      return { data: FALLBACK_INDUSTRIES };
    }
  },

  async getJobPositions(): Promise<{ data: JobPosition[] }> {
    const response = await api.get<{ data: JobPosition[] }>('/reference/job-positions');
    return response.data;
  },
};
