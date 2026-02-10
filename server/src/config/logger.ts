/**
 * Structured logging with Winston
 * Replaces console.log throughout the application
 */
import winston from 'winston';
import { env } from './env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for development - colorized and readable
const devFormat = combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return stack
            ? `${timestamp} ${level}: ${message}\n${stack}${metaStr}`
            : `${timestamp} ${level}: ${message}${metaStr}`;
    })
);

// Custom format for production - JSON for log aggregation
const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
    level: env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
    defaultMeta: { service: 'qualitivate-api' },
    transports: [
        new winston.transports.Console(),
    ],
});

// Add file transport in production
if (env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
    logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
}

export default logger;
