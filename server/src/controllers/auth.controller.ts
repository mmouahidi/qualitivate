import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { env } from '../config/env';
import { AuthRequest } from '../middlewares/auth.middleware';
import { parseTokenExpiry } from '../utils/token';
import logger from '../config/logger';

const SALT_ROUNDS = 10;
const MAX_REFRESH_TOKENS_PER_USER = 5;

// JWT configuration with proper typing
const getAccessTokenOptions = (): SignOptions => ({
  expiresIn: env.JWT_EXPIRES_IN as any
});

const getRefreshTokenOptions = (): SignOptions => ({
  expiresIn: env.JWT_REFRESH_EXPIRES_IN as any
});

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [user] = await db('users')
      .insert({
        id: uuidv4(),
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role: 'user',
        company_id: null,
        site_id: null,
        department_id: null,
        is_active: true
      })
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'company_id', 'site_id', 'department_id']);

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      getAccessTokenOptions()
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      env.JWT_REFRESH_SECRET,
      getRefreshTokenOptions()
    );

    const refreshExpiryMs = parseTokenExpiry(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + refreshExpiryMs);

    await db('refresh_tokens').insert({
      id: uuidv4(),
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: user.company_id,
        siteId: user.site_id,
        departmentId: user.department_id
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Register error:', { error });
    res.status(500).json({ error: 'Failed to register user' });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db('users').where({ email, is_active: true }).first();

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const existingTokens = await db('refresh_tokens')
      .where({ user_id: user.id })
      .where('expires_at', '>', new Date())
      .orderBy('created_at', 'desc');

    if (existingTokens.length >= MAX_REFRESH_TOKENS_PER_USER) {
      const tokensToDelete = existingTokens.slice(MAX_REFRESH_TOKENS_PER_USER - 1);
      await db('refresh_tokens')
        .whereIn('id', tokensToDelete.map(t => t.id))
        .delete();
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      getAccessTokenOptions()
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      env.JWT_REFRESH_SECRET,
      getRefreshTokenOptions()
    );

    const refreshExpiryMs = parseTokenExpiry(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + refreshExpiryMs);

    await db('refresh_tokens').insert({
      id: uuidv4(),
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: user.company_id,
        siteId: user.site_id,
        departmentId: user.department_id
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    logger.error('Login error:', { error });
    // In development, return the actual error to help debugging
    if (env.NODE_ENV !== 'production') {
      return res.status(500).json({
        error: 'Failed to login',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
    res.status(500).json({ error: 'Failed to login' });
  }
};

export const refreshAccessToken = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Refresh token expired' });
      }
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const tokenRecord = await db('refresh_tokens')
      .where({ token: refreshToken, user_id: decoded.userId })
      .where('expires_at', '>', new Date())
      .first();

    if (!tokenRecord) {
      return res.status(401).json({ error: 'Refresh token not found or expired' });
    }

    const user = await db('users').where({ id: decoded.userId, is_active: true }).first();

    if (!user) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      getAccessTokenOptions()
    );

    res.json({ accessToken });
  } catch (error) {
    logger.error('Refresh token error:', { error });
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await db('refresh_tokens').where({ token: refreshToken }).delete();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', { error });
    res.status(500).json({ error: 'Failed to logout' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { firstName, lastName, first_name, last_name, avatarStyle, avatar_style } = req.body;
    const resolvedFirstName = firstName !== undefined ? firstName : first_name;
    const resolvedLastName = lastName !== undefined ? lastName : last_name;
    const resolvedAvatarStyle = avatarStyle !== undefined ? avatarStyle : avatar_style;

    const updateData: Record<string, any> = {};
    if (resolvedFirstName !== undefined) updateData.first_name = resolvedFirstName;
    if (resolvedLastName !== undefined) updateData.last_name = resolvedLastName;
    if (resolvedAvatarStyle !== undefined) updateData.avatar_style = resolvedAvatarStyle;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateData.updated_at = new Date();

    const [updated] = await db('users')
      .where({ id: req.user.id })
      .update(updateData)
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'company_id', 'site_id', 'department_id', 'avatar_style']);

    res.json({
      id: updated.id,
      email: updated.email,
      firstName: updated.first_name,
      lastName: updated.last_name,
      role: updated.role,
      companyId: updated.company_id,
      siteId: updated.site_id,
      departmentId: updated.department_id,
      avatarStyle: updated.avatar_style
    });
  } catch (error) {
    logger.error('Update profile error:', { error });
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const updateCredentials = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { currentPassword, newPassword, email } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required' });
    }

    if (!newPassword && !email) {
      return res.status(400).json({ error: 'At least one of email or newPassword must be provided' });
    }

    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const updateData: Record<string, any> = { updated_at: new Date() };

    if (email && email !== user.email) {
      const existing = await db('users')
        .whereRaw('lower(email) = lower(?)', [email])
        .first();
      if (existing && existing.id !== user.id) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      updateData.email = email;
    }

    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
      }
      updateData.password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    }

    if (Object.keys(updateData).length === 1) {
      return res.status(400).json({ error: 'No valid credential changes provided' });
    }

    const [updated] = await db('users')
      .where({ id: user.id })
      .update(updateData)
      .returning(['id', 'email', 'first_name', 'last_name', 'role', 'company_id', 'site_id', 'department_id']);

    await db('refresh_tokens').where({ user_id: user.id }).delete();

    res.json({
      user: {
        id: updated.id,
        email: updated.email,
        firstName: updated.first_name,
        lastName: updated.last_name,
        role: updated.role,
        companyId: updated.company_id,
        siteId: updated.site_id,
        departmentId: updated.department_id
      },
      requiresReauth: true
    });
  } catch (error) {
    logger.error('Update credentials error:', { error });
    res.status(500).json({ error: 'Failed to update credentials' });
  }
};

export const me = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await db('users')
      .where({ id: req.user.id })
      .select('id', 'email', 'first_name', 'last_name', 'role', 'company_id', 'site_id', 'department_id', 'avatar_style')
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      companyId: user.company_id,
      siteId: user.site_id,
      departmentId: user.department_id,
      avatarStyle: user.avatar_style
    });
  } catch (error) {
    logger.error('Me error:', { error });
    res.status(500).json({ error: 'Failed to get user info' });
  }
};
