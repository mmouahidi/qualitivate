import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/database';

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
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
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
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
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
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
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
    console.error('Optional authentication error:', error);
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
