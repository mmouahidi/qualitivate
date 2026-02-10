/**
 * Request Correlation ID Middleware
 * Adds a unique correlation ID to each request for traceability across logs
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request to include correlationId
declare global {
    namespace Express {
        interface Request {
            correlationId: string;
        }
    }
}

/**
 * Middleware that adds a unique correlation ID to each request
 * - Uses X-Correlation-ID header if provided (for distributed tracing)
 * - Generates a new UUID if not provided
 * - Adds the ID to response headers for client visibility
 */
export const correlationId = (req: Request, res: Response, next: NextFunction) => {
    // Use existing correlation ID from header or generate new one
    const id = (req.headers['x-correlation-id'] as string) || uuidv4();

    // Attach to request object
    req.correlationId = id;

    // Add to response headers
    res.setHeader('X-Correlation-ID', id);

    next();
};

export default correlationId;
