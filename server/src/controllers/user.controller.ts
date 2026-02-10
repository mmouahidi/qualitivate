import { Response } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';

const SALT_ROUNDS = 10;

export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { page = 1, limit = 20, search = '', role, companyId, siteId, departmentId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = db('users').select(
      'id', 'email', 'first_name', 'last_name', 'role',
      'company_id', 'site_id', 'department_id', 'is_active', 'created_at'
    );

    if (user.role === 'super_admin') {
      if (companyId) query = query.where('company_id', companyId);
      if (siteId) query = query.where('site_id', siteId);
      if (departmentId) query = query.where('department_id', departmentId);
    } else if (user.role === 'company_admin') {
      query = query.where('company_id', user.companyId!);
      if (siteId) query = query.where('site_id', siteId);
      if (departmentId) query = query.where('department_id', departmentId);
    } else if (user.role === 'site_admin') {
      query = query.where('site_id', user.siteId!);
      if (departmentId) query = query.where('department_id', departmentId);
    } else if (user.role === 'department_admin') {
      query = query.where('department_id', user.departmentId!);
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .where('email', 'ilike', `%${search}%`)
          .orWhere('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`);
      });
    }

    if (role) {
      query = query.where('role', role);
    }

    const users = await query
      .orderBy('created_at', 'desc')
      .limit(Number(limit))
      .offset(offset);

    const [{ count }] = await db('users')
      .count('* as count')
      .modify((builder) => {
        if (user.role === 'super_admin') {
          // Apply the same filters for super_admin count query
          if (companyId) builder.where('company_id', companyId);
          if (siteId) builder.where('site_id', siteId);
          if (departmentId) builder.where('department_id', departmentId);
        } else if (user.role === 'company_admin') {
          builder.where('company_id', user.companyId!);
          if (siteId) builder.where('site_id', siteId);
          if (departmentId) builder.where('department_id', departmentId);
        } else if (user.role === 'site_admin') {
          builder.where('site_id', user.siteId!);
          if (departmentId) builder.where('department_id', departmentId);
        } else if (user.role === 'department_admin') {
          builder.where('department_id', user.departmentId!);
        }
        if (search) {
          builder.where((qb) => {
            qb.where('email', 'ilike', `%${search}%`)
              .orWhere('first_name', 'ilike', `%${search}%`)
              .orWhere('last_name', 'ilike', `%${search}%`);
          });
        }
        if (role) {
          builder.where('role', role);
        }
      });

    res.json({
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(count),
        totalPages: Math.ceil(Number(count) / Number(limit))
      }
    });
  } catch (error) {
    logger.error('List users error:', { error });
    res.status(500).json({ error: 'Failed to list users' });
  }
};

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    const user = await db('users')
      .select('id', 'email', 'first_name', 'last_name', 'role',
        'company_id', 'site_id', 'department_id', 'is_active', 'created_at')
      .where({ id })
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.role !== 'super_admin') {
      if (currentUser.role === 'company_admin' && currentUser.companyId !== user.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (currentUser.role === 'site_admin' && currentUser.siteId !== user.site_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (currentUser.role === 'department_admin' && currentUser.departmentId !== user.department_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(user);
  } catch (error) {
    logger.error('Get user error:', { error });
    res.status(500).json({ error: 'Failed to get user' });
  }
};

export const inviteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { email, firstName, lastName, role, companyId, siteId, departmentId, password } = req.body;
    const currentUser = req.user!;

    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const allowedRoles = ['user'];
    if (currentUser.role === 'super_admin') {
      allowedRoles.push('super_admin', 'company_admin', 'site_admin', 'department_admin');
    } else if (currentUser.role === 'company_admin') {
      allowedRoles.push('company_admin', 'site_admin', 'department_admin');
    } else if (currentUser.role === 'site_admin') {
      allowedRoles.push('site_admin', 'department_admin');
    } else if (currentUser.role === 'department_admin') {
      allowedRoles.push('department_admin');
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Cannot assign this role' });
    }

    let targetCompanyId = companyId;
    let targetSiteId = siteId;
    let targetDepartmentId = departmentId;

    if (currentUser.role === 'company_admin') {
      targetCompanyId = currentUser.companyId;
    } else if (currentUser.role === 'site_admin') {
      targetCompanyId = currentUser.companyId;
      targetSiteId = currentUser.siteId;
    } else if (currentUser.role === 'department_admin') {
      targetCompanyId = currentUser.companyId;
      targetSiteId = currentUser.siteId;
      targetDepartmentId = currentUser.departmentId;
    }

    if (targetCompanyId) {
      const company = await db('companies').where({ id: targetCompanyId }).first();
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }
    }

    if (targetSiteId) {
      const site = await db('sites').where({ id: targetSiteId }).first();
      if (!site || (targetCompanyId && site.company_id !== targetCompanyId)) {
        return res.status(404).json({ error: 'Site not found or does not belong to company' });
      }
    }

    if (targetDepartmentId) {
      const department = await db('departments').where({ id: targetDepartmentId }).first();
      if (!department || (targetSiteId && department.site_id !== targetSiteId)) {
        return res.status(404).json({ error: 'Department not found or does not belong to site' });
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [newUser] = await db('users')
      .insert({
        id: uuidv4(),
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role,
        company_id: targetCompanyId || null,
        site_id: targetSiteId || null,
        department_id: targetDepartmentId || null,
        is_active: true
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'company_id', 'site_id', 'department_id']);

    res.status(201).json(newUser);
  } catch (error) {
    logger.error('Invite user error:', { error });
    res.status(500).json({ error: 'Failed to invite user' });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, role, isActive, siteId, departmentId } = req.body;
    const currentUser = req.user!;

    const user = await db('users').where({ id }).first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.role !== 'super_admin') {
      if (currentUser.role === 'company_admin' && currentUser.companyId !== user.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (currentUser.role === 'site_admin' && currentUser.siteId !== user.site_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (currentUser.role === 'department_admin' && currentUser.departmentId !== user.department_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const updateData: any = {
      updated_at: new Date()
    };

    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (isActive !== undefined) updateData.is_active = isActive;

    // Validate site belongs to user's company
    if (siteId !== undefined) {
      if (siteId === null) {
        updateData.site_id = null;
        updateData.department_id = null; // Clear department if site is cleared
      } else {
        const site = await db('sites').where({ id: siteId }).first();
        if (!site) {
          return res.status(404).json({ error: 'Site not found' });
        }
        // Ensure site belongs to user's company
        if (site.company_id !== user.company_id) {
          return res.status(400).json({ error: 'Site does not belong to user\'s company' });
        }
        // Check caller has scope over this site
        if (currentUser.role === 'site_admin' && currentUser.siteId !== siteId) {
          return res.status(403).json({ error: 'Cannot assign user to a different site' });
        }
        updateData.site_id = siteId;
      }
    }

    // Validate department belongs to user's site
    if (departmentId !== undefined) {
      if (departmentId === null) {
        updateData.department_id = null;
      } else {
        const department = await db('departments').where({ id: departmentId }).first();
        if (!department) {
          return res.status(404).json({ error: 'Department not found' });
        }
        // Use the new site_id if being updated, otherwise user's current site
        const targetSiteId = updateData.site_id !== undefined ? updateData.site_id : user.site_id;
        if (department.site_id !== targetSiteId) {
          return res.status(400).json({ error: 'Department does not belong to the specified site' });
        }
        // Check caller has scope over this department
        if (currentUser.role === 'department_admin' && currentUser.departmentId !== departmentId) {
          return res.status(403).json({ error: 'Cannot assign user to a different department' });
        }
        updateData.department_id = departmentId;
      }
    }

    if (role !== undefined && role !== user.role) {
      const allowedRoles = ['user'];
      if (currentUser.role === 'super_admin') {
        allowedRoles.push('super_admin', 'company_admin', 'site_admin', 'department_admin');
      } else if (currentUser.role === 'company_admin') {
        allowedRoles.push('company_admin', 'site_admin', 'department_admin');
      } else if (currentUser.role === 'site_admin') {
        allowedRoles.push('site_admin', 'department_admin');
      } else if (currentUser.role === 'department_admin') {
        allowedRoles.push('department_admin');
      }

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ error: 'Cannot assign this role' });
      }

      updateData.role = role;
    }

    const [updatedUser] = await db('users')
      .where({ id })
      .update(updateData)
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'company_id', 'site_id', 'department_id', 'is_active']);

    res.json(updatedUser);
  } catch (error) {
    logger.error('Update user error:', { error });
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;

    if (id === currentUser.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const user = await db('users').where({ id }).first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (currentUser.role !== 'super_admin') {
      if (currentUser.role === 'company_admin' && currentUser.companyId !== user.company_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (currentUser.role === 'site_admin' && currentUser.siteId !== user.site_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      // Note: department_admin is blocked at route level
    }

    await db('users').where({ id }).delete();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', { error });
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

/**
 * Bulk create users from CSV/array data
 */
export const bulkCreateUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { users } = req.body;
    const currentUser = req.user!;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ error: 'Users array is required' });
    }

    if (users.length > 500) {
      return res.status(400).json({ error: 'Maximum 500 users per batch' });
    }

    const results = {
      created: 0,
      failed: [] as { email: string; error: string }[]
    };

    for (const userData of users) {
      try {
        const { email, firstName, lastName, role = 'user', companyId, siteId, departmentId, password } = userData;

        if (!email || !password) {
          results.failed.push({ email: email || 'unknown', error: 'Email and password are required' });
          continue;
        }

        // Check if email exists
        const existingUser = await db('users').where({ email }).first();
        if (existingUser) {
          results.failed.push({ email, error: 'Email already exists' });
          continue;
        }

        // Validate role
        const allowedRoles = ['user'];
        if (currentUser.role === 'super_admin') {
          allowedRoles.push('super_admin', 'company_admin', 'site_admin', 'department_admin');
        } else if (currentUser.role === 'company_admin') {
          allowedRoles.push('company_admin', 'site_admin', 'department_admin');
        } else if (currentUser.role === 'site_admin') {
          allowedRoles.push('site_admin', 'department_admin');
        } else if (currentUser.role === 'department_admin') {
          allowedRoles.push('department_admin');
        }

        if (!allowedRoles.includes(role)) {
          results.failed.push({ email, error: 'Cannot assign this role' });
          continue;
        }

        // Set target company/site/department based on current user role
        let targetCompanyId = companyId;
        let targetSiteId = siteId;
        let targetDepartmentId = departmentId;

        if (currentUser.role === 'company_admin') {
          targetCompanyId = currentUser.companyId;
        } else if (currentUser.role === 'site_admin') {
          targetCompanyId = currentUser.companyId;
          targetSiteId = currentUser.siteId;
        } else if (currentUser.role === 'department_admin') {
          targetCompanyId = currentUser.companyId;
          targetSiteId = currentUser.siteId;
          targetDepartmentId = currentUser.departmentId;
        }

        // Validate company
        if (targetCompanyId) {
          const company = await db('companies').where({ id: targetCompanyId }).first();
          if (!company) {
            results.failed.push({ email, error: 'Company not found' });
            continue;
          }
        }

        // Validate site
        if (targetSiteId) {
          const site = await db('sites').where({ id: targetSiteId }).first();
          if (!site || (targetCompanyId && site.company_id !== targetCompanyId)) {
            results.failed.push({ email, error: 'Site not found or does not belong to company' });
            continue;
          }
        }

        // Validate department
        if (targetDepartmentId) {
          const department = await db('departments').where({ id: targetDepartmentId }).first();
          if (!department || (targetSiteId && department.site_id !== targetSiteId)) {
            results.failed.push({ email, error: 'Department not found or does not belong to site' });
            continue;
          }
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        await db('users').insert({
          id: uuidv4(),
          email,
          password_hash: passwordHash,
          first_name: firstName || '',
          last_name: lastName || '',
          role,
          company_id: targetCompanyId || null,
          site_id: targetSiteId || null,
          department_id: targetDepartmentId || null,
          is_active: true
        });

        results.created++;
      } catch (err: any) {
        results.failed.push({ email: userData.email || 'unknown', error: err.message || 'Unknown error' });
      }
    }

    res.status(201).json(results);
  } catch (error) {
    logger.error('Bulk create users error:', { error });
    res.status(500).json({ error: 'Failed to bulk create users' });
  }
};
