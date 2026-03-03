import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import logger from '../config/logger';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId?: string;
    siteId?: string;
    departmentId?: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);

    let decoded: any;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' });
    }

    const user = await db('users')
      .where({ id: decoded.userId, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company_id,
      siteId: user.site_id,
      departmentId: user.department_id
    };

    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// In-memory permission cache (role -> Set<permission>)
let permissionCache: Map<string, Set<string>> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

// Exported so RBAC controller can invalidate on update
export const invalidatePermissionCache = () => {
  permissionCache = null;
  cacheTimestamp = 0;
};

const loadPermissions = async (): Promise<Map<string, Set<string>>> => {
  const now = Date.now();
  if (permissionCache && now - cacheTimestamp < CACHE_TTL_MS) {
    return permissionCache;
  }

  const rows = await db('role_permissions').select('role', 'permission');
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!map.has(row.role)) map.set(row.role, new Set());
    map.get(row.role)!.add(row.permission);
  }
  permissionCache = map;
  cacheTimestamp = now;
  return map;
};

/**
 * Authorize middleware — supports both legacy roles and dynamic permissions.
 * 
 * Legacy usage (role names):  authorize('super_admin', 'company_admin')
 * Permission usage (colon):   authorize('templates:write')
 * Mixed usage:                authorize('super_admin', 'templates:write')
 * 
 * super_admin ALWAYS passes regardless of what is checked.
 */
export const authorize = (...rolesOrPermissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // super_admin always passes
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Split into role checks and permission checks
    const roleChecks = rolesOrPermissions.filter((r) => !r.includes(':'));
    const permChecks = rolesOrPermissions.filter((r) => r.includes(':'));

    // Legacy role-based check: if user's role is in the allowed list, pass
    if (roleChecks.length > 0 && roleChecks.includes(req.user.role)) {
      return next();
    }

    // Dynamic permission check: check if user's role has any of the required permissions
    if (permChecks.length > 0) {
      try {
        const permMap = await loadPermissions();
        const userPerms = permMap.get(req.user.role);
        if (userPerms) {
          const hasPermission = permChecks.some((p) => userPerms.has(p));
          if (hasPermission) {
            return next();
          }
        }
      } catch (error) {
        logger.error('Error checking dynamic permissions', { error });
        // Fall through to forbidden
      }
    }

    return res.status(403).json({ error: 'Forbidden' });
  };
};

// Optional authentication - doesn't fail if no token, just attaches user if present
export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without user
    }

    const token = authHeader.substring(7);

    let decoded: any;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (err: any) {
      return next(); // Invalid token, continue without user
    }

    const user = await db('users')
      .where({ id: decoded.userId, is_active: true })
      .first();

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
        siteId: user.site_id,
        departmentId: user.department_id
      };
    }

    next();
  } catch (error) {
    logger.warn('Optional authentication error', { error });
    next(); // Continue even on error
  }
};

export const checkCompanyAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { companyId } = req.params;
    const user = req.user!;

    if (user.role === 'super_admin') {
      return next();
    }

    if (user.role === 'company_admin' && user.companyId === companyId) {
      return next();
    }

    return res.status(403).json({ error: 'Access denied to this company' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

export const checkSiteAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { siteId } = req.params;
    const user = req.user!;

    if (user.role === 'super_admin') {
      return next();
    }

    const site = await db('sites').where({ id: siteId }).first();

    if (!site) {
      return res.status(404).json({ error: 'Site not found' });
    }

    if (user.role === 'company_admin' && user.companyId === site.company_id) {
      return next();
    }

    if (user.role === 'site_admin' && user.siteId === siteId) {
      return next();
    }

    return res.status(403).json({ error: 'Access denied to this site' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

export const checkDepartmentAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { departmentId } = req.params;
    const user = req.user!;

    if (user.role === 'super_admin') {
      return next();
    }

    const department = await db('departments')
      .join('sites', 'departments.site_id', 'sites.id')
      .where('departments.id', departmentId)
      .select('departments.*', 'sites.company_id')
      .first();

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    if (user.role === 'company_admin' && user.companyId === department.company_id) {
      return next();
    }

    if (user.role === 'site_admin' && user.siteId === department.site_id) {
      return next();
    }

    if (user.role === 'department_admin' && user.departmentId === departmentId) {
      return next();
    }

    return res.status(403).json({ error: 'Access denied to this department' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};
