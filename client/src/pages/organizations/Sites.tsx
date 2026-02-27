import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { siteService, companyService } from '../../services/organization.service';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout';

const Sites: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', location: '', companyId: '' });
  const [error, setError] = useState<string | null>(null);
  const [editingSite, setEditingSite] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch all companies for dropdown (use listAll for super_admin to get more than 20)
  const { data: companiesData } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => companyService.listAll(),
    enabled: user?.role === 'super_admin'
  });

  const { data, isLoading } = useQuery({
    queryKey: ['sites', search],
    queryFn: () => siteService.list({ search })
  });

  const createMutation = useMutation({
    mutationFn: siteService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsCreateModalOpen(false);
      setFormData({ name: '', location: '', companyId: '' });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create site');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: siteService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to delete site');
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the site "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => siteService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setIsEditModalOpen(false);
      setEditingSite(null);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to update site');
    }
  });

  const handleEdit = (site: any) => {
    setEditingSite({ ...site });
    setIsEditModalOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSite) return;
    updateMutation.mutate({
      id: editingSite.id,
      data: { name: editingSite.name, location: editingSite.location }
    });
  };

  return (
    <DashboardLayout
      title="Sites"
      subtitle="Manage your organization's sites and locations"
      headerActions={
        (user?.role === 'super_admin' || user?.role === 'company_admin') && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
          >
            Add Site
          </button>
        )
      }
    >
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search sites..."
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
                  <th>Location</th>
                  <th>Company</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((site: any) => (
                  <tr key={site.id}>
                    <td className="font-medium">{site.name}</td>
                    <td className="text-text-secondary">{site.location || '-'}</td>
                    <td className="text-text-secondary">{site.companyName}</td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleEdit(site)}
                          className="btn-ghost text-primary-600 hover:text-primary-700 hover:bg-primary-50 text-sm"
                        >
                          Edit
                        </button>
                        {(user?.role === 'super_admin' || user?.role === 'company_admin') && (
                          <button
                            onClick={() => handleDelete(site.id, site.name)}
                            className="btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.data || data.data.length === 0) && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-text-secondary">
                      No sites found
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
            <h2 className="modal-title">Create Site</h2>
            <form onSubmit={handleCreate}>
              {user?.role === 'super_admin' && (
                <div className="mb-4">
                  <label className="label-soft">Company</label>
                  <select
                    required
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="select-soft"
                  >
                    <option value="">Select Company</option>
                    {companiesData?.data?.map((company: any) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mb-4">
                <label className="label-soft">Site Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-soft"
                />
              </div>
              <div className="mb-4">
                <label className="label-soft">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                  className="btn-primary"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Site Modal */}
      {isEditModalOpen && editingSite && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Edit Site</h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="label-soft">Site Name</label>
                <input
                  type="text"
                  required
                  value={editingSite.name}
                  onChange={(e) => setEditingSite({ ...editingSite, name: e.target.value })}
                  className="input-soft"
                />
              </div>
              <div className="mb-4">
                <label className="label-soft">Location</label>
                <input
                  type="text"
                  value={editingSite.location || ''}
                  onChange={(e) => setEditingSite({ ...editingSite, location: e.target.value })}
                  className="input-soft"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="btn-primary"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Sites;
