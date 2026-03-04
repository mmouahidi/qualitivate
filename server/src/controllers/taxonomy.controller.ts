import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';

// List all categories with their dimensions (nested)
export const listCategories = async (_req: AuthRequest, res: Response) => {
    try {
        const categories = await db('taxonomy_categories')
            .orderBy('order_index', 'asc');

        const dimensions = await db('taxonomy_dimensions')
            .orderBy('order_index', 'asc');

        const result = categories.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
            orderIndex: cat.order_index,
            dimensions: dimensions
                .filter((d: any) => d.category_id === cat.id)
                .map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    orderIndex: d.order_index,
                })),
        }));

        res.json({ data: result });
    } catch (error) {
        logger.error('List taxonomy categories error:', { error });
        res.status(500).json({ error: 'Failed to list categories' });
    }
};

// Get a single category with its dimensions
export const getCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const category = await db('taxonomy_categories').where({ id }).first();
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const dimensions = await db('taxonomy_dimensions')
            .where({ category_id: id })
            .orderBy('order_index', 'asc');

        res.json({
            id: category.id,
            name: category.name,
            orderIndex: category.order_index,
            dimensions: dimensions.map((d: any) => ({
                id: d.id,
                name: d.name,
                orderIndex: d.order_index,
            })),
        });
    } catch (error) {
        logger.error('Get taxonomy category error:', { error });
        res.status(500).json({ error: 'Failed to get category' });
    }
};
