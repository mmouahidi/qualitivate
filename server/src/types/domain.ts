/**
 * Shared types and constants for the Qualitivate.io platform.
 * Centralizes domain enums to avoid duplication across controllers.
 */

// ── Survey Types ──────────────────────────────────────────────
export const VALID_SURVEY_TYPES = ['nps', 'custom'] as const;
export type SurveyType = typeof VALID_SURVEY_TYPES[number];
export const isValidSurveyType = (type: string): type is SurveyType =>
    VALID_SURVEY_TYPES.includes(type as SurveyType);

// ── Survey Statuses ───────────────────────────────────────────
export const VALID_SURVEY_STATUSES = ['draft', 'active', 'closed'] as const;
export type SurveyStatus = typeof VALID_SURVEY_STATUSES[number];
export const isValidSurveyStatus = (status: string): status is SurveyStatus =>
    VALID_SURVEY_STATUSES.includes(status as SurveyStatus);

// ── Question Types ────────────────────────────────────────────
export const VALID_QUESTION_TYPES = ['nps', 'multiple_choice', 'text_short', 'text_long', 'rating_scale', 'matrix'] as const;
export type QuestionType = typeof VALID_QUESTION_TYPES[number];
export const isValidQuestionType = (type: string): type is QuestionType =>
    VALID_QUESTION_TYPES.includes(type as QuestionType);

// ── Template Types ────────────────────────────────────────────
export const VALID_TEMPLATE_TYPES = ['nps', 'custom'] as const;
export type TemplateType = typeof VALID_TEMPLATE_TYPES[number];
export const isValidTemplateType = (type: string): type is TemplateType =>
    VALID_TEMPLATE_TYPES.includes(type as TemplateType);

// ── Language Codes (ISO 639-1) ────────────────────────────────
export const VALID_LANGUAGE_CODES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'sv', 'da', 'no', 'fi'] as const;
export type LanguageCode = typeof VALID_LANGUAGE_CODES[number];
export const isValidLanguageCode = (code: string): boolean =>
    VALID_LANGUAGE_CODES.includes(code as any) || /^[a-z]{2}(-[A-Z]{2})?$/.test(code);

// ── User Roles ────────────────────────────────────────────────
export const VALID_USER_ROLES = ['super_admin', 'company_admin', 'site_admin', 'department_admin', 'employee'] as const;
export type UserRole = typeof VALID_USER_ROLES[number];
export const isValidUserRole = (role: string): role is UserRole =>
    VALID_USER_ROLES.includes(role as UserRole);

// ── Date Validation ───────────────────────────────────────────
export const isValidDateRange = (startsAt?: string, endsAt?: string): boolean => {
    if (!startsAt || !endsAt) return true;
    return new Date(startsAt) <= new Date(endsAt);
};

// ── Question Options Validation ───────────────────────────────
export const validateQuestionOptions = (type: QuestionType, options: any): { valid: boolean; error?: string } => {
    switch (type) {
        case 'multiple_choice':
            if (options.choices) {
                if (!Array.isArray(options.choices) || options.choices.length === 0) {
                    return { valid: false, error: 'multiple_choice requires non-empty choices array' };
                }
                const uniqueChoices = new Set(options.choices);
                if (uniqueChoices.size !== options.choices.length) {
                    return { valid: false, error: 'multiple_choice choices must be unique' };
                }
            }
            break;
        case 'rating_scale':
            if (options.min !== undefined && options.max !== undefined) {
                if (typeof options.min !== 'number' || typeof options.max !== 'number') {
                    return { valid: false, error: 'rating_scale min and max must be numbers' };
                }
                if (options.min >= options.max) {
                    return { valid: false, error: 'rating_scale min must be less than max' };
                }
            }
            break;
        case 'matrix':
            if (options.rows && !Array.isArray(options.rows)) {
                return { valid: false, error: 'matrix rows must be an array' };
            }
            if (options.columns && !Array.isArray(options.columns)) {
                return { valid: false, error: 'matrix columns must be an array' };
            }
            break;
    }
    return { valid: true };
};
