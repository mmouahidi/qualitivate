import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { ShieldCheck, Lock, Settings2, Check, Loader2 } from 'lucide-react';

interface RoleItem {
    id: string;
    name: string;
    label: string;
    description: string;
    configurable: boolean;
}

interface PermissionDetail {
    name: string;
    resource: string;
    action: string;
    description: string | null;
    permissionGroup: string;
}

interface RolePermissions {
    role: string;
    permissions: string[];
}

interface PermissionsMatrix {
    roles: string[];
    permissions: string[];
    permissionDetails?: PermissionDetail[];
    rolePermissions: RolePermissions[];
}

const Roles: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [localMatrix, setLocalMatrix] = useState<Record<string, Set<string>>>({});
    const [saveError, setSaveError] = useState<string | null>(null);
    const [savedRole, setSavedRole] = useState<string | null>(null);
    const pendingFlush = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const savedRoleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    if (user?.role !== 'super_admin') {
        return (
            <DashboardLayout title="Roles & Access">
                <div className="flex items-center justify-center min-h-[40vh]">
                    <p className="text-text-muted text-lg">Access denied. Super Admin only.</p>
                </div>
            </DashboardLayout>
        );
    }

    const { data: rolesData } = useQuery<{ roles: RoleItem[] }>({
        queryKey: ['rbac-roles'],
        queryFn: async () => {
            const res = await api.get('/rbac/roles');
            return res.data;
        },
    });

    const { data: permsData, isLoading } = useQuery<PermissionsMatrix>({
        queryKey: ['rbac-permissions'],
        queryFn: async () => {
            const res = await api.get('/rbac/permissions');
            return res.data;
        },
    });

    useEffect(() => {
        if (permsData) {
            const m: Record<string, Set<string>> = {};
            for (const rp of permsData.rolePermissions ?? []) {
                m[rp.role] = new Set(rp.permissions);
            }
            setLocalMatrix(m);
        }
    }, [permsData]);

    const updateMutation = useMutation<unknown, Error, { role: string; permissions: string[] }>({
        mutationFn: async ({ role, permissions }) => {
            await api.put('/rbac/permissions', { role, permissions });
        },
        onSuccess: (_data, variables) => {
            setSaveError(null);
            setSavedRole(variables.role);
            if (savedRoleTimeout.current) clearTimeout(savedRoleTimeout.current);
            savedRoleTimeout.current = setTimeout(() => {
                setSavedRole(null);
                savedRoleTimeout.current = null;
            }, 2500);
            queryClient.invalidateQueries({ queryKey: ['rbac-permissions'] });
        },
        onError: (err: Error) => {
            const msg = (err as Error & { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed to save. Please try again.';
            setSaveError(msg);
            queryClient.invalidateQueries({ queryKey: ['rbac-permissions'] });
        },
    });

    const flushRole = useCallback(
        (role: string, perms: Set<string>) => {
            updateMutation.mutate({ role, permissions: Array.from(perms) });
        },
        [updateMutation]
    );

    const handleToggle = (role: string, permission: string) => {
        setSaveError(null);
        setLocalMatrix((prev) => {
            const next = { ...prev };
            const rolePerms = new Set(next[role] ?? []);

            if (rolePerms.has(permission)) {
                rolePerms.delete(permission);
            } else {
                rolePerms.add(permission);
            }

            next[role] = rolePerms;

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

    const roles = rolesData?.roles ?? [];
    const configurableRoles = permsData?.roles ?? [];
    const permissionDetails = permsData?.permissionDetails ?? [];

    const allPermissionNames = React.useMemo(
        () => permissionDetails.map((p) => p.name),
        [permissionDetails]
    );

    const handleSelectAll = (role: string) => {
        setSaveError(null);
        const newPerms = new Set(allPermissionNames);
        setLocalMatrix((prev) => ({ ...prev, [role]: newPerms }));
        if (pendingFlush.current[role]) clearTimeout(pendingFlush.current[role]);
        flushRole(role, newPerms);
    };

    const handleClearAll = (role: string) => {
        setSaveError(null);
        const newPerms = new Set<string>();
        setLocalMatrix((prev) => ({ ...prev, [role]: newPerms }));
        if (pendingFlush.current[role]) clearTimeout(pendingFlush.current[role]);
        flushRole(role, newPerms);
    };

    // Build groups from permissionDetails (group by permissionGroup). Fallback to single group if no details.
    const permissionGroups = React.useMemo(() => {
        if (permissionDetails.length > 0) {
            const byGroup = new Map<string, PermissionDetail[]>();
            for (const p of permissionDetails) {
                const group = p.permissionGroup ?? 'Other';
                const list = byGroup.get(group) ?? [];
                list.push(p);
                byGroup.set(group, list);
            }
            return Array.from(byGroup.entries()).map(([label, perms]) => ({ label, permissions: perms }));
        }
        const names = permsData?.permissions ?? [];
        if (names.length === 0) return [];
        return [
            {
                label: 'Permissions',
                permissions: names.map((name) => ({
                    name,
                    resource: name.split(':')[0] ?? '',
                    action: name.split(':')[1] ?? '',
                    description: name,
                    permissionGroup: 'Other',
                })),
            },
        ];
    }, [permissionDetails, permsData?.permissions]);

    return (
        <DashboardLayout
            title="Roles & Access"
            subtitle="Manage roles and what each role can do across the platform"
        >
            {/* Role cards */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary-500" />
                    Roles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {roles.map((role) => (
                        <div
                            key={role.id}
                            className={`rounded-xl border p-4 ${
                                role.configurable
                                    ? 'bg-surface border-border hover:border-primary-300'
                                    : 'bg-surface-hover/50 border-border'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={`p-2 rounded-lg ${
                                        role.id === 'super_admin'
                                            ? 'bg-amber-100 dark:bg-amber-900/30'
                                            : 'bg-primary-100 dark:bg-primary-900/30'
                                    }`}
                                >
                                    {role.configurable ? (
                                        <Settings2 className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    ) : (
                                        <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-text-primary">{role.label}</h3>
                                    <p className="text-sm text-text-muted mt-1 line-clamp-3">
                                        {role.description}
                                    </p>
                                    {role.configurable && (() => {
                                        const rp = permsData?.rolePermissions?.find(r => r.role === role.id);
                                        return rp && rp.permissions.length > 0 && (
                                            <p className="text-xs text-text-muted mt-2">
                                                {rp.permissions.length} permissions
                                            </p>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Role access matrix */}
            <section>
                <h2 className="text-lg font-semibold text-text-primary mb-4">Role access (permissions)</h2>
                {saveError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
                        <p className="text-sm text-red-700 dark:text-red-300 flex-1">{saveError}</p>
                        <button
                            onClick={() => setSaveError(null)}
                            className="text-red-500 hover:text-red-700 p-1"
                            aria-label="Dismiss"
                        >
                            ×
                        </button>
                    </div>
                )}
                <div className="mb-2 flex items-center gap-3">
                    {updateMutation.isPending && (
                        <span className="text-sm text-primary-500 flex items-center gap-1.5">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving…
                        </span>
                    )}
                    {savedRole && !updateMutation.isPending && (
                        <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            Saved {roles.find((r) => r.id === savedRole)?.label ?? savedRole}
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-500 border-t-transparent" />
                    </div>
                ) : (
                    <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-surface-hover/50">
                                        <th className="text-left px-6 py-4 text-sm font-semibold text-text-primary border-b border-border min-w-[240px]">
                                            Permission
                                        </th>
                                        {configurableRoles.map((role) => (
                                            <th
                                                key={role}
                                                className="text-center px-4 py-4 text-sm font-semibold text-text-primary border-b border-border min-w-[120px]"
                                            >
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                                    {roles.find((r) => r.id === role)?.label ?? role}
                                                </span>
                                                <div className="flex items-center justify-center gap-2 mt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSelectAll(role)}
                                                        className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                                                    >
                                                        All
                                                    </button>
                                                    <span className="text-border">|</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleClearAll(role)}
                                                        className="text-xs text-text-muted hover:text-text-primary hover:underline font-medium"
                                                    >
                                                        None
                                                    </button>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {permissionGroups.map((group) => (
                                        <React.Fragment key={group.label}>
                                            <tr className="bg-background/50">
                                                <td
                                                    colSpan={configurableRoles.length + 1}
                                                    className="px-6 py-2 text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border"
                                                >
                                                    {group.label}
                                                </td>
                                            </tr>
                                            {group.permissions.map((perm) => (
                                                <tr
                                                    key={perm.name}
                                                    className="hover:bg-surface-hover/30 transition-colors"
                                                >
                                                    <td className="px-6 py-3 text-sm text-text-secondary border-b border-border/50">
                                                        <div className="flex items-center gap-2">
                                                            <code className="text-xs bg-background px-1.5 py-0.5 rounded text-text-muted font-mono">
                                                                {perm.name}
                                                            </code>
                                                            <span className="text-text-primary font-medium">
                                                                {perm.description || perm.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    {configurableRoles.map((role) => (
                                                        <td
                                                            key={`${role}-${perm.name}`}
                                                            className="text-center px-4 py-3 border-b border-border/50"
                                                        >
                                                            <label className="inline-flex items-center justify-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked(role, perm.name)}
                                                                    onChange={() =>
                                                                        handleToggle(role, perm.name)
                                                                    }
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
                )}

                <div className="mt-6 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800 p-4">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                                How role access works
                            </p>
                            <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                                <strong>Super Admin</strong> always has full access and cannot be changed. For other
                                roles, check or uncheck permissions; changes are saved automatically and take effect
                                immediately.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </DashboardLayout>
    );
};

export default Roles;
