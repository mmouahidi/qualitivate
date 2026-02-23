import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    Building2,
    Users,
    MapPin,
    Plus,
    Trash2,
    Loader2,
    Upload,
    X,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardLayout } from '../../components/layout';
import { companyService, siteService, userService } from '../../services/organization.service';
import type { Company, User as UserType } from '../../types';

type TabKey = 'overview' | 'sites' | 'users';

const CompanyDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    // --- Modal states ---
    const [showAddUser, setShowAddUser] = useState(false);
    const [showAddSite, setShowAddSite] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);

    // Add User form
    const [userForm, setUserForm] = useState({ email: '', firstName: '', lastName: '', password: '', role: 'user' });
    const [userFormError, setUserFormError] = useState('');

    // Add Site form
    const [siteForm, setSiteForm] = useState({ name: '', location: '' });
    const [siteFormError, setSiteFormError] = useState('');

    // Bulk import
    const [bulkCsv, setBulkCsv] = useState('');
    const [bulkResult, setBulkResult] = useState<{ created: number; errors: any[] } | null>(null);
    const [bulkError, setBulkError] = useState('');

    // Fetch company info
    const { data: company, isLoading: companyLoading } = useQuery({
        queryKey: ['company', id],
        queryFn: () => companyService.get(id!),
        enabled: !!id,
    });

    // Fetch sites for this company
    const { data: sitesData, isLoading: sitesLoading } = useQuery({
        queryKey: ['sites', { companyId: id }],
        queryFn: () => siteService.listByCompany(id!),
        enabled: !!id && (activeTab === 'sites' || activeTab === 'overview'),
    });

    // Fetch users for this company
    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['users', { companyId: id }],
        queryFn: () => userService.list({ companyId: id, limit: 100 }),
        enabled: !!id && (activeTab === 'users' || activeTab === 'overview'),
    });

    // --- Mutations ---
    const deleteSiteMutation = useMutation({
        mutationFn: siteService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites', { companyId: id }] });
            queryClient.invalidateQueries({ queryKey: ['company', id] });
        },
    });

    const deleteUserMutation = useMutation({
        mutationFn: userService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', { companyId: id }] });
            queryClient.invalidateQueries({ queryKey: ['company', id] });
        },
    });

    const inviteUserMutation = useMutation({
        mutationFn: userService.invite,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', { companyId: id }] });
            setShowAddUser(false);
            setUserForm({ email: '', firstName: '', lastName: '', password: '', role: 'user' });
            setUserFormError('');
        },
        onError: (err: any) => {
            setUserFormError(err?.response?.data?.error || 'Failed to create user');
        },
    });

    const createSiteMutation = useMutation({
        mutationFn: siteService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites', { companyId: id }] });
            setShowAddSite(false);
            setSiteForm({ name: '', location: '' });
            setSiteFormError('');
        },
        onError: (err: any) => {
            setSiteFormError(err?.response?.data?.error || 'Failed to create site');
        },
    });

    const bulkCreateMutation = useMutation({
        mutationFn: userService.bulkCreate,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ['users', { companyId: id }] });
            setBulkResult(result);
            setBulkError('');
        },
        onError: (err: any) => {
            setBulkError(err?.response?.data?.error || 'Bulk import failed');
        },
    });

    // --- Handlers ---
    const handleDeleteSite = (siteId: string, name: string) => {
        if (confirm(t('admin.sites.deleteConfirm', `Delete site "${name}"? This action cannot be undone.`))) {
            deleteSiteMutation.mutate(siteId);
        }
    };

    const handleDeleteUser = (userId: string) => {
        if (confirm(t('admin.users.deleteConfirm', 'Delete this user? This action cannot be undone.'))) {
            deleteUserMutation.mutate(userId);
        }
    };

    const handleInviteUser = (e: React.FormEvent) => {
        e.preventDefault();
        setUserFormError('');
        if (!userForm.email || !userForm.firstName || !userForm.lastName || !userForm.password) {
            setUserFormError('All fields are required');
            return;
        }
        if (userForm.password.length < 8) {
            setUserFormError('Password must be at least 8 characters');
            return;
        }
        inviteUserMutation.mutate({ ...userForm, companyId: id! });
    };

    const handleCreateSite = (e: React.FormEvent) => {
        e.preventDefault();
        setSiteFormError('');
        if (!siteForm.name.trim()) {
            setSiteFormError('Site name is required');
            return;
        }
        createSiteMutation.mutate({ name: siteForm.name, location: siteForm.location || undefined, companyId: id! });
    };

    const handleBulkImport = () => {
        setBulkError('');
        setBulkResult(null);
        const lines = bulkCsv.trim().split('\n').filter(l => l.trim());
        if (lines.length === 0) {
            setBulkError('Please paste CSV data (email, firstName, lastName, password, role)');
            return;
        }
        const users = lines.map(line => {
            const parts = line.split(',').map(p => p.trim());
            return {
                email: parts[0] || '',
                firstName: parts[1] || '',
                lastName: parts[2] || '',
                password: parts[3] || 'Temp1234!',
                role: parts[4] || 'user',
                companyId: id!,
            };
        }).filter(u => u.email);

        if (users.length === 0) {
            setBulkError('No valid users found in CSV');
            return;
        }
        bulkCreateMutation.mutate({ users });
    };

    const getRoleBadgeClass = (role: string) => {
        const classes: Record<string, string> = {
            super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            company_admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            site_admin: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            department_admin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
            user: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        };
        return classes[role] || classes.user;
    };

    const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
        { key: 'overview', label: t('admin.companies.overview', 'Overview'), icon: <Building2 className="w-4 h-4" /> },
        { key: 'sites', label: t('sidebar.sites'), icon: <MapPin className="w-4 h-4" />, count: sitesData?.data?.length },
        { key: 'users', label: t('sidebar.users'), icon: <Users className="w-4 h-4" />, count: usersData?.data?.length },
    ];

    if (companyLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Back button + Company Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/companies')}
                    className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary-600 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t('admin.companies.backToList', 'Back to Companies')}
                </button>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-xl flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">{company?.name}</h1>
                        <p className="text-text-secondary text-sm">
                            {company?.activity && <span>{company.activity}</span>}
                            {company?.city && <span> · {company.city}</span>}
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border mb-6">
                <nav className="flex gap-1 -mb-px">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                                : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-background text-text-muted">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stats cards */}
                    <div className="card-soft">
                        <div className="flex items-center gap-3 mb-2">
                            <MapPin className="w-5 h-5 text-primary-600" />
                            <span className="text-sm font-medium text-text-secondary">{t('sidebar.sites')}</span>
                        </div>
                        <p className="text-3xl font-bold text-text-primary">{sitesData?.data?.length ?? '—'}</p>
                    </div>
                    <div className="card-soft">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="w-5 h-5 text-accent-600 dark:text-accent-400" />
                            <span className="text-sm font-medium text-text-secondary">{t('sidebar.users')}</span>
                        </div>
                        <p className="text-3xl font-bold text-text-primary">{usersData?.data?.length ?? '—'}</p>
                    </div>
                    <div className="card-soft">
                        <div className="flex items-center gap-3 mb-2">
                            <Building2 className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
                            <span className="text-sm font-medium text-text-secondary">{t('admin.companies.employeesCount', 'Employees')}</span>
                        </div>
                        <p className="text-3xl font-bold text-text-primary">{(company as any)?.employeesCount ?? '—'}</p>
                    </div>

                    {/* Company info */}
                    <div className="md:col-span-3 card-soft">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">{t('admin.companies.details', 'Details')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-text-muted mb-1">{t('admin.companies.name')}</p>
                                <p className="text-text-primary font-medium">{company?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-text-muted mb-1">{t('admin.companies.slug', 'Slug')}</p>
                                <p className="text-text-primary font-medium">{company?.slug}</p>
                            </div>
                            {company?.address && (
                                <div>
                                    <p className="text-xs text-text-muted mb-1">{t('admin.companies.address', 'Address')}</p>
                                    <p className="text-text-primary font-medium">{company.address}</p>
                                </div>
                            )}
                            {company?.city && (
                                <div>
                                    <p className="text-xs text-text-muted mb-1">{t('admin.companies.city', 'City')}</p>
                                    <p className="text-text-primary font-medium">{company.city}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'sites' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-text-primary">{t('sidebar.sites')}</h3>
                        {(user?.role === 'super_admin' || user?.role === 'company_admin') && (
                            <button
                                onClick={() => setShowAddSite(true)}
                                className="btn-primary text-sm flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" />
                                {t('admin.sites.add')}
                            </button>
                        )}
                    </div>

                    {sitesLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                        </div>
                    ) : sitesData?.data?.length ? (
                        <div className="card-soft p-0 overflow-hidden">
                            <table className="table-soft">
                                <thead>
                                    <tr>
                                        <th>{t('admin.sites.name')}</th>
                                        <th>{t('admin.sites.location', 'Location')}</th>
                                        <th className="text-right">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sitesData.data.map((site: any) => (
                                        <tr key={site.id}>
                                            <td className="font-medium">{site.name}</td>
                                            <td className="text-text-secondary">{site.location || '—'}</td>
                                            <td className="text-right">
                                                {(user?.role === 'super_admin' || user?.role === 'company_admin') && (
                                                    <button
                                                        onClick={() => handleDeleteSite(site.id, site.name)}
                                                        className="btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card-soft text-center py-12">
                            <MapPin className="w-10 h-10 text-text-muted mx-auto mb-3" />
                            <p className="text-text-secondary">{t('admin.sites.noSites')}</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'users' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-text-primary">{t('sidebar.users')}</h3>
                        {(user?.role === 'super_admin' || user?.role === 'company_admin') && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowBulkImport(true)}
                                    className="btn-secondary text-sm flex items-center gap-1.5"
                                >
                                    <Upload className="w-4 h-4" />
                                    {t('admin.users.bulkImport', 'Bulk Import')}
                                </button>
                                <button
                                    onClick={() => setShowAddUser(true)}
                                    className="btn-primary text-sm flex items-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    {t('admin.users.add')}
                                </button>
                            </div>
                        )}
                    </div>

                    {usersLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                        </div>
                    ) : usersData?.data?.length ? (
                        <div className="card-soft p-0 overflow-hidden">
                            <table className="table-soft">
                                <thead>
                                    <tr>
                                        <th>{t('admin.users.name')}</th>
                                        <th>{t('admin.users.email')}</th>
                                        <th>{t('admin.users.role')}</th>
                                        <th className="text-right">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersData.data.map((u: UserType) => (
                                        <tr key={u.id}>
                                            <td className="font-medium">{u.firstName} {u.lastName}</td>
                                            <td className="text-text-secondary">{u.email}</td>
                                            <td>
                                                <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${getRoleBadgeClass(u.role)}`}>
                                                    {u.role.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="text-right">
                                                {user?.role === 'super_admin' && (
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        className="btn-ghost text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="card-soft text-center py-12">
                            <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
                            <p className="text-text-secondary">{t('admin.users.noUsers')}</p>
                        </div>
                    )}
                </div>
            )}

            {/* =================== ADD USER MODAL =================== */}
            {showAddUser && (
                <div className="modal-overlay" onClick={() => setShowAddUser(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="modal-title mb-0">{t('admin.users.add', 'Add User')}</h2>
                            <button onClick={() => setShowAddUser(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-sm text-text-secondary mb-4">
                            {t('admin.users.addingTo', 'Adding to')}: <span className="font-medium text-primary-600">{company?.name}</span>
                        </p>
                        {userFormError && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {userFormError}
                            </div>
                        )}
                        <form onSubmit={handleInviteUser}>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                    <label className="label-soft">{t('admin.users.firstName', 'First Name')}</label>
                                    <input type="text" required value={userForm.firstName} onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })} className="input-soft" />
                                </div>
                                <div>
                                    <label className="label-soft">{t('admin.users.lastName', 'Last Name')}</label>
                                    <input type="text" required value={userForm.lastName} onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })} className="input-soft" />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="label-soft">{t('admin.users.email', 'Email')}</label>
                                <input type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="input-soft" />
                            </div>
                            <div className="mb-3">
                                <label className="label-soft">{t('admin.users.password', 'Password')}</label>
                                <input type="password" required minLength={8} value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="input-soft" placeholder="Min 8 characters" />
                            </div>
                            <div className="mb-4">
                                <label className="label-soft">{t('admin.users.role', 'Role')}</label>
                                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="select-soft">
                                    <option value="user">{t('profile.roles.user', 'User')}</option>
                                    <option value="department_admin">{t('profile.roles.departmentAdmin', 'Department Admin')}</option>
                                    <option value="site_admin">{t('profile.roles.siteAdmin', 'Site Admin')}</option>
                                    <option value="company_admin">{t('profile.roles.companyAdmin', 'Company Admin')}</option>
                                    {user?.role === 'super_admin' && <option value="super_admin">{t('profile.roles.superAdmin', 'Super Admin')}</option>}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowAddUser(false)} className="btn-secondary">{t('common.cancel', 'Cancel')}</button>
                                <button type="submit" disabled={inviteUserMutation.isPending} className="btn-primary">
                                    {inviteUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('admin.users.add', 'Add User')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =================== ADD SITE MODAL =================== */}
            {showAddSite && (
                <div className="modal-overlay" onClick={() => setShowAddSite(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="modal-title mb-0">{t('admin.sites.add', 'Add Site')}</h2>
                            <button onClick={() => setShowAddSite(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-sm text-text-secondary mb-4">
                            {t('admin.users.addingTo', 'Adding to')}: <span className="font-medium text-primary-600">{company?.name}</span>
                        </p>
                        {siteFormError && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {siteFormError}
                            </div>
                        )}
                        <form onSubmit={handleCreateSite}>
                            <div className="mb-3">
                                <label className="label-soft">{t('admin.sites.name', 'Site Name')}</label>
                                <input type="text" required value={siteForm.name} onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })} className="input-soft" />
                            </div>
                            <div className="mb-4">
                                <label className="label-soft">{t('admin.sites.location', 'Location')}</label>
                                <input type="text" value={siteForm.location} onChange={(e) => setSiteForm({ ...siteForm, location: e.target.value })} className="input-soft" placeholder="Optional" />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setShowAddSite(false)} className="btn-secondary">{t('common.cancel', 'Cancel')}</button>
                                <button type="submit" disabled={createSiteMutation.isPending} className="btn-primary">
                                    {createSiteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('admin.sites.add', 'Add Site')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* =================== BULK IMPORT MODAL =================== */}
            {showBulkImport && (
                <div className="modal-overlay" onClick={() => { setShowBulkImport(false); setBulkResult(null); setBulkError(''); }}>
                    <div className="modal-content max-w-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="modal-title mb-0">{t('admin.users.bulkImport', 'Bulk Import Users')}</h2>
                            <button onClick={() => { setShowBulkImport(false); setBulkResult(null); setBulkError(''); }} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                        </div>
                        <p className="text-sm text-text-secondary mb-2">
                            {t('admin.users.addingTo', 'Adding to')}: <span className="font-medium text-primary-600">{company?.name}</span>
                        </p>
                        <p className="text-xs text-text-muted mb-3">
                            {t('admin.users.bulkFormat', 'Paste CSV: email, firstName, lastName, password, role (one per line)')}
                        </p>
                        <textarea
                            rows={8}
                            value={bulkCsv}
                            onChange={(e) => setBulkCsv(e.target.value)}
                            className="input-soft font-mono text-sm mb-3"
                            placeholder={"john@example.com, John, Doe, Pass1234!, user\njane@example.com, Jane, Smith, Pass1234!, site_admin"}
                        />
                        {bulkError && (
                            <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {bulkError}
                            </div>
                        )}
                        {bulkResult && (
                            <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-300 font-medium">
                                    <CheckCircle2 className="w-4 h-4" /> {bulkResult.created} users created
                                </div>
                                {bulkResult.errors?.length > 0 && (
                                    <div className="mt-2 text-red-600 dark:text-red-400">
                                        {bulkResult.errors.map((err, i) => <p key={i} className="text-xs">{err.email}: {err.error}</p>)}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => { setShowBulkImport(false); setBulkResult(null); setBulkError(''); }} className="btn-secondary">{t('common.cancel', 'Cancel')}</button>
                            <button onClick={handleBulkImport} disabled={bulkCreateMutation.isPending} className="btn-primary flex items-center gap-2">
                                {bulkCreateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {t('admin.users.import', 'Import')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default CompanyDetail;
