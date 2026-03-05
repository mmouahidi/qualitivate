import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface PermissionsMatrix {
    roles: string[];
    permissions: string[];
    matrix: Record<string, string[]>;
}

const ROLE_LABELS: Record<string, string> = {
    company_admin: 'Company Admin',
    site_admin: 'Site Admin',
    department_admin: 'Department Admin',
    user: 'User',
};

const PERMISSION_LABELS: Record<string, string> = {
    'companies:read': 'View Companies',
    'companies:write': 'Manage Companies',
    'sites:write': 'Create / Delete Sites',
    'sites:update': 'Edit Sites',
    'departments:write': 'Manage Departments',
    'users:read': 'View Users',
    'users:write': 'Create / Edit Users',
    'users:delete': 'Delete Users',
    'surveys:write': 'Create / Edit / Delete Surveys',
    'questions:write': 'Manage Survey Questions',
    'templates:write': 'Create / Edit Templates',
    'templates:use': 'Use Templates',
    'analytics:read': 'View Analytics',
    'analytics:export': 'Export Analytics',
};

const PERMISSION_GROUPS: { label: string; permissions: string[] }[] = [
    { label: 'Companies', permissions: ['companies:read', 'companies:write'] },
    { label: 'Sites', permissions: ['sites:write', 'sites:update'] },
    { label: 'Departments', permissions: ['departments:write'] },
    { label: 'Users', permissions: ['users:read', 'users:write', 'users:delete'] },
    { label: 'Surveys', permissions: ['surveys:write', 'questions:write'] },
    { label: 'Templates', permissions: ['templates:write', 'templates:use'] },
    { label: 'Analytics', permissions: ['analytics:read', 'analytics:export'] },
];

const Permissions: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [localMatrix, setLocalMatrix] = useState<Record<string, Set<string>>>({});
    const [saveError, setSaveError] = useState<string | null>(null);
    const pendingFlush = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

    // Only super_admin can access
    if (user?.role !== 'super_admin') {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p className="text-text-muted text-lg">Access denied. Super Admin only.</p>
            </div>
        );
    }

    const { data, isLoading } = useQuery<PermissionsMatrix>({
        queryKey: ['rbac-permissions'],
        queryFn: async () => {
            const res = await api.get('/rbac/permissions');
            return res.data;
        },
    });

    useEffect(() => {
        if (data) {
            const m: Record<string, Set<string>> = {};
            for (const role of data.roles) {
                m[role] = new Set(data.matrix[role] || []);
            }
            setLocalMatrix(m);
        }
    }, [data]);

    const updateMutation = useMutation({
        mutationFn: async ({ role, permissions }: { role: string; permissions: string[] }) => {
            await api.put('/rbac/permissions', { role, permissions });
        },
        onSuccess: () => {
            setSaveError(null);
            queryClient.invalidateQueries({ queryKey: ['rbac-permissions'] });
        },
        onError: (err: any) => {
            setSaveError(err.response?.data?.error || 'Failed to save permissions. Please try again.');
            queryClient.invalidateQueries({ queryKey: ['rbac-permissions'] });
        },
    });

    const flushRole = useCallback((role: string, perms: Set<string>) => {
        updateMutation.mutate({ role, permissions: Array.from(perms) });
    }, [updateMutation]);

    const handleToggle = (role: string, permission: string) => {
        setSaveError(null);
        setLocalMatrix((prev) => {
            const next = { ...prev };
            const rolePerms = new Set(next[role]);

            if (rolePerms.has(permission)) {
                rolePerms.delete(permission);
            } else {
                rolePerms.add(permission);
            }

            next[role] = rolePerms;

            // Debounce: batch rapid toggles for the same role into a single request
            if (pendingFlush.current[role]) {
                clearTimeout(pendingFlush.current[role]);
            }
            pendingFlush.current[role] = setTimeout(() => {
                flushRole(role, rolePerms);
                delete pendingFlush.current[role];
            }, 400);

            return next;
        });
    };

    const isChecked = (role: string, permission: string): boolean => {
        return localMatrix[role]?.has(permission) ?? false;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    const roles = data?.roles || [];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-surface border-b border-border sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-hover rounded transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
                                <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Permissions Matrix
                            </h1>
                            <p className="text-sm text-text-muted">Configure what each role can access across the platform</p>
                        </div>
                    </div>
                    {updateMutation.isPending && (
                        <span className="text-xs text-primary-500 animate-pulse font-medium">Saving...</span>
                    )}
                </div>
            </header>

            {/* Matrix */}
            <div className="max-w-7xl mx-auto p-6">
                {saveError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-sm text-red-700 dark:text-red-300 flex-1">{saveError}</p>
                        <button onClick={() => setSaveError(null)} className="text-red-500 hover:text-red-700">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}
                <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-surface-hover/50">
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-text-primary border-b border-border min-w-[240px]">
                                        Permission
                                    </th>
                                    {roles.map((role) => (
                                        <th
                                            key={role}
                                            className="text-center px-4 py-4 text-sm font-semibold text-text-primary border-b border-border min-w-[140px]"
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                                    {ROLE_LABELS[role] || role}
                                                </span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {PERMISSION_GROUPS.map((group, groupIdx) => (
                                    <React.Fragment key={group.label}>
                                        {/* Group header */}
                                        <tr className="bg-background/50">
                                            <td
                                                colSpan={roles.length + 1}
                                                className="px-6 py-2 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border"
                                            >
                                                {group.label}
                                            </td>
                                        </tr>
                                        {/* Permission rows */}
                                        {group.permissions.map((permission) => (
                                            <tr
                                                key={permission}
                                                className="hover:bg-surface-hover/30 transition-colors"
                                            >
                                                <td className="px-6 py-3 text-sm text-text-secondary border-b border-border/50">
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-xs bg-background px-1.5 py-0.5 rounded text-text-muted font-mono">
                                                            {permission}
                                                        </code>
                                                        <span className="text-text-primary font-medium">
                                                            {PERMISSION_LABELS[permission] || permission}
                                                        </span>
                                                    </div>
                                                </td>
                                                {roles.map((role) => (
                                                    <td
                                                        key={`${role}-${permission}`}
                                                        className="text-center px-4 py-3 border-b border-border/50"
                                                    >
                                                        <label className="inline-flex items-center justify-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked(role, permission)}
                                                                onChange={() => handleToggle(role, permission)}
                                                                className="w-5 h-5 rounded border-2 border-border text-primary-600 focus:ring-primary-500 focus:ring-offset-0 transition-colors cursor-pointer"
                                                            />
                                                        </label>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="mt-6 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800 p-4">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">How Permissions Work</p>
                            <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                                <strong>Super Admin</strong> always has full access to everything — their permissions cannot be modified.
                                Changes take effect immediately. Each checkbox toggles a specific capability for that role across the entire platform.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Permissions;
