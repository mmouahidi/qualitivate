import React from 'react';
import { LucideIcon, FileQuestion, Inbox, ClipboardList, Users, Building2, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Pre-defined empty state types
export type EmptyStateType = 'surveys' | 'responses' | 'users' | 'sites' | 'analytics' | 'custom';

interface EmptyStateProps {
    /** Pre-defined type for common empty states */
    type?: EmptyStateType;
    /** Custom title (overrides type default) */
    title?: string;
    /** Custom description (overrides type default) */
    description?: string;
    /** Custom icon (overrides type default) */
    icon?: LucideIcon;
    /** Primary action button */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Secondary action link */
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Additional CSS classes */
    /** Additional CSS classes */
    className?: string;
}

// Default configurations for each type
const typeDefaults: Record<EmptyStateType, { icon: LucideIcon; titleKey: string; descriptionKey: string }> = {
    surveys: {
        icon: ClipboardList,
        titleKey: 'emptyState.surveys.title',
        descriptionKey: 'emptyState.surveys.description',
    },
    responses: {
        icon: Inbox,
        titleKey: 'emptyState.responses.title',
        descriptionKey: 'emptyState.responses.description',
    },
    users: {
        icon: Users,
        titleKey: 'emptyState.users.title',
        descriptionKey: 'emptyState.users.description',
    },
    sites: {
        icon: Building2,
        titleKey: 'emptyState.sites.title',
        descriptionKey: 'emptyState.sites.description',
    },
    analytics: {
        icon: BarChart3,
        titleKey: 'emptyState.analytics.title',
        descriptionKey: 'emptyState.analytics.description',
    },
    custom: {
        icon: FileQuestion,
        titleKey: 'emptyState.custom.title',
        descriptionKey: 'emptyState.custom.description',
    },
};

// Size configurations
const sizeConfig = {
    sm: {
        container: 'py-6',
        iconWrapper: 'w-12 h-12',
        icon: 'w-6 h-6',
        title: 'text-base',
        description: 'text-sm',
        image: 'w-24 h-24',
    },
    md: {
        container: 'py-10',
        iconWrapper: 'w-16 h-16',
        icon: 'w-8 h-8',
        title: 'text-lg',
        description: 'text-sm',
        image: 'w-40 h-40',
    },
    lg: {
        container: 'py-16',
        iconWrapper: 'w-20 h-20',
        icon: 'w-10 h-10',
        title: 'text-xl',
        description: 'text-base',
        image: 'w-64 h-64',
    },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
    type = 'custom',
    title,
    description,
    icon,
    action,
    secondaryAction,
    size = 'md',
    className = '',
}) => {
    const { t } = useTranslation();

    const defaults = typeDefaults[type];
    const Icon = icon || defaults.icon;
    const sizes = sizeConfig[size];

    const displayTitle = title || t(defaults.titleKey);
    const displayDescription = description || t(defaults.descriptionKey);

    return (
        <div
            className={`flex flex-col items-center justify-center text-center ${sizes.container} ${className}`}
            role="status"
            aria-label={displayTitle}
        >
            {/* Icon or Image */}
            <div
                className={`${sizes.iconWrapper} bg-primary-100/50 rounded-full flex items-center justify-center mb-4 ring-8 ring-primary-50/50`}
                aria-hidden="true"
            >
                <Icon className={`${sizes.icon} text-primary-600`} />
            </div>

            {/* Title */}
            <h3 className={`${sizes.title} font-semibold text-gray-900 mb-2`}>
                {displayTitle}
            </h3>

            {/* Description */}
            <p className={`${sizes.description} text-text-secondary max-w-md mb-6`}>
                {displayDescription}
            </p>

            {/* Actions */}
            {(action || secondaryAction) && (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {action && (
                        <button
                            onClick={action.onClick}
                            className="btn-primary"
                            type="button"
                        >
                            {action.label}
                        </button>
                    )}
                    {secondaryAction && (
                        <button
                            onClick={secondaryAction.onClick}
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                            type="button"
                        >
                            {secondaryAction.label}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmptyState;
