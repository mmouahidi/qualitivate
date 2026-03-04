import api from './api';

export interface TaxonomyDimension {
    id: string;
    name: string;
    orderIndex: number;
}

export interface TaxonomyCategory {
    id: string;
    name: string;
    orderIndex: number;
    dimensions: TaxonomyDimension[];
}

export const taxonomyService = {
    async listCategories(): Promise<{ data: TaxonomyCategory[] }> {
        const response = await api.get('/taxonomy/categories');
        return response.data;
    },

    async getCategory(id: string): Promise<TaxonomyCategory> {
        const response = await api.get(`/taxonomy/categories/${id}`);
        return response.data;
    },
};
