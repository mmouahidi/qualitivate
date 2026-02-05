import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, Trash2, LogOut, AlertCircle } from 'lucide-react';

export type ConfirmModalVariant = 'danger' | 'warning' | 'info';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    message: string | React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmModalVariant;
    isLoading?: boolean;
    icon?: 'delete' | 'logout' | 'warning' | 'info';
}

const variantConfig: Record<ConfirmModalVariant, { 
    iconBg: string; 
    iconColor: string; 
    buttonClass: string;
}> = {
    danger: {
        iconBg: 'bg-accent-100',
        iconColor: 'text-accent-600',
        buttonClass: 'bg-accent-600 hover:bg-accent-700 focus:ring-accent-500',
    },
    warning: {
        iconBg: 'bg-amber-100',
        iconColor: 'text-amber-600',
        buttonClass: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    },
    info: {
        iconBg: 'bg-primary-100',
        iconColor: 'text-primary-600',
        buttonClass: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
    },
};

const iconMap = {
    delete: Trash2,
    logout: LogOut,
    warning: AlertTriangle,
    info: AlertCircle,
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    isLoading = false,
    icon = 'warning',
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);
    const config = variantConfig[variant];
    const Icon = iconMap[icon];

    // Focus management
    useEffect(() => {
        if (isOpen) {
            // Store the active element to return focus later
            const previousActiveElement = document.activeElement as HTMLElement;
            
            // Focus the cancel button (safer default)
            setTimeout(() => {
                confirmButtonRef.current?.focus();
            }, 0);

            return () => {
                // Return focus when modal closes
                previousActiveElement?.focus?.();
            };
        }
    }, [isOpen]);

    // Trap focus within modal
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
            onClose();
        }

        // Focus trap
        if (e.key === 'Tab' && modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll(
                'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement?.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement?.focus();
            }
        }
    }, [isLoading, onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = '';
            };
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        await onConfirm();
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[9998] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-description"
            onKeyDown={handleKeyDown}
        >
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={!isLoading ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    ref={modalRef}
                    className="relative bg-surface rounded-soft-lg shadow-soft-lg max-w-md w-full p-6 animate-slide-up"
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="absolute top-4 right-4 p-1 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                        aria-label="Close dialog"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>

                    {/* Icon */}
                    <div className={`w-12 h-12 ${config.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Icon className={`w-6 h-6 ${config.iconColor}`} aria-hidden="true" />
                    </div>

                    {/* Title */}
                    <h2 
                        id="confirm-modal-title"
                        className="text-lg font-semibold text-gray-900 text-center mb-2"
                    >
                        {title}
                    </h2>

                    {/* Message */}
                    <p 
                        id="confirm-modal-description"
                        className="text-text-secondary text-center mb-6"
                    >
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="btn-secondary min-w-[100px]"
                            type="button"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            ref={confirmButtonRef}
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={`inline-flex items-center justify-center px-5 py-2.5 text-white font-medium rounded-soft transition-all min-w-[100px] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${config.buttonClass}`}
                            type="button"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                confirmLabel
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;
