import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'high-contrast' | 'system';
type ResolvedTheme = 'light' | 'dark' | 'high-contrast';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'qualitivate-theme';

const THEME_CLASSES = ['dark', 'high-contrast'] as const;

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
}

function resolveTheme(theme: Theme): ResolvedTheme {
    if (theme === 'system') return getSystemTheme();
    return theme;
}

function getStoredTheme(): Theme {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'high-contrast' || stored === 'system') {
            return stored;
        }
    } catch {
        // localStorage not available
    }
    return 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(getStoredTheme);
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(
        () => resolveTheme(getStoredTheme())
    );

    const applyTheme = useCallback((resolved: ResolvedTheme) => {
        const root = document.documentElement;
        root.classList.remove(...THEME_CLASSES);
        if (resolved === 'dark') {
            root.classList.add('dark');
        } else if (resolved === 'high-contrast') {
            root.classList.add('high-contrast');
        }
        setResolvedTheme(resolved);
    }, []);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        try {
            localStorage.setItem(STORAGE_KEY, newTheme);
        } catch {
            // localStorage not available
        }
        applyTheme(resolveTheme(newTheme));
    }, [applyTheme]);

    useEffect(() => {
        applyTheme(resolveTheme(theme));
    }, [theme, applyTheme]);

    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            applyTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [theme, applyTheme]);

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
