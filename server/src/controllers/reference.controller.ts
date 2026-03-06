import { Response } from 'express';
import db from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';

export const listIndustries = async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await db('industries')
      .select('id', 'name', 'slug', 'order_index')
      .orderBy('order_index', 'asc');
    res.json({ data: rows });
  } catch (error) {
    logger.error('List industries error:', { error });
    res.status(500).json({ error: 'Failed to list industries' });
  }
};

export const listJobPositions = async (_req: AuthRequest, res: Response) => {
  try {
    const rows = await db('job_positions')
      .select('id', 'department', 'position', 'order_index')
      .orderBy('order_index', 'asc');
    res.json({ data: rows });
  } catch (error) {
    logger.error('List job positions error:', { error });
    res.status(500).json({ error: 'Failed to list job positions' });
  }
};
