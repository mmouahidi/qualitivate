import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userService, User } from '../../services/user.service';
import { DashboardLayout } from '../../components/layout';

const Users: React.FC = () => {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [formData, setFormData] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'user' });
    const [error, setError] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['users', search],
        queryFn: () => userService.getUsers({ search })
    });

    const createMutation = useMutation({
        mutationFn: userService.inviteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsCreateModalOpen(false);
            setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'user' });
            setError(null);
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to create user');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: userService.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setError(null);
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to delete user');
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to delete this user?')) {
            deleteMutation.mutate(id);
        }
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'super_admin': return 'badge-danger';
            case 'company_admin': return 'badge-warning';
            case 'site_manager': return 'badge-primary';
            default: return 'badge-neutral';
        }
    };

    if (currentUser?.role !== 'super_admin' && currentUser?.role !== 'company_admin') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="card-soft max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LockIcon className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-text-primary mb-2">Access Denied</h2>
                    <p className="text-text-secondary mb-6">
                        This page is only accessible to administrators.
                    </p>
                    <Link to="/dashboard" className="btn-primary">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            title="Users"
            subtitle="Manage user accounts and permissions"
            headerActions={
                currentUser?.role === 'super_admin' && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn-primary"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add User
                    </button>
                )
            }
        >
            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-soft pl-10"
                    />
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert-error mb-6">
                    <AlertIcon className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                        <p>{error}</p>
                    </div>
                    <button onClick={() => setError(null)} className="btn-icon text-red-600 hover:bg-red-100">
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Users Table */}
            <div className="card-soft p-0 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="spinner spinner-lg border-primary-600"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table-soft">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Created</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.data?.map((user: User) => (
                                    <tr key={user.id}>
                                        <td className="font-medium">{user.email}</td>
                                        <td className="text-text-secondary">
                                            {user.first_name && user.last_name
                                                ? `${user.first_name} ${user.last_name}`
                                                : '—'}
                                        </td>
                                        <td>
                                            <span className={getRoleBadgeClass(user.role)}>
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="text-text-secondary">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="text-right">
                                            {currentUser?.role === 'super_admin' && user.id !== currentUser.id && (
                                                <button
                                                    onClick={() => handleDelete(user.id)}
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
                                        <td colSpan={5} className="text-center py-8 text-text-secondary">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Create User</h2>
                        <form onSubmit={handleCreate}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label-soft">First Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="input-soft"
                                            placeholder="John"
                                        />
                                    </div>
                                    <div>
                                        <label className="label-soft">Last Name</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="input-soft"
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label-soft">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="input-soft"
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="label-soft">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="input-soft"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="label-soft">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="select-soft"
                                    >
                                        <option value="user">User</option>
                                        <option value="site_admin">Site Admin</option>
                                        <option value="company_admin">Company Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
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
                                    {createMutation.isPending ? (
                                        <>
                                            <span className="spinner spinner-sm mr-2"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create User'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

// Icon Components
const PlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

export default Users;
