import React from 'react';

interface LogoProps {
    className?: string;
    showText?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
    const sizeMap = {
        sm: 'h-6',
        md: 'h-8',
        lg: 'h-10',
        xl: 'h-12'
    };

    const heightClass = sizeMap[size];

    // Pick asset type (full logo w/ text vs icon only)
    const lightSrc = showText ? '/branding/logo1.webp' : '/branding/icon1.webp';
    const darkSrc = showText ? '/branding/logo-white1.webp' : '/branding/icon-white1.webp';

    return (
        <div className={`flex items-center justify-center shrink-0 ${className}`}>
            {/* Light Mode Logo: Visible by default, hidden when 'dark' class is present on html/body */}
            <img
                src={lightSrc}
                alt="Qualitivate"
                className={`${heightClass} w-auto object-contain block dark:hidden transition-opacity duration-300`}
            />

            {/* Dark Mode Logo: Hidden by default, visible when 'dark' class is present on html/body */}
            <img
                src={darkSrc}
                alt="Qualitivate"
                className={`${heightClass} w-auto object-contain hidden dark:block transition-opacity duration-300`}
            />
        </div>
    );
}
