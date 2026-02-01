/**
 * Utility functions to convert between snake_case and camelCase
 * Used to normalize API responses from backend (snake_case) to frontend (camelCase)
 */

type AnyObject = Record<string, any>;

/**
 * Convert a snake_case string to camelCase
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert a camelCase string to snake_case
 */
export const camelToSnake = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

/**
 * Recursively convert all keys in an object from snake_case to camelCase
 */
export const keysToCamel = <T>(obj: any): T => {
  if (Array.isArray(obj)) {
    return obj.map((item) => keysToCamel(item)) as T;
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = snakeToCamel(key);
      (result as AnyObject)[camelKey] = keysToCamel(obj[key]);
      return result;
    }, {} as AnyObject) as T;
  }
  return obj as T;
};

/**
 * Recursively convert all keys in an object from camelCase to snake_case
 */
export const keysToSnake = <T>(obj: any): T => {
  if (Array.isArray(obj)) {
    return obj.map((item) => keysToSnake(item)) as T;
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = camelToSnake(key);
      (result as AnyObject)[snakeKey] = keysToSnake(obj[key]);
      return result;
    }, {} as AnyObject) as T;
  }
  return obj as T;
};
