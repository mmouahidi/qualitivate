import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const listDepartments = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { page = 1, limit = 20, search = '', siteId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('departments')
      .select('departments.*', 'sites.name as site_name', 'sites.company_id')
      .join('sites', 'departments.site_id', 'sites.id');

    if (user.role === 'super_admin') {
      if (siteId) {
        query = query.where('departments.site_id', siteId);
      }
    } else if (user.role === 'company_admin') {
      query = query.where('sites.company_id', user.companyId!);
      if (siteId) {
        query = query.where('departments.site_id', siteId);
      }
    } else if (user.role === 'site_admin') {
      query = query.where('departments.site_id', user.siteId!);
    } else if (user.role === 'department_admin') {
      query = query.where('departments.id', user.departmentId!);
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (search) {
      query = query.where('departments.name', 'ilike', `%${search}%`);
    }

    const departments = await query
      .orderBy('departments.created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    const [{ count }] = await db('departments')
      .join('sites', 'departments.site_id', 'sites.id')
      .count('* as count')
      .modify((builder) => {
        if (user.role === 'company_admin') {
          builder.where('sites.company_id', user.companyId!);
        } else if (user.role === 'site_admin') {
          builder.where('departments.site_id', user.siteId!);
        } else if (user.role === 'department_admin') {
          builder.where('departments.id', user.departmentId!);
        } else if (user.role === 'super_admin' && siteId) {
          builder.where('departments.site_id', siteId);
        }
        if (search) {
          builder.where('departments.name', 'ilike', `%${search}%`);
        }
      });

    res.json({
      data: departments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        totalPages: Math.ceil(Number(count) / Number(limit))
      }
    });
  } catch (error) {
    console.error('List departments error:', error);
    res.status(500).json({ error: 'Failed to list departments' });
  }
};

export const getDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const department = await db('departments')
      .select('departments.*', 'sites.name as site_name', 'sites.company_id')
      .join('sites', 'departments.site_id', 'sites.id')
      .where('departments.id', id)
      .first();

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (user.role !== 'super_admin') {
      if (user.role === 'company_admin' && user.companyId !== department.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (user.role === 'site_admin' && user.siteId !== department.site_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (user.role === 'department_admin' && user.departmentId !== department.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [usersCount] = await db('users').where({ department_id: id }).count('* as count');

    res.json({
      ...department,
      stats: {
        users: Number(usersCount.count)
      }
    });
  } catch (error) {
    console.error('Get department error:', error);
    res.status(500).json({ error: 'Failed to get department' });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { name, siteId } = req.body;
    const user = req.user!;

    let targetSiteId = siteId;

    if (user.role === 'site_admin') {
      targetSiteId = user.siteId;
    } else if (user.role === 'company_admin') {
      const site = await db('sites').where({ id: siteId }).first();
      if (!site || site.company_id !== user.companyId) {
        return res.status(403).json({ error: 'Access denied to this site' });
      }
    } else if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const site = await db('sites').where({ id: targetSiteId }).first();
    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    const [department] = await db('departments')
      .insert({
        id: uuidv4(),
        site_id: targetSiteId,
        name
      })
      .returning('*');

    res.status(201).json(department);
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const user = req.user!;

    const department = await db('departments')
      .select('departments.*', 'sites.company_id')
      .join('sites', 'departments.site_id', 'sites.id')
      .where('departments.id', id)
      .first();

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (user.role !== 'super_admin') {
      if (user.role === 'company_admin' && user.companyId !== department.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (user.role === 'site_admin' && user.siteId !== department.site_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (user.role === 'department_admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const [updatedDepartment] = await db('departments')
      .where({ id })
      .update({
        name,
        updated_at: new Date()
      })
      .returning('*');

    res.json(updatedDepartment);
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const department = await db('departments')
      .select('departments.*', 'sites.company_id')
      .join('sites', 'departments.site_id', 'sites.id')
      .where('departments.id', id)
      .first();

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (user.role !== 'super_admin') {
      if (user.role === 'company_admin' && user.companyId !== department.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (user.role === 'site_admin' && user.siteId !== department.site_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (user.role !== 'company_admin' && user.role !== 'site_admin') {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    await db('departments').where({ id }).delete();

    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
};
