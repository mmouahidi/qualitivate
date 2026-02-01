/**
 * Utility functions for transforming between snake_case and camelCase
 * Used to ensure consistent API response format
 */

/**
 * Convert snake_case string to camelCase
 */
export const snakeToCamel = (str: string): string => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert camelCase string to snake_case
 */
export const camelToSnake = (str: string): string => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Transform object keys from snake_case to camelCase
 * Handles nested objects and arrays
 */
export const transformToCamelCase = <T = any>(obj: any): T => {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => transformToCamelCase(item)) as T;
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
        const transformed: Record<string, any> = {};
        for (const key of Object.keys(obj)) {
            const camelKey = snakeToCamel(key);
            transformed[camelKey] = transformToCamelCase(obj[key]);
        }
        return transformed as T;
    }

    return obj;
};

/**
 * Transform object keys from camelCase to snake_case
 * Handles nested objects and arrays
 */
export const transformToSnakeCase = <T = any>(obj: any): T => {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => transformToSnakeCase(item)) as T;
    }

    if (typeof obj === 'object' && obj.constructor === Object) {
        const transformed: Record<string, any> = {};
        for (const key of Object.keys(obj)) {
            const snakeKey = camelToSnake(key);
            transformed[snakeKey] = transformToSnakeCase(obj[key]);
        }
        return transformed as T;
    }

    return obj;
};

/**
 * Middleware to transform response data to camelCase
 * Apply this to Express responses
 */
export const camelCaseResponse = () => {
    return (_req: any, res: any, next: any) => {
        const originalJson = res.json.bind(res);

        res.json = (data: any) => {
            return originalJson(transformToCamelCase(data));
        };

        next();
    };
};
