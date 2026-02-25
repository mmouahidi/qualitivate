/**
 * Survey validation schemas
 */
import Joi from 'joi';
import { ValidationSchema } from '../middlewares/validation.middleware';

// Create survey schema
export const createSurveySchema: ValidationSchema = {
    body: Joi.object({
        title: Joi.string().min(1).max(255).required().messages({
            'string.min': 'Title cannot be empty',
            'any.required': 'Title is required'
        }),
        description: Joi.string().max(2000).allow('').optional(),
        type: Joi.string().valid('nps', 'custom').required().messages({
            'any.only': 'Type must be either "nps" or "custom"',
            'any.required': 'Survey type is required'
        }),
        status: Joi.string().valid('draft', 'active', 'closed').default('draft'),
        companyId: Joi.string().uuid().optional(),
        siteId: Joi.string().uuid().optional(),
        departmentId: Joi.string().uuid().optional(),
        isPublic: Joi.boolean().default(false),
        isAnonymous: Joi.boolean().default(false),
        // Backward-compat alias
        allowAnonymous: Joi.boolean().optional(),
        defaultLanguage: Joi.string().min(2).max(5).optional(),
        settings: Joi.object().optional(),
        startsAt: Joi.date().iso().optional(),
        endsAt: Joi.date().iso().optional(),
        schema: Joi.object().optional(),
    }).custom((value, helpers) => {
        // Validate that endsAt is after startsAt if both provided
        if (value.startsAt && value.endsAt) {
            if (new Date(value.endsAt) <= new Date(value.startsAt)) {
                return helpers.error('custom.dateRange');
            }
        }
        return value;
    }).messages({
        'custom.dateRange': 'End date must be after start date'
    })
};

// Update survey schema
export const updateSurveySchema: ValidationSchema = {
    params: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid survey ID format'
        })
    }),
    body: Joi.object({
        title: Joi.string().min(1).max(255).optional(),
        description: Joi.string().max(2000).allow('').optional(),
        type: Joi.string().valid('nps', 'custom').optional(),
        status: Joi.string().valid('draft', 'active', 'closed').optional(),
        isPublic: Joi.boolean().optional(),
        isAnonymous: Joi.boolean().optional(),
        // Backward-compat alias
        allowAnonymous: Joi.boolean().optional(),
        defaultLanguage: Joi.string().min(2).max(5).optional(),
        settings: Joi.object().optional(),
        startsAt: Joi.date().iso().allow(null).optional(),
        endsAt: Joi.date().iso().allow(null).optional(),
        schema: Joi.object().optional(),
    }).custom((value, helpers) => {
        if (value.startsAt && value.endsAt) {
            if (new Date(value.endsAt) <= new Date(value.startsAt)) {
                return helpers.error('custom.dateRange');
            }
        }
        return value;
    }).messages({
        'custom.dateRange': 'End date must be after start date'
    })
};

// Get/Delete survey schema
export const surveyIdSchema: ValidationSchema = {
    params: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid survey ID format'
        })
    })
};

// List surveys query schema
export const listSurveysSchema: ValidationSchema = {
    query: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        type: Joi.string().valid('nps', 'custom').optional(),
        status: Joi.string().valid('draft', 'active', 'closed').allow('').optional(),
        // Allow "general" to target surveys without a company for super_admin
        companyId: Joi.string().uuid().allow('', 'general').optional(),
        siteId: Joi.string().uuid().optional(),
        departmentId: Joi.string().uuid().optional(),
        search: Joi.string().max(100).allow('').optional(),
    })
};

// Duplicate survey schema
export const duplicateSurveySchema: ValidationSchema = {
    params: Joi.object({
        id: Joi.string().uuid().required()
    }),
    body: Joi.object({
        title: Joi.string().min(1).max(255).optional(),
    })
};
