/**
 * Environment variable validation
 * Validates all required environment variables at startup
 */
import Joi from 'joi';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Define schema for environment variables
const envSchema = Joi.object({
    // Server
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().port().default(5000),

    // Database: DATABASE_URL takes priority (used by Railway/PaaS)
    // Individual DB_* vars are only required in production if DATABASE_URL is not set
    DATABASE_URL: Joi.string().optional(),
    DB_HOST: Joi.string().when('DATABASE_URL', {
        is: Joi.exist(),
        then: Joi.string().optional(),
        otherwise: Joi.string().when('NODE_ENV', {
            is: 'production',
            then: Joi.string().required(),
            otherwise: Joi.string().default('localhost'),
        }),
    }),
    DB_PORT: Joi.number().port().default(5432),
    DB_NAME: Joi.string().when('DATABASE_URL', {
        is: Joi.exist(),
        then: Joi.string().optional(),
        otherwise: Joi.string().when('NODE_ENV', {
            is: 'production',
            then: Joi.string().required(),
            otherwise: Joi.string().default('qualitivate'),
        }),
    }),
    DB_USER: Joi.string().when('DATABASE_URL', {
        is: Joi.exist(),
        then: Joi.string().optional(),
        otherwise: Joi.string().when('NODE_ENV', {
            is: 'production',
            then: Joi.string().required(),
            otherwise: Joi.string().default('postgres'),
        }),
    }),
    DB_PASSWORD: Joi.string().when('DATABASE_URL', {
        is: Joi.exist(),
        then: Joi.string().optional(),
        otherwise: Joi.string().when('NODE_ENV', {
            is: 'production',
            then: Joi.string().required(),
            otherwise: Joi.string().default('postgres'),
        }),
    }),

    // JWT (always required)
    JWT_SECRET: Joi.string().min(32).required().messages({
        'string.min': 'JWT_SECRET must be at least 32 characters',
        'any.required': 'JWT_SECRET is required',
    }),
    JWT_REFRESH_SECRET: Joi.string().min(32).required().messages({
        'string.min': 'JWT_REFRESH_SECRET must be at least 32 characters',
        'any.required': 'JWT_REFRESH_SECRET is required',
    }),
    JWT_EXPIRES_IN: Joi.string().default('1h'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

    // SMTP (optional)
    SMTP_HOST: Joi.string().optional(),
    SMTP_PORT: Joi.number().port().optional(),
    SMTP_USER: Joi.string().optional(),
    SMTP_PASS: Joi.string().optional(),
    SMTP_FROM: Joi.string().email().optional(),

    // Frontend URL
    FRONTEND_URL: Joi.string().uri().default(
        process.env.RAILWAY_PUBLIC_DOMAIN
            ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
            : 'http://localhost:5173'
    ),
    // Railway-specific variables (auto-injected)
    RAILWAY_PUBLIC_DOMAIN: Joi.string().optional(),
    RAILWAY_ENVIRONMENT: Joi.string().optional(),
}).unknown(true); // Allow other env vars

// Validate and export
const { error, value: validatedEnv } = envSchema.validate(process.env, {
    abortEarly: false,
});

if (error) {
    const messages = error.details.map(d => `  - ${d.message}`).join('\n');
    console.error('❌ Environment validation failed:\n' + messages);
    process.exit(1);
}

// Export validated environment variables with types
export const env = {
    NODE_ENV: validatedEnv.NODE_ENV as 'development' | 'production' | 'test',
    PORT: validatedEnv.PORT as number,

    DB_HOST: validatedEnv.DB_HOST as string,
    DB_PORT: validatedEnv.DB_PORT as number,
    DB_NAME: validatedEnv.DB_NAME as string,
    DB_USER: validatedEnv.DB_USER as string,
    DB_PASSWORD: validatedEnv.DB_PASSWORD as string,
    DATABASE_URL: validatedEnv.DATABASE_URL as string | undefined,

    JWT_SECRET: validatedEnv.JWT_SECRET as string,
    JWT_REFRESH_SECRET: validatedEnv.JWT_REFRESH_SECRET as string,
    JWT_EXPIRES_IN: validatedEnv.JWT_EXPIRES_IN as string,
    JWT_REFRESH_EXPIRES_IN: validatedEnv.JWT_REFRESH_EXPIRES_IN as string,

    SMTP_HOST: validatedEnv.SMTP_HOST as string | undefined,
    SMTP_PORT: validatedEnv.SMTP_PORT as number | undefined,
    SMTP_USER: validatedEnv.SMTP_USER as string | undefined,
    SMTP_PASS: validatedEnv.SMTP_PASS as string | undefined,
    SMTP_FROM: validatedEnv.SMTP_FROM as string | undefined,

    FRONTEND_URL: validatedEnv.FRONTEND_URL as string,
};

// Log success in development (can't use logger here as it depends on env)
if (env.NODE_ENV === 'development') {
    process.stdout.write('✅ Environment validated successfully\n');
}

export default env;
