/**
 * Sentry Error Tracking Configuration
 * 
 * Set SENTRY_DSN environment variable to enable error tracking.
 * In production, errors are automatically captured and sent to Sentry.
 */

import * as Sentry from '@sentry/node';
import { env } from './env';
import { Request } from 'express';

/**
 * Initialize Sentry with environment-specific settings
 * Only initializes if SENTRY_DSN is configured
 */
export const initSentry = () => {
    const dsn = process.env.SENTRY_DSN;

    if (!dsn) {
        console.log('Sentry: DSN not configured, error tracking disabled');
        return;
    }

    Sentry.init({
        dsn,
        environment: env.NODE_ENV,

        // Capture 100% of errors
        sampleRate: 1.0,

        // Performance monitoring sample rate (10% in production)
        tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Add correlation ID and user context to events
        beforeSend(event, hint) {
            // Add any custom processing here
            return event;
        },

        // Ignore specific errors
        ignoreErrors: [
            // Add patterns for errors you want to ignore
            'ResizeObserver loop limit exceeded',
            'Non-Error exception captured',
        ],
    });

    console.log(`Sentry: Initialized for ${env.NODE_ENV} environment`);
};

/**
 * Capture an exception with additional context
 */
export const captureException = (error: Error, context?: Record<string, any>) => {
    Sentry.withScope((scope) => {
        if (context) {
            scope.setExtras(context);
        }
        Sentry.captureException(error);
    });
};

/**
 * Capture a message with severity level
 */
export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
    Sentry.captureMessage(message, level);
};

/**
 * Add user context to Sentry events
 */
export const setUser = (user: { id: string; email?: string; role?: string }) => {
    Sentry.setUser(user);
};

/**
 * Clear user context (on logout)
 */
export const clearUser = () => {
    Sentry.setUser(null);
};

/**
 * Add request context to Sentry scope
 */
export const addRequestContext = (req: Request) => {
    Sentry.setTag('correlation_id', req.correlationId || 'unknown');
    Sentry.setContext('request', {
        method: req.method,
        url: req.url,
        headers: {
            'user-agent': req.headers['user-agent'],
            'content-type': req.headers['content-type'],
        },
    });
};

export default Sentry;
