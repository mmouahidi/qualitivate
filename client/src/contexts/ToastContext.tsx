import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
    dismissible?: boolean;
}

interface ToastContextValue {
    toasts: Toast[];
    showToast: (toast: Omit<Toast, 'id'>) => string;
    dismissToast: (id: string) => void;
    clearToasts: () => void;
    // Convenience methods
    success: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    info: (title: string, message?: string) => string;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Toast configuration by type
const toastConfig: Record<ToastType, { icon: React.ElementType; bg: string; border: string; iconColor: string }> = {
    success: {
        icon: CheckCircle,
        bg: 'bg-secondary-50',
        border: 'border-secondary-200',
        iconColor: 'text-secondary-600',
    },
    error: {
        icon: XCircle,
        bg: 'bg-accent-50',
        border: 'border-accent-200',
        iconColor: 'text-accent-600',
    },
    warning: {
        icon: AlertTriangle,
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        iconColor: 'text-amber-600',
    },
    info: {
        icon: Info,
        bg: 'bg-primary-50',
        border: 'border-primary-200',
        iconColor: 'text-primary-600',
    },
};

// Default durations per UX guideline #82 (3-5 seconds)
const DEFAULT_DURATION = 4000;

// Single Toast Component
const ToastItem: React.FC<{ toast: Toast; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
    const config = toastConfig[toast.type];
    const Icon = config.icon;

    return (
        <div
            role="alert"
            aria-live="polite"
            className={`flex items-start gap-3 p-4 rounded-soft border shadow-soft-sm ${config.bg} ${config.border} animate-slide-in-right min-w-[320px] max-w-md`}
        >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} aria-hidden="true" />
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{toast.title}</p>
                {toast.message && (
                    <p className="mt-1 text-sm text-text-secondary">{toast.message}</p>
                )}
            </div>
            {toast.dismissible !== false && (
                <button
                    onClick={() => onDismiss(toast.id)}
                    className="flex-shrink-0 p-1 rounded hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-label="Dismiss notification"
                >
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            )}
        </div>
    );
};

// Toast Container Component
const ToastContainer: React.FC<{ toasts: Toast[]; onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => {
    if (toasts.length === 0) return null;

    return (
        <div
            className="fixed top-4 right-4 z-[9999] flex flex-col gap-2"
            aria-label="Notifications"
        >
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
};

// Toast Provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const dismissToast = useCallback((id: string) => {
        // Clear timeout if exists
        const timeout = timeoutsRef.current.get(id);
        if (timeout) {
            clearTimeout(timeout);
            timeoutsRef.current.delete(id);
        }
        // Remove toast
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((toast: Omit<Toast, 'id'>): string => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const duration = toast.duration ?? DEFAULT_DURATION;

        const newToast: Toast = {
            ...toast,
            id,
            dismissible: toast.dismissible ?? true,
        };

        setToasts((prev) => [...prev, newToast]);

        // Auto-dismiss after duration
        if (duration > 0) {
            const timeout = setTimeout(() => {
                dismissToast(id);
            }, duration);
            timeoutsRef.current.set(id, timeout);
        }

        return id;
    }, [dismissToast]);

    const clearToasts = useCallback(() => {
        // Clear all timeouts
        timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
        timeoutsRef.current.clear();
        setToasts([]);
    }, []);

    // Convenience methods
    const success = useCallback((title: string, message?: string) => {
        return showToast({ type: 'success', title, message });
    }, [showToast]);

    const error = useCallback((title: string, message?: string) => {
        return showToast({ type: 'error', title, message, duration: 6000 }); // Errors stay longer
    }, [showToast]);

    const warning = useCallback((title: string, message?: string) => {
        return showToast({ type: 'warning', title, message });
    }, [showToast]);

    const info = useCallback((title: string, message?: string) => {
        return showToast({ type: 'info', title, message });
    }, [showToast]);

    const value: ToastContextValue = {
        toasts,
        showToast,
        dismissToast,
        clearToasts,
        success,
        error,
        warning,
        info,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    );
};

// Hook to use toast
export const useToast = (): ToastContextValue => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export default ToastProvider;
