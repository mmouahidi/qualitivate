import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';
import { escapeIlike } from '../utils/pagination.util';

export const listCompanies = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('companies').select('*');

    if (user.role !== 'super_admin') {
      query = query.where('id', user.companyId!);
    }

    if (search) {
      const escaped = escapeIlike(String(search));
      query = query.where((builder) => {
        builder
          .where('name', 'ilike', `%${escaped}%`)
          .orWhere('slug', 'ilike', `%${escaped}%`);
      });
    }

    const companies = await query
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    const [{ count }] = await db('companies')
      .count('* as count')
      .modify((builder) => {
        if (user.role !== 'super_admin') {
          builder.where('id', user.companyId!);
        }
        if (search) {
          const escaped = escapeIlike(String(search));
          builder.where((qb) => {
            qb.where('name', 'ilike', `%${escaped}%`)
              .orWhere('slug', 'ilike', `%${escaped}%`);
          });
        }
      });

    res.json({
      data: companies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        totalPages: Math.ceil(Number(count) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('List companies error:', { error });
    res.status(500).json({ error: 'Failed to list companies' });
  }
};

export const getPublicCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await db('companies')
      .select('id', 'name')
      .select(db.raw("settings->>'logoUrl' as logoUrl"))
      .whereRaw("settings->>'logoUrl' IS NOT NULL")
      .orderBy('created_at', 'desc')
      .limit(6);

    res.json({ data: companies });
  } catch (error) {
    logger.error('Get public companies error:', { error });
    res.status(500).json({ error: 'Failed to fetch public companies' });
  }
};

export const getCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const company = await db('companies').where({ id }).first();

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (user.role !== 'super_admin' && user.companyId !== company.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [sitesCount] = await db('sites').where({ company_id: id }).count('* as count');
    const [usersCount] = await db('users').where({ company_id: id }).count('* as count');

    res.json({
      ...company,
      stats: {
        sites: Number(sitesCount.count),
        users: Number(usersCount.count)
      }
    });
  } catch (error) {
    logger.error('Get company error:', { error });
    res.status(500).json({ error: 'Failed to get company' });
  }
};

export const createCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { name, slug, activity, address, city, sites_count, employees_count, settings = {} } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 255) {
      return res.status(400).json({ error: 'Company name is required and must be under 255 characters' });
    }
    if (!slug || typeof slug !== 'string' || !/^[a-z0-9-]+$/.test(slug) || slug.length > 100) {
      return res.status(400).json({ error: 'Slug is required and must contain only lowercase letters, numbers, and hyphens' });
    }

    const existingCompany = await db('companies').where({ slug }).first();
    if (existingCompany) {
      return res.status(409).json({ error: 'Company slug already exists' });
    }

    const [company] = await db('companies')
      .insert({
        id: uuidv4(),
        name,
        slug,
        activity,
        address,
        city,
        sites_count: sites_count || 0,
        employees_count: employees_count || 0,
        settings
      })
      .returning('*');

    res.status(201).json(company);
  } catch (error) {
    logger.error('Create company error:', { error });
    res.status(500).json({ error: 'Failed to create company' });
  }
};

export const updateCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, slug, activity, address, city, sites_count, employees_count, settings } = req.body;
    const user = req.user!;

    const company = await db('companies').where({ id }).first();

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    if (user.role !== 'super_admin' && user.companyId !== company.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (slug && slug !== company.slug) {
      const existingCompany = await db('companies').where({ slug }).first();
      if (existingCompany) {
        return res.status(409).json({ error: 'Company slug already exists' });
      }
    }

    const updateData: any = {
      updated_at: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (activity !== undefined) updateData.activity = activity;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (sites_count !== undefined) updateData.sites_count = sites_count;
    if (employees_count !== undefined) updateData.employees_count = employees_count;
    if (settings !== undefined) updateData.settings = settings;

    const [updatedCompany] = await db('companies')
      .where({ id })
      .update(updateData)
      .returning('*');

    res.json(updatedCompany);
  } catch (error) {
    logger.error('Update company error:', { error });
    res.status(500).json({ error: 'Failed to update company' });
  }
};

export const deleteCompany = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const company = await db('companies').where({ id }).first();

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    await db('companies').where({ id }).delete();

    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    logger.error('Delete company error:', { error });
    res.status(500).json({ error: 'Failed to delete company' });
  }
};
