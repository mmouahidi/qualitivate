import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '../../services/organization.service';
import type { Company } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout';

const Companies: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '' });
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['companies', search],
    queryFn: () => companyService.list({ search })
  });

  const createMutation = useMutation({
    mutationFn: companyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', slug: '' });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create company');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: companyService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to delete company');
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this company?')) {
      deleteMutation.mutate(id);
    }
  };

  if (user?.role !== 'super_admin' && user?.role !== 'company_admin') {
    return (
      <DashboardLayout title="Companies">
        <div className="alert-error">
          <p>Access denied. This page is only accessible to administrators.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Companies"
      subtitle="Manage your organization's companies"
      headerActions={
        user?.role === 'super_admin' && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
          >
            Add Company
          </button>
        )
      }
    >
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-soft max-w-md"
        />
      </div>

      {error && (
        <div className="alert-error mb-6">
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="spinner spinner-lg border-primary-600"></div>
        </div>
      ) : (
        <div className="card-soft p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-soft">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((company: Company) => (
                  <tr key={company.id}>
                    <td className="font-medium">{company.name}</td>
                    <td className="text-text-secondary">{company.slug}</td>
                    <td className="text-text-secondary">
                      {new Date(company.createdAt).toLocaleDateString()}
                    </td>
                    <td className="text-right">
                      {user?.role === 'super_admin' && (
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {(!data?.data || data.data.length === 0) && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-text-secondary">
                      No companies found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create Company</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="label-soft">Company Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-soft"
                />
              </div>
              <div className="mb-4">
                <label className="label-soft">Slug</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="input-soft"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Companies;
