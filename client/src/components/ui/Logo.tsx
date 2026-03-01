import React from 'react';

interface LogoProps {
    className?: string;
    showText?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
    const sizeMap = {
        sm: {
            container: 'w-6 h-6',
            icon: 'w-3.5 h-3.5',
            text: 'text-lg',
        },
        md: {
            container: 'w-8 h-8',
            icon: 'w-5 h-5',
            text: 'text-xl',
        },
        lg: {
            container: 'w-10 h-10',
            icon: 'w-6 h-6',
            text: 'text-2xl',
        },
        xl: {
            container: 'w-12 h-12',
            icon: 'w-7 h-7',
            text: 'text-3xl',
        }
    };

    const s = sizeMap[size];

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <div className={`relative flex items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 shadow-md transform transition-transform duration-300 hover:scale-105 hover:rotate-3 shrink-0 ${s.container}`}>
                <svg
                    className={`text-white transition-all duration-300 drop-shadow-sm ${s.icon}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {/* Dynamic "Q" shaped icon matching the brand */}
                    <circle cx="11" cy="11" r="8" />
                    <path d="M16 16L21 21" strokeWidth="3" />
                </svg>
            </div>
            {showText && (
                <span className={`font-bold tracking-tight text-slate-900 dark:text-white transition-colors duration-300 ${s.text}`}>
                    Qualitivate
                </span>
            )}
        </div>
    );
}
