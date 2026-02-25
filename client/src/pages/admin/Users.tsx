import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userService, User, InviteUserData, UpdateUserData } from '../../services/user.service';
import { companyService, siteService } from '../../services/organization.service';
import { DashboardLayout } from '../../components/layout';
import { ConfirmModal } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';

const Users: React.FC = () => {
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
    const [credentialsTarget, setCredentialsTarget] = useState<{ id: string | null; email: string }>({ id: null, email: '' });
    const [deleteModalState, setDeleteModalState] = useState<{ isOpen: boolean; userId: string | null }>({ isOpen: false, userId: null });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<User | null>(null);
    const [editForm, setEditForm] = useState<UpdateUserData>({
        firstName: '',
        lastName: '',
        role: 'user',
        isActive: true,
        siteId: null,
        departmentId: null
    });
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'user',
        companyId: '',
        siteId: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [bulkData, setBulkData] = useState<InviteUserData[]>([]);
    const [bulkResult, setBulkResult] = useState<{ created: number; failed: { email: string; error: string }[] } | null>(null);
    const [credentialsForm, setCredentialsForm] = useState({ email: '', password: '' });

    // Fetch companies for super_admin
    const { data: companiesData } = useQuery({
        queryKey: ['companies-list'],
        queryFn: () => companyService.listAll(),
        enabled: currentUser?.role === 'super_admin'
    });

    // Fetch sites based on selected company
    const { data: sitesData } = useQuery({
        queryKey: ['sites-list', formData.companyId],
        queryFn: () => formData.companyId ? siteService.listByCompany(formData.companyId) : siteService.list({ limit: 1000 }),
        enabled: !!formData.companyId || currentUser?.role === 'company_admin'
    });

    const { data, isLoading } = useQuery({
        queryKey: ['users', search],
        queryFn: () => userService.getUsers({ search })
    });

    const createMutation = useMutation({
        mutationFn: userService.inviteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsCreateModalOpen(false);
            setFormData({ email: '', password: '', firstName: '', lastName: '', role: 'user', companyId: '', siteId: '' });
            setError(null);
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to create user');
        }
    });

    const bulkMutation = useMutation({
        mutationFn: userService.bulkCreateUsers,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setBulkResult(result);
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to bulk create users');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: userService.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setError(null);
            setDeleteModalState({ isOpen: false, userId: null });
            toast.success('User deleted', 'The user has been removed successfully.');
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to delete user');
            toast.error('Failed to delete user', err.response?.data?.error || 'An error occurred.');
        }
    });

    const updateCredentialsMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { email?: string; password?: string } }) =>
            userService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsCredentialsModalOpen(false);
            setCredentialsTarget({ id: null, email: '' });
            setCredentialsForm({ email: '', password: '' });
            toast.success('Credentials updated', 'User credentials updated successfully.');
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to update credentials');
            toast.error('Failed to update credentials', err.response?.data?.error || 'An error occurred.');
        }
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
            userService.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsEditModalOpen(false);
            setEditTarget(null);
            toast.success('User updated', 'User information updated successfully.');
        },
        onError: (err: any) => {
            setError(err.response?.data?.error || 'Failed to update user');
            toast.error('Failed to update user', err.response?.data?.error || 'An error occurred.');
        }
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: InviteUserData = {
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role
        };
        if (formData.companyId) payload.companyId = formData.companyId;
        if (formData.siteId) payload.siteId = formData.siteId;
        createMutation.mutate(payload);
    };

    const handleDelete = (id: string) => {
        setDeleteModalState({ isOpen: true, userId: id });
    };

    const handleEditCredentials = (id: string, email: string) => {
        setCredentialsTarget({ id, email });
        setCredentialsForm({ email, password: '' });
        setIsCredentialsModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditTarget(user);
        setEditForm({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            role: user.role,
            isActive: user.isActive,
            siteId: user.siteId,
            departmentId: user.departmentId
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!editTarget) return;
        updateUserMutation.mutate({ id: editTarget.id, data: editForm });
    };

    const confirmDelete = () => {
        if (deleteModalState.userId) {
            deleteMutation.mutate(deleteModalState.userId);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                setError('CSV file must have at least a header row and one data row');
                return;
            }

            const header = lines[0].toLowerCase().split(',').map(h => h.trim());
            const emailIndex = header.findIndex(h => h === 'email');
            const passwordIndex = header.findIndex(h => h === 'password');
            const firstNameIndex = header.findIndex(h => h.includes('first') || h === 'firstname');
            const lastNameIndex = header.findIndex(h => h.includes('last') || h === 'lastname');
            const roleIndex = header.findIndex(h => h === 'role');
            const companyIdIndex = header.findIndex(h => h === 'companyid' || h === 'company_id');
            const siteIdIndex = header.findIndex(h => h === 'siteid' || h === 'site_id');

            if (emailIndex === -1 || passwordIndex === -1) {
                setError('CSV must have "email" and "password" columns');
                return;
            }

            const users: InviteUserData[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                if (!values[emailIndex]) continue;

                const user: InviteUserData = {
                    email: values[emailIndex],
                    password: values[passwordIndex],
                    firstName: firstNameIndex >= 0 ? values[firstNameIndex] || '' : '',
                    lastName: lastNameIndex >= 0 ? values[lastNameIndex] || '' : '',
                    role: roleIndex >= 0 ? values[roleIndex] || 'user' : 'user'
                };
                if (companyIdIndex >= 0 && values[companyIdIndex]) {
                    user.companyId = values[companyIdIndex];
                }
                if (siteIdIndex >= 0 && values[siteIdIndex]) {
                    user.siteId = values[siteIdIndex];
                }
                users.push(user);
            }

            setBulkData(users);
            setBulkResult(null);
            setError(null);
        };
        reader.readAsText(file);
    };

    const handleBulkUpload = () => {
        if (bulkData.length === 0) {
            setError('No users to upload');
            return;
        }
        bulkMutation.mutate(bulkData);
    };

    const handleUpdateCredentials = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!credentialsTarget.id) return;

        const updates: { email?: string; password?: string } = {};
        if (credentialsForm.email && credentialsForm.email !== credentialsTarget.email) {
            updates.email = credentialsForm.email;
        }
        if (credentialsForm.password) {
            updates.password = credentialsForm.password;
        }

        if (Object.keys(updates).length === 0) {
            setError('Provide a new email and/or password');
            return;
        }

        updateCredentialsMutation.mutate({ id: credentialsTarget.id, data: updates });
    };

    const downloadTemplate = () => {
        const csvContent = 'email,password,firstName,lastName,role,companyId,siteId\nuser@example.com,password123,John,Doe,user,,\n';
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'super_admin': return 'badge-danger';
            case 'company_admin': return 'badge-warning';
            case 'site_admin': return 'badge-primary';
            case 'department_admin': return 'badge-info';
            default: return 'badge-neutral';
        }
    };

    const companies = companiesData?.data || [];
    const sites = sitesData?.data || [];

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
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setBulkData([]);
                            setBulkResult(null);
                            setIsBulkModalOpen(true);
                        }}
                        className="btn-secondary"
                    >
                        <UploadIcon className="w-5 h-5 mr-2" />
                        Bulk Upload
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn-primary"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add User
                    </button>
                </div>
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
                                    <th>Company</th>
                                    <th>Created</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.data?.map((user: User) => (
                                    <tr key={user.id}>
                                        <td className="font-medium">{user.email}</td>
                                        <td className="text-text-secondary">
                                            {user.firstName && user.lastName
                                                ? `${user.firstName} ${user.lastName}`
                                                : '—'}
                                        </td>
                                        <td>
                                            <span className={getRoleBadgeClass(user.role)}>
                                                {user.role.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="text-text-secondary text-sm">
                                            {user.companyId ? (
                                                <span className="truncate max-w-[150px] inline-block">
                                                    {companies.find(c => c.id === user.companyId)?.name || 'Assigned'}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td className="text-text-secondary">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="text-right">
                                            {(currentUser?.role === 'super_admin' || currentUser?.role === 'company_admin') && user.id !== currentUser.id && (
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => handleEditUser(user)}
                                                        className="btn-ghost text-text-secondary hover:text-text-primary text-sm"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditCredentials(user.id, user.email)}
                                                        className="btn-ghost text-text-secondary hover:text-text-primary text-sm"
                                                    >
                                                        Credentials
                                                    </button>
                                                    {currentUser?.role === 'super_admin' && (
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            className="btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 text-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {(!data?.data || data.data.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-text-secondary">
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
                    <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
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
                                        <option value="department_admin">Department Admin</option>
                                        <option value="site_admin">Site Admin</option>
                                        <option value="company_admin">Company Admin</option>
                                        {currentUser?.role === 'super_admin' && (
                                            <option value="super_admin">Super Admin</option>
                                        )}
                                    </select>
                                </div>

                                {/* Company Selection - Only for super_admin */}
                                {currentUser?.role === 'super_admin' && (
                                    <div>
                                        <label className="label-soft">Company</label>
                                        <select
                                            value={formData.companyId}
                                            onChange={(e) => setFormData({ ...formData, companyId: e.target.value, siteId: '' })}
                                            className="select-soft"
                                        >
                                            <option value="">— No Company (Super Admin) —</option>
                                            {companies.map((company) => (
                                                <option key={company.id} value={company.id}>
                                                    {company.name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-text-muted mt-1">
                                            Leave empty for platform-level users (super admins)
                                        </p>
                                    </div>
                                )}

                                {/* Site Selection - When company is selected */}
                                {(formData.companyId || currentUser?.role === 'company_admin') && (
                                    <div>
                                        <label className="label-soft">Site</label>
                                        <select
                                            value={formData.siteId}
                                            onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                                            className="select-soft"
                                        >
                                            <option value="">— No Site (Company Level) —</option>
                                            {sites.map((site) => (
                                                <option key={site.id} value={site.id}>
                                                    {site.name}
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-text-muted mt-1">
                                            Leave empty for company-level access
                                        </p>
                                    </div>
                                )}
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

            {/* Bulk Upload Modal */}
            {isBulkModalOpen && (
                <div className="modal-overlay" onClick={() => setIsBulkModalOpen(false)}>
                    <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Bulk Upload Users</h2>

                        <div className="space-y-4">
                            {/* Instructions */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="font-medium text-blue-800 mb-2">CSV Format Instructions</h3>
                                <p className="text-sm text-blue-700 mb-2">
                                    Upload a CSV file with the following columns:
                                </p>
                                <ul className="text-sm text-blue-700 list-disc ml-5 space-y-1">
                                    <li><strong>email</strong> (required) - User's email address</li>
                                    <li><strong>password</strong> (required) - Initial password</li>
                                    <li><strong>firstName</strong> - First name</li>
                                    <li><strong>lastName</strong> - Last name</li>
                                    <li><strong>role</strong> - user, department_admin, site_admin, company_admin</li>
                                    <li><strong>companyId</strong> - Company UUID (super_admin only)</li>
                                    <li><strong>siteId</strong> - Site UUID</li>
                                </ul>
                                <button
                                    onClick={downloadTemplate}
                                    className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                    Download CSV Template
                                </button>
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="label-soft">Upload CSV File</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="input-soft"
                                />
                            </div>

                            {/* Preview */}
                            {bulkData.length > 0 && !bulkResult && (
                                <div className="border border-border rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-border">
                                        <span className="font-medium">{bulkData.length} users ready to upload</span>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        <table className="table-soft text-sm">
                                            <thead>
                                                <tr>
                                                    <th>Email</th>
                                                    <th>Name</th>
                                                    <th>Role</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bulkData.slice(0, 10).map((user, i) => (
                                                    <tr key={i}>
                                                        <td>{user.email}</td>
                                                        <td>{user.firstName} {user.lastName}</td>
                                                        <td>{user.role}</td>
                                                    </tr>
                                                ))}
                                                {bulkData.length > 10 && (
                                                    <tr>
                                                        <td colSpan={3} className="text-center text-text-muted">
                                                            ...and {bulkData.length - 10} more
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Results */}
                            {bulkResult && (
                                <div className="space-y-3">
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <p className="text-green-800 font-medium">
                                            ✓ {bulkResult.created} users created successfully
                                        </p>
                                    </div>

                                    {bulkResult.failed.length > 0 && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <p className="text-red-800 font-medium mb-2">
                                                ✗ {bulkResult.failed.length} users failed
                                            </p>
                                            <div className="max-h-32 overflow-y-auto">
                                                <ul className="text-sm text-red-700 space-y-1">
                                                    {bulkResult.failed.map((f, i) => (
                                                        <li key={i}>{f.email}: {f.error}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsBulkModalOpen(false)}
                                className="btn-secondary"
                            >
                                {bulkResult ? 'Close' : 'Cancel'}
                            </button>
                            {!bulkResult && (
                                <button
                                    onClick={handleBulkUpload}
                                    disabled={bulkMutation.isPending || bulkData.length === 0}
                                    className="btn-primary"
                                >
                                    {bulkMutation.isPending ? (
                                        <>
                                            <span className="spinner spinner-sm mr-2"></span>
                                            Uploading...
                                        </>
                                    ) : (
                                        `Upload ${bulkData.length} Users`
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Credentials Modal */}
            {isCredentialsModalOpen && (
                <div className="modal-overlay" onClick={() => setIsCredentialsModalOpen(false)}>
                    <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Edit User Credentials</h2>
                        <form onSubmit={handleUpdateCredentials} className="space-y-4">
                            <div>
                                <label className="label-soft">Email</label>
                                <input
                                    type="email"
                                    value={credentialsForm.email}
                                    onChange={(e) => setCredentialsForm({ ...credentialsForm, email: e.target.value })}
                                    className="input-soft"
                                    placeholder="user@example.com"
                                />
                            </div>
                            <div>
                                <label className="label-soft">New Password</label>
                                <input
                                    type="password"
                                    value={credentialsForm.password}
                                    onChange={(e) => setCredentialsForm({ ...credentialsForm, password: e.target.value })}
                                    className="input-soft"
                                    placeholder="Min 8 characters"
                                    minLength={8}
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCredentialsModalOpen(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateCredentialsMutation.isPending}
                                    className="btn-primary"
                                >
                                    {updateCredentialsMutation.isPending ? 'Updating...' : 'Update Credentials'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditModalOpen && editTarget && (
                <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
                    <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">Edit User</h2>
                        <p className="text-sm text-text-secondary mb-4">{editTarget.email}</p>
                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label-soft">First Name</label>
                                    <input
                                        type="text"
                                        value={editForm.firstName || ''}
                                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                                        className="input-soft"
                                    />
                                </div>
                                <div>
                                    <label className="label-soft">Last Name</label>
                                    <input
                                        type="text"
                                        value={editForm.lastName || ''}
                                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                                        className="input-soft"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label-soft">Role</label>
                                <select
                                    value={editForm.role || 'user'}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className="select-soft"
                                >
                                    <option value="user">User</option>
                                    <option value="department_admin">Department Admin</option>
                                    <option value="site_admin">Site Admin</option>
                                    <option value="company_admin">Company Admin</option>
                                    {currentUser?.role === 'super_admin' && (
                                        <option value="super_admin">Super Admin</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="label-soft">Site</label>
                                <select
                                    value={editForm.siteId || ''}
                                    onChange={(e) => setEditForm({ ...editForm, siteId: e.target.value || null })}
                                    className="select-soft"
                                >
                                    <option value="">— No Site —</option>
                                    {sites.map((site) => (
                                        <option key={site.id} value={site.id}>{site.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editForm.isActive !== false}
                                        onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                                        className="toggle-primary"
                                    />
                                    <span className="text-sm font-medium text-text-primary">Active</span>
                                </label>
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
                                    disabled={updateUserMutation.isPending}
                                    className="btn-primary"
                                >
                                    {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModalState.isOpen}
                onClose={() => setDeleteModalState({ isOpen: false, userId: null })}
                onConfirm={confirmDelete}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
                confirmLabel="Delete"
                cancelLabel="Cancel"
                variant="danger"
                icon="delete"
                isLoading={deleteMutation.isPending}
            />
        </DashboardLayout>
    );
};

// Icon Components
const PlusIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

const UploadIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
