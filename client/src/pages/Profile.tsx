import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    User, 
    Mail, 
    Building2, 
    MapPin, 
    Shield, 
    Calendar,
    Save,
    Loader2,
    Check,
    Globe,
    Bell
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { DashboardLayout } from '../components/layout';
import api from '../services/api';

interface ProfileUpdateData {
    firstName: string;
    lastName: string;
    language?: string;
}

const Profile: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
    });
    const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'en');
    const [successMessage, setSuccessMessage] = useState('');

    const updateProfileMutation = useMutation({
        mutationFn: async (data: ProfileUpdateData) => {
            const response = await api.put('/auth/profile', data);
            return response.data;
        },
        onSuccess: () => {
            setSuccessMessage(t('profile.updateSuccess'));
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['user'] });
            setTimeout(() => setSuccessMessage(''), 3000);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData);
    };

    const handleLanguageChange = (lang: string) => {
        setSelectedLanguage(lang);
        i18n.changeLanguage(lang);
        localStorage.setItem('language', lang);
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
            super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
            company_admin: 'bg-blue-100 text-blue-700 border-blue-200',
            site_admin: 'bg-green-100 text-green-700 border-green-200',
            department_admin: 'bg-amber-100 text-amber-700 border-amber-200',
            user: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {t('profile.title')}
                </h1>
                <p className="text-gray-600 mt-1">
                    {t('profile.subtitle')}
                </p>
            </div>

            {/* Success Message */}
            {successMessage && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-green-700">
                    <Check className="w-5 h-5" />
                    {successMessage}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="card-soft text-center">
                        {/* Avatar */}
                        <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl font-bold text-primary-600">
                                {user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                            </span>
                        </div>

                        {/* Name */}
                        <h2 className="text-xl font-semibold text-gray-900">
                            {user?.firstName} {user?.lastName}
                        </h2>
                        <p className="text-gray-500 mt-1">{user?.email}</p>

                        {/* Role Badge */}
                        <div className="mt-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getRoleBadgeColor(user?.role || 'user')}`}>
                                <Shield className="w-4 h-4" />
                                {getRoleDisplayName(user?.role || 'user')}
                            </span>
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
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
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <User className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">{t('profile.fullName')}</p>
                                        <p className="font-medium text-gray-900">
                                            {user?.firstName} {user?.lastName}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-gray-500">{t('profile.email')}</p>
                                        <p className="font-medium text-gray-900">{user?.email}</p>
                                    </div>
                                </div>

                                {user?.companyId && (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Building2 className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">{t('profile.organization')}</p>
                                            <p className="font-medium text-gray-900">{t('profile.companyMember')}</p>
                                        </div>
                                    </div>
                                )}

                                {user?.siteId && (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">{t('profile.site')}</p>
                                            <p className="font-medium text-gray-900">{t('profile.siteAssigned')}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Preferences */}
                    <div className="card-soft">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
                            <Globe className="w-5 h-5 text-primary-600" />
                            {t('profile.preferences')}
                        </h3>

                        <div className="space-y-4">
                            {/* Language Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                            className={`px-4 py-2 rounded-lg border transition-all ${
                                                selectedLanguage === lang.code
                                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
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
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
                            <Bell className="w-5 h-5 text-primary-600" />
                            {t('profile.notifications')}
                        </h3>

                        <div className="space-y-4">
                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                                <div>
                                    <p className="font-medium text-gray-900">{t('profile.emailNotifications')}</p>
                                    <p className="text-sm text-gray-500">{t('profile.emailNotificationsDesc')}</p>
                                </div>
                                <input type="checkbox" defaultChecked className="toggle-primary" />
                            </label>

                            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                                <div>
                                    <p className="font-medium text-gray-900">{t('profile.surveyReminders')}</p>
                                    <p className="text-sm text-gray-500">{t('profile.surveyRemindersDesc')}</p>
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
