/**
 * User validation schemas
 */
import Joi from 'joi';
import { ValidationSchema } from '../middlewares/validation.middleware';

// Invite user schema
export const inviteUserSchema: ValidationSchema = {
    body: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Invalid email format',
            'any.required': 'Email is required'
        }),
        firstName: Joi.string().min(1).max(100).required().messages({
            'string.min': 'First name cannot be empty',
            'any.required': 'First name is required'
        }),
        lastName: Joi.string().min(1).max(100).required().messages({
            'string.min': 'Last name cannot be empty',
            'any.required': 'Last name is required'
        }),
        role: Joi.string()
            .valid('user', 'department_admin', 'site_admin', 'company_admin')
            .required()
            .messages({
                'any.only': 'Invalid role',
                'any.required': 'Role is required'
            }),
        companyId: Joi.string().uuid().optional(),
        siteId: Joi.string().uuid().optional(),
        departmentId: Joi.string().uuid().optional(),
    })
};

// Update user schema
export const updateUserSchema: ValidationSchema = {
    params: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid user ID format'
        })
    }),
    body: Joi.object({
        email: Joi.string().email().optional(),
        firstName: Joi.string().min(1).max(100).optional(),
        lastName: Joi.string().min(1).max(100).optional(),
        role: Joi.string()
            .valid('user', 'department_admin', 'site_admin', 'company_admin', 'super_admin')
            .optional(),
        companyId: Joi.string().uuid().allow(null).optional(),
        siteId: Joi.string().uuid().allow(null).optional(),
        departmentId: Joi.string().uuid().allow(null).optional(),
        isActive: Joi.boolean().optional(),
    }).min(1).messages({
        'object.min': 'At least one field must be provided for update'
    })
};

// Bulk create users schema
export const bulkCreateUsersSchema: ValidationSchema = {
    body: Joi.object({
        users: Joi.array().items(
            Joi.object({
                email: Joi.string().email().required(),
                firstName: Joi.string().min(1).max(100).required(),
                lastName: Joi.string().min(1).max(100).required(),
                password: Joi.string().min(8).required(),
                role: Joi.string().valid('user', 'department_admin', 'site_admin', 'company_admin').default('user'),
                companyId: Joi.string().uuid().optional(),
                siteId: Joi.string().uuid().optional(),
                departmentId: Joi.string().uuid().optional(),
            })
        ).min(1).max(100).required().messages({
            'array.min': 'At least one user is required',
            'array.max': 'Maximum 100 users can be created at once'
        })
    })
};

// Get user schema (validates route param)
export const getUserSchema: ValidationSchema = {
    params: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid user ID format'
        })
    })
};

// List users query schema
export const listUsersSchema: ValidationSchema = {
    query: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        search: Joi.string().max(100).optional(),
        role: Joi.string().valid('user', 'department_admin', 'site_admin', 'company_admin', 'super_admin').optional(),
        companyId: Joi.string().uuid().optional(),
        siteId: Joi.string().uuid().optional(),
        departmentId: Joi.string().uuid().optional(),
    })
};
