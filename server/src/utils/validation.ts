import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required'
  }),
  firstName: Joi.string().min(1).max(100).required().messages({
    'string.min': 'First name is required',
    'string.max': 'First name must be less than 100 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Last name is required',
    'string.max': 'Last name must be less than 100 characters',
    'any.required': 'Last name is required'
  })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Invalid email format',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

export const inviteUserSchema = Joi.object({
  email: Joi.string().email().required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  role: Joi.string().valid('company_admin', 'site_admin', 'department_admin', 'user').required(),
  companyId: Joi.string().uuid().optional(),
  siteId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional()
});

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    next();
  };
};
