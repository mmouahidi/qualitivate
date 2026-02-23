import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
    User,
    Mail,
    Building2,
    MapPin,
    Shield,
    AlertCircle,
    Calendar,
    Save,
    Loader2,
    Check,
    Globe,
    Bell,
    Sun,
    Moon,
    Monitor,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { DashboardLayout } from '../components/layout';
import api from '../services/api';

interface ProfileUpdateData {
    firstName: string;
    lastName: string;
    language?: string;
}

const Profile: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user, logout, refreshUser } = useAuth();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
    });
    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
    const [successMessage, setSuccessMessage] = useState('');
    const [showAvatarPicker, setShowAvatarPicker] = useState(false);
    const [avatarSeed, setAvatarSeed] = useState(() => {
        try {
            return localStorage.getItem('avatarSeed') || user?.email || 'default';
        } catch { return user?.email || 'default'; }
    });
    const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);
    const [credentialsError, setCredentialsError] = useState('');
    const [credentialsSuccess, setCredentialsSuccess] = useState('');
    const [emailForm, setEmailForm] = useState({
        email: user?.email || '',
        currentPassword: ''
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // DiceBear avatar styles for gallery
    const avatarStyles = ['initials', 'thumbs', 'shapes', 'icons', 'bottts', 'fun-emoji', 'identicon', 'rings'];
    const getAvatarUrl = (seed: string, style: string = 'initials', size: number = 96) => {
        return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=e0e7ff,c7d2fe,a5b4fc`;
    };

    // Generate gallery options
    const avatarOptions = useMemo(() => {
        return avatarStyles.map((style) => ({
            style,
            url: getAvatarUrl(user?.email || 'user', style, 64),
        }));
    }, [user?.email, avatarRefreshKey]);

    const currentAvatarUrl = getAvatarUrl(avatarSeed, 'initials', 96);

    React.useEffect(() => {
        setEmailForm((prev) => ({ ...prev, email: user?.email || '' }));
    }, [user?.email]);

    const updateProfileMutation = useMutation({
        mutationFn: async (data: ProfileUpdateData) => {
            const response = await api.put('/auth/profile', data);
            return response.data;
        },
        onSuccess: () => {
            setSuccessMessage(t('profile.updateSuccess'));
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['user'] });
            refreshUser();
            setTimeout(() => setSuccessMessage(''), 3000);
        },
    });

    const updateCredentialsMutation = useMutation({
        mutationFn: async (data: { currentPassword: string; newPassword?: string; email?: string }) => {
            const response = await api.put('/auth/credentials', data);
            return response.data;
        },
        onSuccess: (data) => {
            setCredentialsError('');
            setCredentialsSuccess(t('profile.credentialsUpdated', 'Credentials updated. Please sign in again.'));
            setEmailForm((prev) => ({ ...prev, currentPassword: '' }));
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            if (data?.requiresReauth) {
                setTimeout(async () => {
                    await logout();
                    navigate('/login');
                }, 1000);
            }
        },
        onError: (err: any) => {
            setCredentialsError(err?.response?.data?.error || 'Failed to update credentials');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData);
    };

    const handleEmailChange = (e: React.FormEvent) => {
        e.preventDefault();
        setCredentialsError('');
        setCredentialsSuccess('');
        if (!emailForm.email || !emailForm.currentPassword) {
            setCredentialsError('Email and current password are required');
            return;
        }
        updateCredentialsMutation.mutate({
            email: emailForm.email,
            currentPassword: emailForm.currentPassword
        });
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setCredentialsError('');
        setCredentialsSuccess('');
        if (!passwordForm.currentPassword || !passwordForm.newPassword) {
            setCredentialsError('Current password and new password are required');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setCredentialsError('Passwords do not match');
            return;
        }
        updateCredentialsMutation.mutate({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword
        });
    };

    const handleLanguageChange = (lang: string) => {
        setSelectedLanguage(lang);
        i18n.changeLanguage(lang);
        try {
            localStorage.setItem('language', lang);
        } catch (e) {
            console.warn('LocalStorage access denied', e);
        }
    };

    const getRoleDisplayName = (role: string) => {
        const roleNames: Record<string, string> = {
            super_admin: t('profile.roles.superAdmin'),
            company_admin: t('profile.roles.companyAdmin'),
            site_admin: t('profile.roles.siteAdmin'),
            department_admin: t('profile.roles.departmentAdmin'),
            user: t('profile.roles.user'),
        };
        return roleNames[role] || role;
    };

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            super_admin: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
            company_admin: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
            site_admin: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
            department_admin: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
            user: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600',
        };
        return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
    };

    const themeOptions = [
        { value: 'light' as const, icon: Sun, label: t('profile.themeLight', 'Light') },
        { value: 'dark' as const, icon: Moon, label: t('profile.themeDark', 'Dark') },
        { value: 'system' as const, icon: Monitor, label: t('profile.themeSystem', 'System') },
    ];

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
                    {t('profile.title')}
                </h1>
                <p className="text-text-secondary mt-1">
                    {t('profile.subtitle')}
                </p>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-400">
                    <Check className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="card-soft text-center">
                        {/* Avatar */}
                        <div className="relative group">
                            <img
                                src={currentAvatarUrl}
                                alt="Avatar"
                                className="w-24 h-24 rounded-full mx-auto mb-2 border-2 border-primary-200 dark:border-primary-700"
                            />
                            <button
                                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
                            >
                                {t('profile.changeAvatar', 'Change Avatar')}
                            </button>

                            {/* Avatar Picker */}
                            {showAvatarPicker && (
                                <div className="mt-3 p-3 bg-background rounded-lg border border-border">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium text-text-secondary">{t('profile.pickStyle', 'Pick a style')}</p>
                                        <button onClick={() => setAvatarRefreshKey(k => k + 1)} className="p-1 text-text-muted hover:text-primary-600">
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        {avatarOptions.map((opt) => (
                                            <button
                                                key={opt.style}
                                                onClick={() => {
                                                    setAvatarSeed(user?.email || 'user');
                                                    try { localStorage.setItem('avatarSeed', user?.email || 'user'); } catch { }
                                                    try { localStorage.setItem('avatarStyle', opt.style); } catch { }
                                                    setShowAvatarPicker(false);
                                                }}
                                                className="p-1 rounded-lg border border-border hover:border-primary-400 transition-all"
                                            >
                                                <img src={opt.url} alt={opt.style} className="w-12 h-12 rounded-md mx-auto" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Name */}
                        <h2 className="text-xl font-semibold text-text-primary">
                            {user?.firstName} {user?.lastName}
                        </h2>
                        <p className="text-text-secondary mt-1">{user?.email}</p>

                        {/* Role Badge */}
                        <div className="mt-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getRoleBadgeColor(user?.role || 'user')}`}>
                                <Shield className="w-4 h-4" />
                                {getRoleDisplayName(user?.role || 'user')}
                            </span>
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-6 pt-6 border-t border-border">
                            <div className="flex items-center justify-center gap-2 text-sm text-text-secondary">
                                <Calendar className="w-4 h-4" />
                                {t('profile.memberSince')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details & Settings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Personal Information */}
                    <div className="card-soft">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                                <User className="w-5 h-5 text-primary-600" />
                                {t('profile.personalInfo')}
                            </h3>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn-secondary text-sm"
                                >
                                    {t('profile.edit')}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="btn-ghost text-sm"
                                >
                                    {t('profile.cancel')}
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">
                                            {t('profile.firstName')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            className="input-soft w-full"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-1">
                                            {t('profile.lastName')}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.lastName}
                                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                            className="input-soft w-full"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={updateProfileMutation.isPending}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {updateProfileMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        {t('profile.saveChanges')}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                                    <User className="w-5 h-5 text-text-muted" />
                                    <div>
                                        <p className="text-xs text-text-secondary">{t('profile.fullName')}</p>
                                        <p className="font-medium text-text-primary">
                                            {user?.firstName} {user?.lastName}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                                    <Mail className="w-5 h-5 text-text-muted" />
                                    <div>
                                        <p className="text-xs text-text-secondary">{t('profile.email')}</p>
                                        <p className="font-medium text-text-primary">{user?.email}</p>
                                    </div>
                                </div>

                                {user?.companyId && (
                                    <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                                        <Building2 className="w-5 h-5 text-text-muted" />
                                        <div>
                                            <p className="text-xs text-text-secondary">{t('profile.organization')}</p>
                                            <p className="font-medium text-text-primary">{t('profile.companyMember')}</p>
                                        </div>
                                    </div>
                                )}

                                {user?.siteId && (
                                    <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                                        <MapPin className="w-5 h-5 text-text-muted" />
                                        <div>
                                            <p className="text-xs text-text-secondary">{t('profile.site')}</p>
                                            <p className="font-medium text-text-primary">{t('profile.siteAssigned')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Security & Credentials */}
                    <div className="card-soft">
                        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-6">
                            <Shield className="w-5 h-5 text-primary-600" />
                            {t('profile.security', 'Security')}
                        </h3>

                        {credentialsError && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {credentialsError}
                            </div>
                        )}
                        {credentialsSuccess && (
                            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
                                <Check className="w-4 h-4 shrink-0" /> {credentialsSuccess}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Change Email */}
                            <form onSubmit={handleEmailChange} className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                                    <Mail className="w-4 h-4 text-primary-600" />
                                    {t('profile.changeEmail', 'Change Email')}
                                </div>
                                <div>
                                    <label className="label-soft">{t('profile.newEmail', 'New Email')}</label>
                                    <input
                                        type="email"
                                        required
                                        value={emailForm.email}
                                        onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                                        className="input-soft w-full"
                                    />
                                </div>
                                <div>
                                    <label className="label-soft">{t('profile.currentPassword', 'Current Password')}</label>
                                    <input
                                        type="password"
                                        required
                                        value={emailForm.currentPassword}
                                        onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                                        className="input-soft w-full"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={updateCredentialsMutation.isPending}
                                    className="btn-primary w-full"
                                >
                                    {updateCredentialsMutation.isPending ? t('profile.updating', 'Updating...') : t('profile.updateEmail', 'Update Email')}
                                </button>
                            </form>

                            {/* Change Password */}
                            <form onSubmit={handlePasswordChange} className="space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-text-secondary">
                                    <Shield className="w-4 h-4 text-primary-600" />
                                    {t('profile.changePassword', 'Change Password')}
                                </div>
                                <div>
                                    <label className="label-soft">{t('profile.currentPassword', 'Current Password')}</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                        className="input-soft w-full"
                                    />
                                </div>
                                <div>
                                    <label className="label-soft">{t('profile.newPassword', 'New Password')}</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        className="input-soft w-full"
                                    />
                                </div>
                                <div>
                                    <label className="label-soft">{t('profile.confirmPassword', 'Confirm Password')}</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        className="input-soft w-full"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={updateCredentialsMutation.isPending}
                                    className="btn-primary w-full"
                                >
                                    {updateCredentialsMutation.isPending ? t('profile.updating', 'Updating...') : t('profile.updatePassword', 'Update Password')}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="card-soft">
                        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-6">
                            <Sun className="w-5 h-5 text-primary-600" />
                            {t('profile.appearance', 'Appearance')}
                        </h3>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-3">
                                {t('profile.theme', 'Theme')}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {themeOptions.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setTheme(opt.value)}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${theme === opt.value
                                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 shadow-sm'
                                            : 'border-border hover:border-primary-300 text-text-secondary hover:text-text-primary'
                                            }`}
                                    >
                                        <opt.icon className="w-4 h-4" />
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Preferences */}
                    <div className="card-soft">
                        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-6">
                            <Globe className="w-5 h-5 text-primary-600" />
                            {t('profile.preferences')}
                        </h3>

                        <div className="space-y-4">
                            {/* Language Selection */}
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    {t('profile.language')}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { code: 'en', name: 'English', flag: '🇺🇸' },
                                        { code: 'fr', name: 'Français', flag: '🇫🇷' },
                                        { code: 'ar', name: 'العربية', flag: '🇸🇦' },
                                    ].map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleLanguageChange(lang.code)}
                                            className={`px-4 py-2 rounded-lg border transition-all ${selectedLanguage === lang.code
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                                                : 'border-border hover:border-primary-300 text-text-secondary'
                                                }`}
                                        >
                                            <span className="mr-2">{lang.flag}</span>
                                            {lang.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="card-soft">
                        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2 mb-6">
                            <Bell className="w-5 h-5 text-primary-600" />
                            {t('profile.notifications')}
                        </h3>

                        <div className="space-y-4">
                            <label className="flex items-center justify-between p-3 bg-background rounded-lg cursor-pointer">
                                <div>
                                    <p className="font-medium text-text-primary">{t('profile.emailNotifications')}</p>
                                    <p className="text-sm text-text-secondary">{t('profile.emailNotificationsDesc')}</p>
                                </div>
                                <input type="checkbox" defaultChecked className="toggle-primary" />
                            </label>

                            <label className="flex items-center justify-between p-3 bg-background rounded-lg cursor-pointer">
                                <div>
                                    <p className="font-medium text-text-primary">{t('profile.surveyReminders')}</p>
                                    <p className="text-sm text-text-secondary">{t('profile.surveyRemindersDesc')}</p>
                                </div>
                                <input type="checkbox" defaultChecked className="toggle-primary" />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
