import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const listSites = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { page = 1, limit = 20, search = '', companyId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('sites')
      .select('sites.*', 'companies.name as company_name')
      .join('companies', 'sites.company_id', 'companies.id');

    if (user.role === 'super_admin') {
      if (companyId) {
        query = query.where('sites.company_id', companyId);
      }
    } else if (user.role === 'company_admin') {
      query = query.where('sites.company_id', user.companyId!);
    } else if (user.role === 'site_admin') {
      query = query.where('sites.id', user.siteId!);
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .where('sites.name', 'ilike', `%${search}%`)
          .orWhere('sites.location', 'ilike', `%${search}%`);
      });
    }

    const sites = await query
      .orderBy('sites.created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    const [{ count }] = await db('sites')
      .count('* as count')
      .modify((builder) => {
        if (user.role === 'company_admin') {
          builder.where('company_id', user.companyId!);
        } else if (user.role === 'site_admin') {
          builder.where('id', user.siteId!);
        } else if (user.role === 'super_admin' && companyId) {
          builder.where('company_id', companyId);
        }
        if (search) {
          builder.where((qb) => {
            qb.where('name', 'ilike', `%${search}%`)
              .orWhere('location', 'ilike', `%${search}%`);
          });
        }
      });

    res.json({
      data: sites,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        totalPages: Math.ceil(Number(count) / Number(limit))
      }
    });
  } catch (error) {
    console.error('List sites error:', error);
    res.status(500).json({ error: 'Failed to list sites' });
  }
};

export const getSite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const site = await db('sites')
      .select('sites.*', 'companies.name as company_name')
      .join('companies', 'sites.company_id', 'companies.id')
      .where('sites.id', id)
      .first();

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    if (user.role !== 'super_admin') {
      if (user.role === 'company_admin' && user.companyId !== site.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (user.role === 'site_admin' && user.siteId !== site.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [departmentsCount] = await db('departments').where({ site_id: id }).count('* as count');
    const [usersCount] = await db('users').where({ site_id: id }).count('* as count');

    res.json({
      ...site,
      stats: {
        departments: Number(departmentsCount.count),
        users: Number(usersCount.count)
      }
    });
  } catch (error) {
    console.error('Get site error:', error);
    res.status(500).json({ error: 'Failed to get site' });
  }
};

export const createSite = async (req: AuthRequest, res: Response) => {
  try {
    const { name, location, companyId } = req.body;
    const user = req.user!;

    let targetCompanyId = companyId;

    if (user.role === 'company_admin') {
      targetCompanyId = user.companyId;
    } else if (user.role === 'super_admin') {
      // Super admin must provide companyId
      if (!companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    const company = await db('companies').where({ id: targetCompanyId }).first();
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const [site] = await db('sites')
      .insert({
        id: uuidv4(),
        company_id: targetCompanyId,
        name,
        location: location || null
      })
      .returning('*');

    res.status(201).json(site);
  } catch (error) {
    console.error('Create site error:', error);
    res.status(500).json({ error: 'Failed to create site' });
  }
};

export const updateSite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, location } = req.body;
    const user = req.user!;

    const site = await db('sites').where({ id }).first();

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    if (user.role !== 'super_admin') {
      if (user.role === 'company_admin' && user.companyId !== site.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (user.role === 'site_admin' && user.siteId !== site.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updateData: any = {
      updated_at: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (location !== undefined) updateData.location = location;

    const [updatedSite] = await db('sites')
      .where({ id })
      .update(updateData)
      .returning('*');

    res.json(updatedSite);
  } catch (error) {
    console.error('Update site error:', error);
    res.status(500).json({ error: 'Failed to update site' });
  }
};

export const deleteSite = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const site = await db('sites').where({ id }).first();

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    if (user.role !== 'super_admin') {
      if (user.role === 'company_admin' && user.companyId !== site.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (user.role !== 'company_admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await db('sites').where({ id }).delete();

    res.json({ message: 'Site deleted successfully' });
  } catch (error) {
    console.error('Delete site error:', error);
    res.status(500).json({ error: 'Failed to delete site' });
  }
};
