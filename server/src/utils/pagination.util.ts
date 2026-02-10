/**
 * Pagination utility
 * Provides helpers for parsing pagination params and building paginated responses
 */

export interface PaginationParams {
    page: number;
    limit: number;
    offset: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

/**
 * Parse pagination query params with defaults
 */
export function parsePaginationParams(query: any): PaginationParams {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
}

/**
 * Build a paginated response object
 */
export function buildPaginatedResponse<T>(
    data: T[],
    total: number,
    params: PaginationParams
): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / params.limit);

    return {
        data,
        pagination: {
            page: params.page,
            limit: params.limit,
            total,
            totalPages,
            hasNext: params.page < totalPages,
            hasPrev: params.page > 1,
        },
    };
}

/**
 * Helper to apply pagination to a Knex query
 * Returns both the data and total count
 */
export async function paginateQuery<T>(
    baseQuery: any,
    params: PaginationParams
): Promise<{ data: T[]; total: number }> {
    // Clone the query for counting
    const countQuery = baseQuery.clone();

    // Get total count
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count as string) || 0;

    // Apply pagination to data query
    const data = await baseQuery.limit(params.limit).offset(params.offset);

    return { data, total };
}
