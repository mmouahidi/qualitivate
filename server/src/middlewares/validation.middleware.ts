/**
 * Generic Joi validation middleware
 * Validates request body, params, and query against Joi schemas
 */
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export interface ValidationSchema {
    body?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
}

/**
 * Creates a validation middleware from Joi schemas
 */
export const validate = (schema: ValidationSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const errors: string[] = [];

        // Validate body
        if (schema.body) {
            const { error } = schema.body.validate(req.body, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map(d => d.message));
            }
        }

        // Validate params
        if (schema.params) {
            const { error } = schema.params.validate(req.params, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map(d => d.message));
            }
        }

        // Validate query
        if (schema.query) {
            const { error } = schema.query.validate(req.query, { abortEarly: false });
            if (error) {
                errors.push(...error.details.map(d => d.message));
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
        }

        next();
    };
};

// Common validation patterns
export const commonSchemas = {
    uuid: Joi.string().uuid().required(),
    optionalUuid: Joi.string().uuid().optional(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    pagination: {
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
    }
};
